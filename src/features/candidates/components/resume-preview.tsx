import type { Candidate } from "@/types/domain";
import { Card } from "@/components/ui/card";

/**
 * A faux extracted-resume card on white paper (design-system.md §6.7). Sections are
 * derived from the candidate's own fields so the preview reads believable per profile.
 */
export function ResumePreview({ candidate }: { candidate: Candidate }) {
  const firstName = candidate.name.split(" ")[0];

  return (
    <Card className="bg-paper" padded>
      <header className="border-b border-line pb-4">
        <h3 className="font-serif text-[20px] font-normal leading-tight text-ink">
          {candidate.name}
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {candidate.role} · {candidate.location}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-softer">
          <span>{candidate.email}</span>
          <span>{candidate.phone}</span>
        </div>
      </header>

      {candidate.summary && (
        <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{candidate.summary}</p>
      )}

      <section className="mt-6">
        <h4 className="smallcaps mb-2 text-[10px] text-ink-soft">Experience</h4>
        <p className="text-[13px] leading-relaxed text-ink">
          {candidate.experience} of professional experience, most recently as a {candidate.role}.
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          Shipped production work end to end and partnered closely with design and product.
          Sourced via {candidate.source}.
        </p>
      </section>

      <section className="mt-5">
        <h4 className="smallcaps mb-2 text-[10px] text-ink-soft">Skills</h4>
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          {candidate.role}, system design, code review, cross-functional collaboration,
          mentoring.
        </p>
      </section>

      <section className="mt-5">
        <h4 className="smallcaps mb-2 text-[10px] text-ink-soft">Education</h4>
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          B.Tech, Computer Science. Based in {candidate.location}.
        </p>
      </section>

      <p className="mt-6 border-t border-line pt-3 text-[11px] italic text-ink-softer">
        Extracted from {firstName}&rsquo;s uploaded résumé.
      </p>
    </Card>
  );
}
