export interface Feature {
  icon: string; // lucide-react icon name
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Testimonial {
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export const heroContent = {
  preTitle: "Introducing",
  title: "Classaathi",
  subtitle: "Your Coaching Institute, Simplified.",
  description: "Manage students, batches, attendance, fees, and parent communication — all from one powerful platform built for Indian coaching institutes.",
  cta: "Start Free Trial",
  secondaryCta: "Watch Demo",
};

export const features: Feature[] = [
  {
    icon: "Users",
    title: "Student Management",
    description: "Add students, assign to batches, track across multiple teachers. One student, complete visibility.",
  },
  {
    icon: "CalendarCheck",
    title: "Smart Attendance",
    description: "Mark attendance per batch session. Each present entry auto-generates a fee record. No manual ledger work.",
  },
  {
    icon: "IndianRupee",
    title: "Fee Collection",
    description: "Per-student, per-teacher fee tracking. Monthly ledgers, payment status, and automated WhatsApp reminders.",
  },
  {
    icon: "MessageCircle",
    title: "WhatsApp Integration",
    description: "Send fee reminders, attendance alerts, and custom messages to parents directly via WhatsApp. No app download needed.",
  },
  {
    icon: "LayoutGrid",
    title: "Batch Scheduling",
    description: "Create unlimited batches with custom timings. Assign students to multiple batches across different subjects.",
  },
  {
    icon: "Shield",
    title: "Multi-Teacher Support",
    description: "Each teacher manages their own students, fees, and batches independently — all under one institute account.",
  },
];

export const stats: Stat[] = [
  { value: "500+", label: "Coaching Institutes" },
  { value: "50,000+", label: "Students Managed" },
  { value: "2L+", label: "WhatsApp Messages Sent" },
  { value: "99.9%", label: "Uptime" },
];

export const testimonials: Testimonial[] = [
  {
    name: "Rajesh Sharma",
    role: "Owner, Sharma Classes",
    location: "Kota, Rajasthan",
    quote: "Before Classaathi, I was tracking 200 students in notebooks. Now everything is on my phone. Fee collection improved by 40% in the first month.",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "Mathematics Teacher",
    location: "Kochi, Kerala",
    quote: "The WhatsApp integration is a game-changer. Parents get automatic updates, and I spend zero time on manual follow-ups.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Director, Patel Academy",
    location: "Ahmedabad, Gujarat",
    quote: "We have 8 teachers and 15 batches. Classaathi handles the complexity beautifully. The multi-teacher fee tracking alone is worth it.",
    rating: 5,
  },
];

export const pricing: PricingTier[] = [
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "Perfect for individual tutors",
    features: [
      "Unlimited Students",
      "Batch Scheduling",
      "Attendance Tracking",
      "Fee Management",
      "WhatsApp Reminders",
      "Mobile Dashboard",
    ],
    highlighted: false,
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹1,999",
    period: "/month",
    description: "For coaching institutes with multiple teachers",
    features: [
      "Everything in Pro",
      "Multi-Teacher Support",
      "Institute-wide Analytics",
      "Teacher Performance Reports",
      "Custom WhatsApp Templates",
      "Priority Support",
      "Dedicated Account Manager",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
];

export const faqItems = [
  {
    question: "Do I need to install any app?",
    answer: "Classaathi is a web app — it works on any browser, phone, tablet, or computer. No downloads needed. Parents receive updates via WhatsApp, so they don't need any app either.",
  },
  {
    question: "How does the WhatsApp integration work?",
    answer: "We use the official Meta WhatsApp Cloud API. Once connected, you can send fee reminders, attendance alerts, and custom messages to parents directly from your dashboard.",
  },
  {
    question: "Can multiple teachers use it independently?",
    answer: "Yes! With the Enterprise plan, each teacher gets their own dashboard to manage their students, batches, and fees independently. The institute owner sees everything across all teachers.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use Supabase with Row-Level Security, meaning each institute's data is completely isolated. All data is encrypted in transit and at rest.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains available for 30 days after cancellation. You can export everything as CSV at any time. We never sell or share your data.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes — 14 days, full access, no credit card required. Start managing your institute today.",
  },
];
