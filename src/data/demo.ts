import type {
  Activity,
  DemoProject,
  RevenuePoint,
} from "@/types";

/**
 * Realistic demo data for the dashboard UI.
 *
 * This is static placeholder content only — nothing here reads from or writes
 * to Supabase yet. Swap it for real queries in a later phase.
 */

export const overview = {
  revenue: {
    label: "Monthly revenue",
    value: 84200,
    delta: 12.4,
    deltaLabel: "vs last month",
    positive: true,
    suffix: "%",
    spark: [48, 52, 49, 61, 58, 67, 70, 74, 84],
  },
  clients: {
    label: "Active clients",
    value: 38,
    delta: 6,
    deltaLabel: "this month",
    positive: true,
    suffix: "",
    spark: [26, 28, 27, 31, 30, 33, 35, 36, 38],
  },
  projects: {
    label: "Open projects",
    value: 12,
    delta: 2,
    deltaLabel: "this month",
    positive: true,
    suffix: "",
    spark: [8, 9, 9, 10, 11, 10, 12, 13, 12],
  },
  invoices: {
    label: "Pending invoices",
    value: 7,
    delta: 3,
    deltaLabel: "awaiting payment",
    positive: false,
    suffix: "",
    spark: [3, 4, 4, 6, 5, 8, 9, 7, 7],
  },
};

export const revenue: RevenuePoint[] = [
  { month: "Jan", revenue: 48200, expenses: 21400 },
  { month: "Feb", revenue: 52600, expenses: 22800 },
  { month: "Mar", revenue: 49800, expenses: 21900 },
  { month: "Apr", revenue: 61400, expenses: 24600 },
  { month: "May", revenue: 58900, expenses: 24100 },
  { month: "Jun", revenue: 67300, expenses: 26900 },
  { month: "Jul", revenue: 70500, expenses: 27800 },
  { month: "Aug", revenue: 74800, expenses: 29100 },
  { month: "Sep", revenue: 84200, expenses: 31200 },
];

export const projects: DemoProject[] = [
  {
    id: "p1",
    name: "Atlas rebrand",
    client: "Northwind Labs",
    status: "on-track",
    progress: 72,
    due: "2026-10-14",
    team: ["AR", "MK", "JL"],
  },
  {
    id: "p2",
    name: "Commerce platform",
    client: "Lumen & Co.",
    status: "on-track",
    progress: 46,
    due: "2026-11-02",
    team: ["JL", "TS", "MK", "AR"],
  },
  {
    id: "p3",
    name: "Mobile app MVP",
    client: "Kite Health",
    status: "at-risk",
    progress: 31,
    due: "2026-10-21",
    team: ["TS", "EP"],
  },
  {
    id: "p4",
    name: "Data migration",
    client: "Ferrum Finance",
    status: "completed",
    progress: 100,
    due: "2026-09-18",
    team: ["EP", "AR"],
  },
  {
    id: "p5",
    name: "Brand guidelines",
    client: "Northwind Labs",
    status: "planned",
    progress: 0,
    due: "2026-12-05",
    team: ["MK"],
  },
];

export const activity: Activity[] = [
  {
    id: "a1",
    actor: "Maya Khan",
    actorInitials: "MK",
    action: "marked the invoice",
    target: "INV-2042",
    time: "2026-09-27T09:24:00Z",
  },
  {
    id: "a2",
    actor: "Arjun Rao",
    actorInitials: "AR",
    action: "completed the task",
    target: "Send September invoices",
    time: "2026-09-27T08:12:00Z",
  },
  {
    id: "a3",
    actor: "Jonas Lind",
    actorInitials: "JL",
    action: "added a comment to",
    target: "Commerce platform",
    time: "2026-09-26T17:40:00Z",
  },
  {
    id: "a4",
    actor: "Tara Singh",
    actorInitials: "TS",
    action: "moved the project",
    target: "Mobile app MVP",
    time: "2026-09-26T14:05:00Z",
  },
  {
    id: "a5",
    actor: "Elena Petrov",
    actorInitials: "EP",
    action: "invited a teammate to",
    target: "Ferrum Finance",
    time: "2026-09-26T11:32:00Z",
  },
];
