import type { Template } from "@/types/domain";

export const templates: Template[] = [
  {
    id: "t1",
    name: "Interview invite",
    kind: "email",
    subject: "Your {{round}} interview for {{role}} at TM Systems",
    updatedOn: "2026-05-18",
    variables: ["candidate", "role", "round", "time", "panel", "join_link"],
    body:
      "Hi {{candidate}},\n\nWe'd like to invite you to the {{round}} for the {{role}} role. It's scheduled for {{time}} with {{panel}}.\n\nJoin here: {{join_link}}\n\nLooking forward to it,\nThe TM Systems team",
  },
  {
    id: "t2",
    name: "Rejection — respectful",
    kind: "email",
    subject: "An update on your application for {{role}}",
    updatedOn: "2026-05-12",
    variables: ["candidate", "role"],
    body:
      "Hi {{candidate}},\n\nThank you for the time you gave us for the {{role}} role. We won't be moving forward this time — the decision was genuinely close. We'd welcome you to apply again.\n\nWarm regards,\nThe TM Systems team",
  },
  {
    id: "t3",
    name: "Offer extended",
    kind: "email",
    subject: "An offer from TM Systems — {{role}}",
    updatedOn: "2026-05-22",
    variables: ["candidate", "role", "ctc", "joining_date"],
    body:
      "Hi {{candidate}},\n\nWe're delighted to offer you the {{role}} role at a CTC of {{ctc}}, with a joining date of {{joining_date}}. The formal letter is attached.\n\nWelcome aboard,\nThe TM Systems team",
  },
  {
    id: "t4",
    name: "Senior React Developer — JD",
    kind: "jd",
    updatedOn: "2026-05-17",
    variables: ["team", "band", "location"],
    body:
      "Own the component platform on the {{team}} team. 5+ years with React, a bias for clean abstractions. Band {{band}}, based in {{location}}.",
  },
  {
    id: "t5",
    name: "Standard offer letter",
    kind: "offer",
    updatedOn: "2026-04-30",
    variables: ["candidate", "role", "ctc", "band", "location", "joining_date"],
    body:
      "This letter confirms the offer of {{role}} to {{candidate}} at a total CTC of {{ctc}} ({{band}}), based in {{location}}, joining {{joining_date}}.",
  },
];
