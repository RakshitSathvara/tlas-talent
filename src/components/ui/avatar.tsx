// Circular initials avatar (design-system.md §2.5). Earth-tone background per user,
// cream text, a faint inner border for definition on the cream page.
export function Avatar({
  initials,
  tint,
  size = 36,
}: {
  initials: string;
  tint: string;
  size?: number;
}) {
  return (
    <div
      className="flex select-none items-center justify-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        backgroundColor: tint,
        color: "#FBF9F2",
        fontSize: size * 0.36,
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {initials}
    </div>
  );
}
