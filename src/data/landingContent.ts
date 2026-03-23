export interface Testimonial {
    quote: string;
    author: string;
    role: string;
    location: string;
}

export interface Feature {
    iconName: "Phone" | "MessageSquare" | "Calendar" | "CreditCard" | "Users" | "LayoutDashboard" | string;
    title: string;
    description: string;
}

export interface PricingTier {
    name: string;
    price: string;
    subtitle: string;
    features: string[];
    buttonText: string;
    isCustom?: boolean;
}

export interface LandingContent {
    hero: {
        taglinePhase1: string;
        taglinePhase2: string;
    };
    features: Feature[];
    testimonials: Testimonial[];
    pricing: PricingTier[];
    stats: {
        institutes: string;
        students: string;
        collected: string;
    };
    mockups: {
        studentList: { name: string; amount: string; status: "Paid" | "Pending" }[];
        attendance: { present: number; total: number; percentage: number };
        feesCollected: string;
    };
}

export const landingContent: LandingContent = {
    hero: {
        taglinePhase1: "Running a coaching institute shouldn't feel like this.",
        taglinePhase2: "What if everything just... worked?",
    },
    mockups: {
        studentList: [
            { name: "Rahul Sharma", amount: "₹2,000/mo", status: "Paid" },
            { name: "Priya Patel", amount: "₹1,500/mo", status: "Pending" },
            { name: "Karan Singh", amount: "₹2,500/mo", status: "Paid" },
        ],
        attendance: { present: 42, total: 45, percentage: 93 },
        feesCollected: "₹1,24,500",
    },
    features: [
        {
            iconName: "MessageSquare",
            title: "Automated fee reminders via WhatsApp",
            description: "Stop chasing parents for fees. Let Classaathi send polite, automated reminders securely.",
        },
        {
            iconName: "Calendar",
            title: "One-tap attendance with absent alerts",
            description: "Mark attendance in seconds. Parents get instant WhatsApp notifications if their child is absent.",
        },
        {
            iconName: "CreditCard",
            title: "Razorpay payment links — collect online",
            description: "Send professional payment links and get money directly in your bank account.",
        },
        {
            iconName: "Users",
            title: "Multi-teacher support for institutes",
            description: "Manage your entire team. Assign batches to teachers and securely share dashboards.",
        },
    ],
    testimonials: [
        {
            quote: "Classaathi replaced my register book and 3 WhatsApp groups. I get my fees on time now.",
            author: "Rajesh Sir",
            role: "Physics Tutor",
            location: "Kota",
        },
        {
            quote: "I manage 200 students across 4 teachers. The dashboard shows me everything.",
            author: "Sunita Ma'am",
            role: "Bright Future Academy",
            location: "Pune",
        },
        {
            quote: "Parents love the payment links. No more cash collection headaches.",
            author: "Amit Sir",
            role: "Maths Classes",
            location: "Lucknow",
        },
    ],
    stats: {
        institutes: "500+",
        students: "50,000+",
        collected: "₹2Cr+",
    },
    pricing: [
        {
            name: "Pro",
            price: "₹999/month",
            subtitle: "Perfect for solo tutors",
            features: [
                "Unlimited Students",
                "Automated WhatsApp Reminders",
                "Online Fee Collection",
                "Attendance Management",
            ],
            buttonText: "Start Free",
            isCustom: false,
        },
        {
            name: "Enterprise",
            price: "Custom",
            subtitle: "For institutes with multiple teachers",
            features: [
                "Everything in Pro",
                "Multi-teacher access",
                "Custom branding",
                "Dedicated account manager",
            ],
            buttonText: "Contact Us",
            isCustom: true,
        },
    ],
};
