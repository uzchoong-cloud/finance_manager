"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-[12px]"
      style={{ borderBottom: "1px solid #e5edf5" }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logotype */}
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
          >
            <span
              className="text-[15px] font-normal tracking-tight"
              style={{
                fontFeatureSettings: '"ss01"',
                fontWeight: 400,
                color: "#061b31",
                letterSpacing: "-0.3px",
              }}
            >
              Finance
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
              style={{
                background: "#533afd",
                fontFeatureSettings: '"ss01"',
                borderRadius: "4px",
                letterSpacing: "0px",
              }}
            >
              Manager
            </span>
          </Link>

          {/* Desktop nav — hidden on mobile (bottom nav takes over) */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md px-3 py-1.5 text-[14px] transition-colors"
                  style={{
                    fontFeatureSettings: '"ss01"',
                    fontWeight: 400,
                    color: isActive ? "#533afd" : "#061b31",
                    background: isActive
                      ? "rgba(83,58,253,0.06)"
                      : "transparent",
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Privacy badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded px-2 py-1 text-[11px]"
            style={{
              background: "rgba(21,190,83,0.1)",
              border: "1px solid rgba(21,190,83,0.3)",
              borderRadius: "4px",
              color: "#108c3d",
              fontFeatureSettings: '"ss01"',
              fontWeight: 400,
            }}
          >
            <span>●</span>
            <span>Local only</span>
          </div>
        </div>
      </div>
    </header>
  );
}
