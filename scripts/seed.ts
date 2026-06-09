// Seeds a Supabase DB with the demo org, Supabase Auth users (one per role, password
// `atlas1234`, with role/org_id in app_metadata so the JWT carries them), pipeline config, and
// realistic data across the whole pipeline so the app boots looking like the prototype.
//
// Run after `npm run db:migrate` && `npm run db:sql`. Idempotent per-section: each section
// inserts only if its table is empty for the org and otherwise reads existing rows, so it's
// safe to re-run (e.g. after this expansion) without duplicating already-seeded data.
//
// The seeded app_metadata puts role/org_id in the JWT immediately, so these accounts work
// WITHOUT the access-token hook. Enable the hook (migration 0004) before production / any role
// change — otherwise new role/org claims won't reach the JWT until the user re-authenticates.
//
// Uses relative imports (no @/ alias) so it runs under tsx without path config.
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import * as s from "../src/lib/db/schema";

const DB_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = "atlas1234";
const ORG_NAME = "TM Systems Pvt. Ltd.";

if (!DB_URL || !SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Set DATABASE_URL/DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (/YOUR[-_](REGION|DB_PASSWORD|PROJECT-REF|ANON_PUBLIC_KEY|SERVICE_ROLE_KEY)/.test(`${DB_URL}${SUPABASE_URL}${SERVICE_ROLE}`)) {
  console.error(".env.local still has placeholders — paste your real Supabase values (Connect → Connection pooling for the DB URLs, Settings → API for the keys).");
  process.exit(1);
}

const sql = postgres(DB_URL, { max: 1 });
const db = drizzle(sql, { schema: s });
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { name: "Rakshit Patel", email: "rakshit@tmsystems.in", role: "leadership", title: "Chief Executive", initials: "RP", tint: "#D4A574" },
  { name: "Priya Shah", email: "priya@tmsystems.in", role: "hr", title: "Head of Talent", initials: "PS", tint: "#C8A48F" },
  { name: "Karan Joshi", email: "karan@tmsystems.in", role: "hr", title: "Senior Recruiter", initials: "KJ", tint: "#A88B6E" },
  { name: "Aarav Nair", email: "aarav@tmsystems.in", role: "leadership", title: "Platform Lead", initials: "AN", tint: "#5A6F8C" },
  { name: "Meghna Iyer", email: "meghna@tmsystems.in", role: "interviewer", title: "Senior Engineer", initials: "MI", tint: "#9CB39B" },
  { name: "Dev Anand", email: "dev@tmsystems.in", role: "interviewer", title: "Staff Engineer", initials: "DA", tint: "#8DAFB3" },
  { name: "Sara Khan", email: "sara@tmsystems.in", role: "admin", title: "Workspace Admin", initials: "SK", tint: "#B898A8" },
  { name: "Ishan Roy", email: "ishan@tmsystems.in", role: "interviewer", title: "Design Lead", initials: "IR", tint: "#B5907C" },
] as const;

const STAGES = [
  { stage: "sourced", label: "Sourced", slaDays: 3, owner: "hr", sortOrder: 1 },
  { stage: "hr_review", label: "HR Review", slaDays: 3, owner: "hr", sortOrder: 2 },
  { stage: "tl_review", label: "TL Review", slaDays: 4, owner: "leadership", sortOrder: 3 },
  { stage: "interview", label: "Interview", slaDays: 7, owner: "hr", sortOrder: 4 },
  { stage: "offer", label: "Offer", slaDays: 5, owner: "hr", sortOrder: 5 },
  { stage: "hired", label: "Hired", slaDays: null, owner: "hr", sortOrder: 6 },
  { stage: "rejected", label: "Rejected", slaDays: null, owner: "hr", sortOrder: 7 },
] as const;

const CHAIN_CONFIG = [
  { band: "₹38–46L", chain: ["TL", "HR", "CEO"] },
  { band: "₹24–30L", chain: ["TL", "HR"] },
] as const;

