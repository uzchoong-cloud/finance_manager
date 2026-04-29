"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

function IconGrid({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" />
    </svg>
  );
}

function IconReceipt({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 3h14a1 1 0 0 1 1 1v16l-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2L5 20V4a1 1 0 0 1 1-1z" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" strokeLinejoin="round" />
      <line x1="8" y1="9" x2="16" y2="9" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="13" x2="14" y2="13" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconTrendingUp({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <polyline points="3,17 9,11 13,15 21,7" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16,7 21,7 21,12" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={active ? "#533afd" : "#64748d"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const nav = t.nav;

  const NAV_ITEMS = [
    { href: "/", label: nav.dashboard, Icon: IconGrid },
    { href: "/expenses", label: nav.expenses, Icon: IconReceipt },
    { href: "/portfolio", label: nav.portfolio, Icon: IconTrendingUp },
    { href: "/settings", label: nav.settings, Icon: IconSettings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bottom-nav"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #e5edf5",
        boxShadow: "rgba(50,50,93,0.1) 0px -4px 12px",
      }}
    >
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60"
              style={{ textDecoration: "none", minHeight: 56 }}
            >
              <Icon active={isActive} />
              <span
                className="text-[10px] leading-none"
                style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: isActive ? "#533afd" : "#64748d", letterSpacing: "0.1px" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
