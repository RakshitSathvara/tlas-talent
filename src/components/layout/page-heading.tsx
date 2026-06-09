// The three-part editorial header (design-system.md §6.2): eyebrow, Fraunces H1, dek.
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="anim-up mb-10">
      <div className="smallcaps mb-3 text-[11px] text-accent">{eyebrow}</div>
      <h1 className="mb-3 font-serif text-[44px] font-normal leading-[1.05] text-ink">{title}</h1>
      {description && <p className="max-w-2xl text-[15px] text-ink-soft">{description}</p>}
    </div>
  );
}