const REQS = [
  { title: "Senior React Developer", team: "Platform", location: "Ahmedabad", openings: 2, priority: "high", band: "₹24–30L", raisedBy: "Aarav Nair", raisedOn: "2026-05-17", status: "open", description: "Own the component platform the rest of engineering builds on." },
  { title: "Backend Engineer", team: "Infrastructure", location: "Bengaluru", openings: 1, priority: "medium", band: "₹22–28L", raisedBy: "Aarav Nair", raisedOn: "2026-05-21", status: "open", description: "Design and run the services behind Atlas." },
  { title: "Product Designer", team: "Design", location: "Mumbai", openings: 1, priority: "medium", band: "₹18–24L", raisedBy: "Ishan Roy", raisedOn: "2026-05-11", status: "open", description: "Shape end-to-end product flows for internal tools." },
  { title: "DevOps Engineer", team: "Infrastructure", location: "Pune", openings: 1, priority: "low", band: "₹20–26L", raisedBy: "Aarav Nair", raisedOn: "2026-05-05", status: "filled", description: "Keep the pipelines green and the deploys boring." },
  { title: "Engineering Manager", team: "Platform", location: "Ahmedabad", openings: 1, priority: "high", band: "₹38–46L", raisedBy: "Priya Shah", raisedOn: "2026-05-27", status: "pending_approval", description: "Lead the platform pod of six. Outside the usual band — needs CEO sign-off." },
  { title: "Data Analyst", team: "Analytics", location: "Remote", openings: 2, priority: "medium", band: "₹14–18L", raisedBy: "Karan Joshi", raisedOn: "2026-05-28", status: "pending_approval", description: "Turn product and hiring data into decisions." },
] as const;

const CANDS = [
  { req: "Senior React Developer", name: "Aman Verma", role: "Senior React Developer", stage: "sourced", email: "aman.verma@example.com", phone: "+91 98250 11001", source: "Referral", appliedOn: "2026-05-28", initials: "AV", tint: "#D4A574" },
  { req: "Senior React Developer", name: "Devansh Shah", role: "Senior React Developer", stage: "offer", email: "devansh.shah@example.com", phone: "+91 98250 11009", source: "LinkedIn", appliedOn: "2026-05-12", initials: "DS", tint: "#8FA8B5" },
  { req: "Senior React Developer", name: "Rhea Kapoor", role: "Senior React Developer", stage: "interview", email: "rhea.kapoor@example.com", phone: "+91 98250 11011", source: "Referral", appliedOn: "2026-05-19", initials: "RK", tint: "#C8A48F" },
  { req: "Senior React Developer", name: "Nikhil Rao", role: "Senior React Developer", stage: "hr_review", email: "nikhil.rao@example.com", phone: "+91 98250 11012", source: "LinkedIn", appliedOn: "2026-05-22", initials: "NR", tint: "#A88B6E" },
  { req: "Backend Engineer", name: "Karthik Iyer", role: "Backend Engineer", stage: "hr_review", email: "karthik.iyer@example.com", phone: "+91 98860 11003", source: "LinkedIn", appliedOn: "2026-05-24", initials: "KI", tint: "#8DAFB3" },
  { req: "Backend Engineer", name: "Pooja Menon", role: "Backend Engineer", stage: "tl_review", email: "pooja.menon@example.com", phone: "+91 98860 11013", source: "Naukri", appliedOn: "2026-05-20", initials: "PM", tint: "#9CB39B" },
  { req: "Product Designer", name: "Sneha Patel", role: "Product Designer", stage: "hr_review", email: "sneha.patel@example.com", phone: "+91 99300 11002", source: "LinkedIn", appliedOn: "2026-05-22", initials: "SP", tint: "#A18BBF" },
  { req: "Product Designer", name: "Tara Singh", role: "Product Designer", stage: "interview", email: "tara.singh@example.com", phone: "+91 99300 11014", source: "Dribbble", appliedOn: "2026-05-15", initials: "TS", tint: "#B898A8" },
  { req: "DevOps Engineer", name: "Meera Nair", role: "DevOps Engineer", stage: "hired", email: "meera.nair@example.com", phone: "+91 99300 11010", source: "Referral", appliedOn: "2026-04-28", initials: "MN", tint: "#A4B591" },
  { req: "DevOps Engineer", name: "Vivek Shah", role: "DevOps Engineer", stage: "rejected", email: "vivek.shah@example.com", phone: "+91 99300 11015", source: "LinkedIn", appliedOn: "2026-05-02", initials: "VS", tint: "#B5907C" },
  { req: "Backend Engineer", name: "Ananya Gupta", role: "Backend Engineer", stage: "sourced", email: "ananya.gupta@example.com", phone: "+91 98860 11016", source: "Referral", appliedOn: "2026-05-29", initials: "AG", tint: "#D4A574" },
  { req: "Product Designer", name: "Rohan Das", role: "Product Designer", stage: "sourced", email: "rohan.das@example.com", phone: "+91 99300 11017", source: "LinkedIn", appliedOn: "2026-05-30", initials: "RD", tint: "#8FA8B5" },
] as const;

