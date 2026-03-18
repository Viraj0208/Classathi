/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing (stops browsers from interpreting
          // files as a different MIME type than declared)
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Prevent clickjacking — the app should never be embedded in
          // an iframe on another domain
          { key: "X-Frame-Options", value: "DENY" },

          // Legacy XSS filter for older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // Only send the origin (not the full URL) as referrer to
          // third-party sites; send the full referrer to same-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Disable browser features the app doesn't need
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
