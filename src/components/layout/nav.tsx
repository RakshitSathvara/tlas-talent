"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { navForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Role-filtered primary nav row. Active route gets ink text + a baseline underline. */
export function Nav() {
  const { role } = useRole();
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors",
              active ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {item.label}
            {active && <span className="absolute -bottom-px left-3 right-3 h-px bg-ink" />}
          </Link>
        );
      })}
    </nav>
  );
}