// approver name per chain-label, plus per-req step states (mirrors the prototype).
const REQ_APPROVAL_CHAINS = [
  { req: "Senior React Developer", state: "approved", steps: [["TL", "Aarav Nair", "approved", "2026-05-17"], ["HR", "Priya Shah", "approved", "2026-05-17"], ["CEO", "Rakshit Patel", "approved", "2026-05-18"]] },
  { req: "Engineering Manager", state: "pending", steps: [["TL", "Aarav Nair", "approved", "2026-05-27"], ["HR", "Priya Shah", "approved", "2026-05-27"], ["CEO", "Rakshit Patel", "pending", null]] },
  { req: "Data Analyst", state: "pending", steps: [["TL", "Aarav Nair", "approved", "2026-05-28"], ["HR", "Priya Shah", "pending", null], ["CEO", "Rakshit Patel", "pending", null]] },
] as const;

const INTERVIEWS = [
  { cand: "Rhea Kapoor", round: 1, scheduledAt: "2026-06-02T10:00:00+05:30", durationMinutes: 60, mode: "video", status: "upcoming", panel: ["Meghna Iyer", "Dev Anand"] },
  { cand: "Tara Singh", round: 1, scheduledAt: "2026-05-30T15:00:00+05:30", durationMinutes: 45, mode: "in_person", status: "pending_feedback", panel: ["Ishan Roy", "Meghna Iyer"] },
  { cand: "Devansh Shah", round: 1, scheduledAt: "2026-05-20T11:00:00+05:30", durationMinutes: 60, mode: "video", status: "completed", panel: ["Aarav Nair", "Meghna Iyer"] },
] as const;

const FEEDBACK = [
  { cand: "Tara Singh", interviewer: "Ishan Roy", round: 1, technical: 4, communication: 5, roleFit: 4, cultural: 5, recommendation: "yes", notes: "Strong portfolio; thinks in systems, not screens.", submittedAt: "2026-05-30" },
  { cand: "Devansh Shah", interviewer: "Aarav Nair", round: 1, technical: 5, communication: 4, roleFit: 5, cultural: 4, recommendation: "strong_yes", notes: "Excellent React depth; clean abstractions.", submittedAt: "2026-05-20" },
  { cand: "Devansh Shah", interviewer: "Meghna Iyer", round: 1, technical: 5, communication: 5, roleFit: 4, cultural: 5, recommendation: "strong_yes", notes: "Great communicator. Clear hire.", submittedAt: "2026-05-21" },
] as const;

const OFFERS = [
  { cand: "Devansh Shah", drafter: "Priya Shah", status: "pending_approval", band: "₹24–30L", ctc: 2850000, location: "Ahmedabad", joiningDate: "2026-07-01", type: "full_time", createdOn: "2026-05-27", chain: [["HR", "Priya Shah", "approved", "2026-05-27"], ["TL", "Aarav Nair", "approved", "2026-05-28"], ["CEO", "Rakshit Patel", "pending", null]] },
  { cand: "Meera Nair", drafter: "Priya Shah", status: "accepted", band: "₹20–26L", ctc: 2400000, location: "Pune", joiningDate: "2026-06-15", type: "full_time", createdOn: "2026-05-10", chain: [["HR", "Priya Shah", "approved", "2026-05-10"], ["TL", "Aarav Nair", "approved", "2026-05-11"], ["CEO", "Rakshit Patel", "approved", "2026-05-12"]] },
] as const;

