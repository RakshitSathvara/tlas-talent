import type { User } from "@/types/domain";

// A reference identity / fallback. The *active* user is resolved from the session cookie
// at sign-in (see lib/auth/session.ts + lib/auth/credentials.ts) — any of the demo accounts.
export const currentUser: User = {
  id: "u1",
  name: "Rakshit Patel",
  email: "rakshit@tmsystems.in",
  role: "leadership",
  title: "Chief Executive",
  initials: "RP",
  tint: "#D4A574",
};

export const users: User[] = [
  currentUser,
  {
    id: "u2",
    name: "Priya Shah",
    email: "priya@tmsystems.in",
    role: "hr",
    title: "Head of Talent",
    initials: "PS",
    tint: "#C8A48F",
  },
  {
    id: "u3",
    name: "Karan Joshi",
    email: "karan@tmsystems.in",
    role: "hr",
    title: "Senior Recruiter",
    initials: "KJ",
    tint: "#A88B6E",
  },
  {
    id: "u4",
    name: "Aarav Nair",
    email: "aarav@tmsystems.in",
    role: "leadership",
    title: "Platform Lead",
    initials: "AN",
    tint: "#5A6F8C",
  },
  {
    id: "u5",
    name: "Meghna Iyer",
    email: "meghna@tmsystems.in",
    role: "interviewer",
    title: "Senior Engineer",
    initials: "MI",
    tint: "#9CB39B",
  },
  {
    id: "u6",
    name: "Dev Anand",
    email: "dev@tmsystems.in",
    role: "interviewer",
    title: "Staff Engineer",
    initials: "DA",
    tint: "#8DAFB3",
  },
  {
    id: "u7",
    name: "Sara Khan",
    email: "sara@tmsystems.in",
    role: "admin",
    title: "Workspace Admin",
    initials: "SK",
    tint: "#B898A8",
  },
  {
    id: "u8",
    name: "Ishan Roy",
    email: "ishan@tmsystems.in",
    role: "interviewer",
    title: "Design Lead",
    initials: "IR",
    tint: "#B5907C",
  },
];
