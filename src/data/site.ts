import type { LucideIcon } from "lucide-react";
import {
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

export const site = {
  name: "MANNAT",
  legalName: "Mannat Labs",
  tagline: "Run your entire business from one place.",
  description:
    "MANNAT is the business-management platform for modern teams — clients, projects, tasks, invoices and analytics in a single, focused workspace.",
  url: "https://mannat.app",
  email: "hello@mannat.app",
} as const;

export const marketingNav: { label: string; href: string }[] = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: Users,
    title: "Clients",
    description:
      "Keep every client, contact and engagement in one place, with the full history of every project and invoice.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    description:
      "Plan, scope and track work from kickoff to delivery with clear ownership, timelines and progress.",
  },
  {
    icon: CheckSquare,
    title: "Tasks",
    description:
      "Break work into focused tasks, assign priorities and keep momentum visible across the whole team.",
  },
  {
    icon: FileText,
    title: "Invoices",
    description:
      "Create, send and track invoices and payments so billing never becomes a bottleneck again.",
  },
  {
    icon: ShieldCheck,
    title: "Team management",
    description:
      "Invite teammates, define roles and control permissions so everyone sees exactly what they need.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Revenue, utilization and pipeline at a glance — the numbers that matter, without the noise.",
  },
];

export type PricingPlan = {
  name: string;
  price: string;
  unit: string;
  description: string;
  cta: string;
  highlighted?: boolean;
  comingSoon?: boolean;
  features: string[];
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    unit: "forever",
    description: "Run your whole business — clients, projects, tasks, invoices and time.",
    cta: "Start free",
    features: [
      "Unlimited projects",
      "Unlimited tasks",
      "Invoicing",
      "Time tracking & work logs",
    ],
  },
  {
    name: "Pro",
    price: "Coming soon",
    unit: "",
    description: "For growing teams — paid plans are on the roadmap.",
    cta: "Coming soon",
    highlighted: true,
    comingSoon: true,
    features: [
      "Everything in Free",
      "Advanced reporting",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    price: "Coming soon",
    unit: "",
    description: "For agencies and larger organisations.",
    cta: "Coming soon",
    comingSoon: true,
    features: [
      "Everything in Pro",
      "Role-based permissions",
      "Dedicated support",
    ],
  },
];

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#product" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];