const TEMPLATES = [
  { name: "Interview Invitation", kind: "email", subject: "Your interview with TM Systems", body: "Hi {{candidateName}},\n\nWe'd love to meet you for the {{role}} role on {{date}}.", variables: ["candidateName", "role", "date"] },
  { name: "Engineering JD", kind: "jd", subject: null, body: "We're hiring a {{role}} on the {{team}} team to own {{scope}}.", variables: ["role", "team", "scope"] },
  { name: "Standard Offer Letter", kind: "offer", subject: null, body: "Dear {{candidateName}},\n\nWe are delighted to offer you the {{role}} role at a CTC of {{ctc}}, joining {{joiningDate}}.", variables: ["candidateName", "role", "ctc", "joiningDate"] },
] as const;

const NOTIFICATIONS = [
  { recipient: "Rakshit Patel", kind: "approval", title: "Offer needs your approval", body: "Devansh Shah · Senior React Developer", href: "/approvals" },
  { recipient: "Rakshit Patel", kind: "approval", title: "Requisition awaiting sign-off", body: "Engineering Manager · Platform", href: "/approvals" },
  { recipient: "Priya Shah", kind: "interview", title: "Feedback pending", body: "Tara Singh · Product Designer", href: "/interviews" },
  { recipient: "Priya Shah", kind: "candidate", title: "New candidate sourced", body: "Aman Verma · Senior React Developer", href: "/candidates" },
] as const;

const ACTIVITIES = [
  { actor: "Aarav Nair", verb: "created", targetType: "requisition", target: "Senior React Developer", summary: 'Raised requisition "Senior React Developer"' },
  { actor: "Rakshit Patel", verb: "approved", targetType: "requisition", target: "Senior React Developer", summary: 'Approved requisition "Senior React Developer"' },
  { actor: "Priya Shah", verb: "advanced", targetType: "candidate", target: "Rhea Kapoor", summary: 'Advanced "Rhea Kapoor" to interview' },
  { actor: "Priya Shah", verb: "created", targetType: "offer", target: "Devansh Shah", summary: 'Drafted an offer for "Devansh Shah"' },
] as const;

async function getOrCreateAuthUser(email: string, role: string, orgId: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    app_metadata: { role, org_id: orgId },
  });
  if (!error && data.user) return data.user.id;

  // Likely already exists — find it and refresh its claims.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) {
    await admin.auth.admin.updateUserById(found.id, { app_metadata: { role, org_id: orgId } });
    return found.id;
  }
  throw new Error(`Could not create/find auth user ${email}: ${error?.message ?? "unknown"}`);
}

