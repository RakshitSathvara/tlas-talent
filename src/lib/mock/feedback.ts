import type { Feedback } from "@/types/domain";

export const feedback: Feedback[] = [
  {
    id: "f1",
    interviewId: "i6",
    candidateId: "c9",
    interviewer: "Aarav Nair",
    round: "Round 3 · Bar-raiser",
    ratings: { technical: 5, communication: 4, roleFit: 5, cultural: 5 },
    recommendation: "strong_yes",
    notes:
      "Best candidate in the loop. Reasoned about rendering cost without prompting, asked sharp questions about our platform debt. Would hire on the spot.",
    submittedOn: "2026-05-26",
  },
  {
    id: "f2",
    interviewId: "i6",
    candidateId: "c9",
    interviewer: "Meghna Iyer",
    round: "Round 2 · System design",
    ratings: { technical: 5, communication: 5, roleFit: 4, cultural: 4 },
    recommendation: "yes",
    notes: "Strong system thinking. Slightly over-engineered the caching layer but caught it himself.",
    submittedOn: "2026-05-24",
  },
  {
    id: "f3",
    interviewId: "i1",
    candidateId: "c7",
    interviewer: "Dev Anand",
    round: "Round 1 · Screen",
    ratings: { technical: 4, communication: 4, roleFit: 4, cultural: 5 },
    recommendation: "yes",
    notes: "Solid fundamentals, good on-call instincts. Worth the R2 technical.",
    submittedOn: "2026-05-22",
  },
  {
    id: "f4",
    interviewId: "i2",
    candidateId: "c8",
    interviewer: "Ishan Roy",
    round: "Round 0 · Portfolio screen",
    ratings: { technical: 4, communication: 5, roleFit: 4, cultural: 4 },
    recommendation: "yes",
    notes: "Portfolio shows real product thinking. Curious how she handles ambiguity live.",
    submittedOn: "2026-05-20",
  },
];
