import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════════════════
// CORS Configuration
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization, X-Requested-With";
const CORS_MAX_AGE = "86400";

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
    "Access-Control-Max-Age": CORS_MAX_AGE,
    Vary: "Origin",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limit Configuration
// ═══════════════════════════════════════════════════════════════════════════

// ── IP-based limits (unauthenticated / public routes) ────────────────────
const RL_AUTH_MAX =
  Number(process.env.RATE_LIMIT_AUTH_MAX) || 10;
const RL_AUTH_WINDOW =
  Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000;

const RL_WEBHOOK_MAX =
  Number(process.env.RATE_LIMIT_WEBHOOK_MAX) || 200;
const RL_WEBHOOK_WINDOW =
  Number(process.env.RATE_LIMIT_WEBHOOK_WINDOW_MS) || 60 * 1000;

// ── Plan-based limits (authenticated routes, per-user) ───────────────────
const PLAN_LIMITS = {
  pro: {
    api: {
      max: Number(process.env.RATE_LIMIT_PRO_API_MAX) || 100,
      windowMs: Number(process.env.RATE_LIMIT_PRO_API_WINDOW_MS) || 60_000,
    },
    sensitive: {
      max: Number(process.env.RATE_LIMIT_PRO_SENSITIVE_MAX) || 20,
      windowMs: Number(process.env.RATE_LIMIT_PRO_SENSITIVE_WINDOW_MS) || 60_000,
    },
  },
  enterprise: {
    api: {
      max: Number(process.env.RATE_LIMIT_ENTERPRISE_API_MAX) || 500,
      windowMs: Number(process.env.RATE_LIMIT_ENTERPRISE_API_WINDOW_MS) || 60_000,
    },
    sensitive: {
      max: Number(process.env.RATE_LIMIT_ENTERPRISE_SENSITIVE_MAX) || 100,
      windowMs: Number(process.env.RATE_LIMIT_ENTERPRISE_SENSITIVE_WINDOW_MS) || 60_000,
    },
  },
} as const;

// Routes that trigger external API calls (WhatsApp, Razorpay) and cost money.
// These get a tighter, separate rate-limit bucket.
const SENSITIVE_ROUTES = [
  "/api/reminders/send",   // Razorpay payment links + WhatsApp
  "/api/broadcast",        // WhatsApp to multiple students
  "/api/whatsapp/send",    // Single WhatsApp message
  "/api/attendance",       // POST sends WhatsApp for absent students
];

function isSensitiveRoute(pathname: string): boolean {
  return SENSITIVE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Plan Cache  (avoids a DB query on every single request)
// ═══════════════════════════════════════════════════════════════════════════

type PlanInfo = { plan: "pro" | "enterprise"; expiresAt: number };
const planCache = new Map<string, PlanInfo>();
const PLAN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserPlan(supabase: any, userId: string): Promise<"pro" | "enterprise"> {
  const cached = planCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.plan;
  }

  const { data: member } = await supabase
    .from("institute_members")
    .select("institutes(plan)")
    .eq("user_id", userId)
    .single();

  const plan =
    ((member?.institutes as Record<string, string> | null)?.plan as "pro" | "enterprise") ?? "pro";

  planCache.set(userId, { plan, expiresAt: Date.now() + PLAN_CACHE_TTL });

  // Prevent unbounded growth
  if (planCache.size > 5_000) planCache.clear();

  return plan;
}

// ═══════════════════════════════════════════════════════════════════════════
// Route helpers
// ═══════════════════════════════════════════════════════════════════════════

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "unknown"
  );
}

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify",
  "/api/auth/logout",
  "/api/razorpay/webhook",
  "/api/whatsapp/webhook",
];

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/students",
  "/payments",
  "/past-papers",
  "/attendance",
  "/batches",
  "/teacher",
  "/admin",
  "/onboarding",
  "/teacher-onboarding",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const isApi = pathname.startsWith("/api/");

  // ── 1. CORS Preflight ──────────────────────────────────────────────
  if (request.method === "OPTIONS" && isApi) {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // ── 2. IP-based rate limiting for public routes ────────────────────
  // Applied BEFORE auth so we don't waste a Supabase call on spam.
  let rlResult: RateLimitResult | null = null;

  if (isApi && isPublicApiRoute(pathname)) {
    const ip = getClientIp(request);

    let max: number, windowMs: number, prefix: string;
    if (pathname.startsWith("/api/auth/")) {
      max = RL_AUTH_MAX;
      windowMs = RL_AUTH_WINDOW;
      prefix = "auth";
    } else {
      // webhooks
      max = RL_WEBHOOK_MAX;
      windowMs = RL_WEBHOOK_WINDOW;
      prefix = "wh";
    }

    rlResult = checkRateLimit(`${prefix}:${ip}`, max, windowMs);

    if (!rlResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin),
            ...rateLimitHeaders(rlResult),
            "Retry-After": String(
              Math.ceil((rlResult.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }
  }

  // ── 3. Supabase Session Refresh ────────────────────────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 4. Auth enforcement (defense-in-depth) ─────────────────────────
  if (isApi && !isPublicApiRoute(pathname) && !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: getCorsHeaders(origin) }
    );
  }

  // ── 5. Plan-based rate limiting for authenticated API routes ───────
  // Runs AFTER auth so we know the user's identity and plan.
  //   Pro plan:        100 req/min general, 20 req/min sensitive
  //   Enterprise plan: 500 req/min general, 100 req/min sensitive
  if (isApi && !isPublicApiRoute(pathname) && user) {
    const plan = await getUserPlan(supabase, user.id);
    const sensitive = isSensitiveRoute(pathname);
    const bucket = sensitive ? "sensitive" : "api";
    const config = PLAN_LIMITS[plan][bucket];
    const key = `${bucket}:${user.id}`;

    rlResult = checkRateLimit(key, config.max, config.windowMs);

    if (!rlResult.success) {
      const retryAfter = Math.ceil(
        (rlResult.resetTime - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: `Rate limit exceeded for your ${plan} plan.${
            plan === "pro"
              ? " Upgrade to Enterprise for higher limits."
              : " Please wait and try again."
          }`,
          plan,
          limit: rlResult.limit,
          window_seconds: Math.ceil(config.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin),
            ...rateLimitHeaders(rlResult),
            "Retry-After": String(retryAfter),
          },
        }
      );
    }
  }

  // ── 6. Page Route Auth ─────────────────────────────────────────────
  if (isProtectedPage(pathname) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 6b. Redirect logged-in users away from auth pages ─────────────
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── 7. Teacher → /teacher redirect ─────────────────────────────────
  if (user && pathname === "/dashboard") {
    const { data: member } = await supabase
      .from("institute_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (member?.role === "teacher") {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
  }

  // ── 8. Attach CORS + Rate-Limit headers to successful responses ────
  if (isApi) {
    const corsHeaders = getCorsHeaders(origin);
    Object.keys(corsHeaders).forEach((key) => {
      response.headers.set(key, corsHeaders[key]);
    });
    if (rlResult) {
      const rlHeaders = rateLimitHeaders(rlResult);
      Object.keys(rlHeaders).forEach((key) => {
        response.headers.set(key, rlHeaders[key]);
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