async function main(): Promise<void> {
  // 1) org (idempotent)
  const [existingOrg] = await db.select().from(s.organizations).where(eq(s.organizations.name, ORG_NAME)).limit(1);
  const orgId = existingOrg
    ? existingOrg.id
    : (await db.insert(s.organizations).values({ name: ORG_NAME }).returning({ id: s.organizations.id }))[0].id;
  console.log(`org: ${orgId}`);

  // 2) auth users + public.users (getOrCreateAuthUser is idempotent; insert ignores conflicts)
  const userRows: (typeof s.users.$inferInsert)[] = [];
  for (const u of USERS) {
    const authUserId = await getOrCreateAuthUser(u.email, u.role, orgId);
    userRows.push({ orgId, authUserId, name: u.name, email: u.email, role: u.role, title: u.title, initials: u.initials, tint: u.tint });
  }
  await db.insert(s.users).values(userRows).onConflictDoNothing();
  const dbUsers = await db.select().from(s.users).where(eq(s.users.orgId, orgId));
  const uid = (name: string): string => {
    const id = dbUsers.find((u) => u.name === name)?.id;
    if (!id) throw new Error(`No user named ${name}`);
    return id;
  };
  console.log(`users: ${dbUsers.length}`);

  // 3) pipeline config (idempotent via unique constraints)
  await db.insert(s.stageConfig).values(STAGES.map((st) => ({ orgId, stage: st.stage, label: st.label, slaDays: st.slaDays, owner: st.owner, sortOrder: st.sortOrder }))).onConflictDoNothing();
  await db.insert(s.approvalChainConfig).values(CHAIN_CONFIG.map((c) => ({ orgId, band: c.band, chain: [...c.chain] }))).onConflictDoNothing();

  // 4) requisitions — insert if none, then build a title -> row map from the DB
  if (await isEmpty(s.requisitions, orgId)) {
    await db.insert(s.requisitions).values(
      REQS.map((r) => ({
        orgId, title: r.title, team: r.team, location: r.location, openings: r.openings,
        priority: r.priority, band: r.band, raisedBy: uid(r.raisedBy), raisedOn: new Date(r.raisedOn),
        description: r.description, status: r.status,
      })),
    );
  }
  const dbReqs = await db.select({ id: s.requisitions.id, title: s.requisitions.title }).from(s.requisitions).where(eq(s.requisitions.orgId, orgId));
  const reqId = (title: string): string => {
    const id = dbReqs.find((r) => r.title === title)?.id;
    if (!id) throw new Error(`No requisition titled ${title}`);
    return id;
  };
  console.log(`requisitions: ${dbReqs.length}`);

  // 5) candidates (+ first stage-history row) — insert if none, then build a name -> row map
  if (await isEmpty(s.candidates, orgId)) {
    for (const c of CANDS) {
      const [row] = await db.insert(s.candidates).values({
        orgId, requisitionId: reqId(c.req), name: c.name, role: c.role, stage: c.stage,
        email: c.email, phone: c.phone, source: c.source, appliedOn: new Date(c.appliedOn),
        initials: c.initials, tint: c.tint,
      }).returning({ id: s.candidates.id });
      await db.insert(s.candidateStageHistory).values({
        orgId, candidateId: row.id, stage: c.stage, enteredOn: new Date(c.appliedOn), changedBy: uid("Priya Shah"),
      });
    }
  }
  const dbCands = await db.select({ id: s.candidates.id, name: s.candidates.name, requisitionId: s.candidates.requisitionId, role: s.candidates.role }).from(s.candidates).where(eq(s.candidates.orgId, orgId));
  const cand = (name: string) => {
    const c = dbCands.find((x) => x.name === name);
    if (!c) throw new Error(`No candidate named ${name}`);
    return c;
  };
  console.log(`candidates: ${dbCands.length}`);

  // 6) requisition approval chains
  if (await isEmptyByType(s.approvalRequests, orgId, "requisition")) {
    for (const chain of REQ_APPROVAL_CHAINS) {
      const req = REQS.find((r) => r.title === chain.req)!;
      const [ar] = await db.insert(s.approvalRequests).values({
        orgId, type: "requisition", entityId: reqId(chain.req), requesterId: uid(req.raisedBy),
        title: chain.req, subtitle: `${req.team} · ${req.location}`, state: chain.state,
      }).returning({ id: s.approvalRequests.id });
      await db.insert(s.approvalSteps).values(
        chain.steps.map(([label, approver, state, actedOn], i) => ({
          orgId, approvalRequestId: ar.id, stepOrder: i + 1, role: label, approverId: uid(approver),
          state, actedOn: actedOn ? new Date(actedOn) : null,
        })),
      );
    }
  }

  // 7) interviews + panelists — build a candidate -> interview id map
  const interviewIdByCand = new Map<string, string>();
  if (await isEmpty(s.interviews, orgId)) {
    for (const iv of INTERVIEWS) {
      const c = cand(iv.cand);
      const [row] = await db.insert(s.interviews).values({
        orgId, candidateId: c.id, requisitionId: c.requisitionId, scheduledAt: new Date(iv.scheduledAt),
        round: iv.round, durationMinutes: iv.durationMinutes, mode: iv.mode, status: iv.status,
      }).returning({ id: s.interviews.id });
      interviewIdByCand.set(iv.cand, row.id);
      await db.insert(s.interviewPanelists).values(
        iv.panel.map((p) => ({ orgId, interviewId: row.id, userId: uid(p) })),
      );
    }
  } else {
    const existing = await db.select({ id: s.interviews.id, candidateId: s.interviews.candidateId }).from(s.interviews).where(eq(s.interviews.orgId, orgId));
    for (const iv of INTERVIEWS) {
      const c = dbCands.find((x) => x.name === iv.cand);
      const match = existing.find((e) => e.candidateId === c?.id);
      if (match) interviewIdByCand.set(iv.cand, match.id);
    }
  }
  console.log(`interviews: ${interviewIdByCand.size}`);

  // 8) feedback
  if (await isEmpty(s.feedback, orgId)) {
    for (const f of FEEDBACK) {
      const interviewId = interviewIdByCand.get(f.cand);
      if (!interviewId) continue;
      await db.insert(s.feedback).values({
        orgId, interviewId, candidateId: cand(f.cand).id, interviewerId: uid(f.interviewer), round: f.round,
        ratingTechnical: f.technical, ratingCommunication: f.communication, ratingRoleFit: f.roleFit, ratingCultural: f.cultural,
        recommendation: f.recommendation, notes: f.notes, submittedAt: new Date(f.submittedAt),
      }).onConflictDoNothing();
    }
  }

  // 9) offers + offer approval chains
  if (await isEmpty(s.offers, orgId)) {
    for (const o of OFFERS) {
      const c = cand(o.cand);
      const [row] = await db.insert(s.offers).values({
        orgId, candidateId: c.id, requisitionId: c.requisitionId, status: o.status,
        termsBand: o.band, termsCtc: String(o.ctc), termsLocation: o.location,
        termsJoiningDate: o.joiningDate, termsType: o.type, createdOn: new Date(o.createdOn),
      }).returning({ id: s.offers.id });
      const [ar] = await db.insert(s.approvalRequests).values({
        orgId, type: "offer", entityId: row.id, requesterId: uid(o.drafter),
        title: `${o.cand} · ${c.role}`, subtitle: `${o.band} · ${o.location}`, amount: String(o.ctc),
        state: o.status === "accepted" ? "approved" : "pending",
      }).returning({ id: s.approvalRequests.id });
      await db.insert(s.approvalSteps).values(
        o.chain.map(([label, approver, state, actedOn], i) => ({
          orgId, approvalRequestId: ar.id, stepOrder: i + 1, role: label, approverId: uid(approver),
          state, actedOn: actedOn ? new Date(actedOn) : null,
        })),
      );
    }
  }
  const dbOffers = await db.select({ id: s.offers.id, candidateId: s.offers.candidateId }).from(s.offers).where(eq(s.offers.orgId, orgId));

  // 10) templates
  if (await isEmpty(s.templates, orgId)) {
    await db.insert(s.templates).values(
      TEMPLATES.map((t) => ({ orgId, name: t.name, kind: t.kind, subject: t.subject, body: t.body, variables: [...t.variables] })),
    );
  }

  // 11) notifications
  if (await isEmpty(s.notifications, orgId)) {
    await db.insert(s.notifications).values(
      NOTIFICATIONS.map((n) => ({ orgId, recipientId: uid(n.recipient), kind: n.kind, title: n.title, body: n.body, href: n.href })),
    );
  }

  // 12) activities feed
  if (await isEmpty(s.activities, orgId)) {
    await db.insert(s.activities).values(
      ACTIVITIES.map((a) => {
        const targetId =
          a.targetType === "requisition"
            ? reqId(a.target)
            : a.targetType === "offer"
              ? dbOffers.find((o) => o.candidateId === cand(a.target).id)?.id ?? cand(a.target).id
              : cand(a.target).id;
        return { orgId, actorId: uid(a.actor), verb: a.verb, targetType: a.targetType, targetId, summary: a.summary };
      }),
    );
  }

  await sql.end();
  console.log("\nSeed complete. Sign in with any listed email + password 'atlas1234'.");
}

/** True when the org has no rows in the table (used to make each section idempotent). */
async function isEmpty(
  table: typeof s.requisitions | typeof s.candidates | typeof s.interviews | typeof s.feedback | typeof s.offers | typeof s.templates | typeof s.notifications | typeof s.activities,
  orgId: string,
): Promise<boolean> {
  const rows = await db.select({ id: table.id }).from(table).where(eq(table.orgId, orgId)).limit(1);
  return rows.length === 0;
}

/** True when the org has no approval_requests of the given type. */
async function isEmptyByType(table: typeof s.approvalRequests, orgId: string, type: "requisition" | "offer"): Promise<boolean> {
  const rows = await db.select({ id: table.id }).from(table).where(and(eq(table.orgId, orgId), eq(table.type, type))).limit(1);
  return rows.length === 0;
}

main().catch(async (err) => {
  console.error(err);
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
});
