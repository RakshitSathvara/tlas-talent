import type { AppNotification } from "@/types/domain";

export const notifications: AppNotification[] = [
  {
    id: "n1",
    kind: "approval",
    title: "Offer needs your sign-off",
    body: "Devansh Shah · Senior React Developer · ₹28.5L is waiting on the CEO step.",
    when: "4h ago",
    read: false,
    href: "/offers/o1",
  },
  {
    id: "n2",
    kind: "approval",
    title: "Requisition awaiting approval",
    body: "Engineering Manager (Platform) is outside band and needs leadership sign-off.",
    when: "2h ago",
    read: false,
    href: "/requisitions/r5",
  },
  {
    id: "n3",
    kind: "interview",
    title: "Feedback overdue",
    body: "Tanvi Bhatia's R1 feedback has been pending since yesterday — it blocks her advance.",
    when: "1d ago",
    read: false,
    href: "/interviews/i4",
  },
  {
    id: "n4",
    kind: "candidate",
    title: "Candidate advanced",
    body: "Aman Verma moved to TL Review by Priya Shah.",
    when: "12m ago",
    read: true,
    href: "/candidates/c1",
  },
  {
    id: "n5",
    kind: "offer",
    title: "Offer accepted",
    body: "Meera Nair accepted the DevOps Engineer offer. Joins 15 June.",
    when: "3d ago",
    read: true,
    href: "/offers/o2",
  },
  {
    id: "n6",
    kind: "system",
    title: "SLA breach",
    body: "Sneha Patel has been in HR Review for 5 days — one day past the stage SLA.",
    when: "6h ago",
    read: true,
    href: "/candidates/c2",
  },
  {
    id: "n7",
    kind: "interview",
    title: "Interview scheduled",
    body: "R2 Technical with Rahul Singh set for tomorrow, 10:00.",
    when: "1d ago",
    read: true,
    href: "/interviews/i3",
  },
];

export const unreadCount = notifications.filter((n) => !n.read).length;
