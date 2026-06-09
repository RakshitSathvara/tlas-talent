// Unauthenticated chrome: centred, no header (frontend-architecture.md §5.1).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 font-sans">
      {children}
    </div>
  );
}
