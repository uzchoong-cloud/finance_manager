"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { UserManagementDialog } from "@/components/admin/UserManagementDialog";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useThemeStore } from "@/store/useThemeStore";

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useI18n();
  const dark = useThemeStore((s) => s.dark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const isAdmin = profile?.role === "admin";

  const NAV_LINKS = [
    { href: "/", label: t.nav.dashboard },
    { href: "/expenses", label: t.nav.expenses },
    { href: "/portfolio", label: t.nav.portfolio },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--wt-surface) 92%, transparent)", borderBottom: "1px solid var(--wt-border)" }}>
        <div className="px-6 sm:px-10">
          <div className="grid h-14 items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>

            {/* Left — logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <svg width="28" height="28" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="44" height="44" rx="10" fill="#533afd" />
                <polyline points="6,32 10,20 14,26 18,14 22,22 28,10 38,6" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="38" cy="6" r="2.2" fill="white" />
              </svg>
              <span style={{ marginLeft: 8, fontSize: "18px", fontWeight: 300, letterSpacing: "-0.4px", color: "#533afd", fontFeatureSettings: '"ss01"' }}>
                Wealthtrackr
              </span>
            </Link>

            {/* Centre — navigation */}
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-[14px] transition-colors"
                    style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: isActive ? "#533afd" : "var(--wt-text)", background: isActive ? "rgba(83,58,253,0.06)" : "transparent", borderRadius: "6px", textDecoration: "none" }}>
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right — user info + actions */}
            <div className="flex items-center gap-2 justify-end">
              {profile && (
                <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>
                  {profile.username}
                  {isAdmin && (
                    <span style={{ marginLeft: 4, fontSize: "10px", color: "#533afd", background: "rgba(83,58,253,0.08)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "3px", padding: "1px 5px" }}>
                      {t.admin.roleAdmin}
                    </span>
                  )}
                </span>
              )}
              {isAdmin && (
                <button onClick={() => setUserMgmtOpen(true)}
                  style={{ height: 30, fontSize: "12px", color: "#533afd", background: "rgba(83,58,253,0.06)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", padding: "0 10px", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>
                  {t.common.manageUsers}
                </button>
              )}
              <button onClick={toggleTheme}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 30, width: 30, color: "var(--wt-muted)", background: "transparent", border: "1px solid var(--wt-border)", borderRadius: "4px", cursor: "pointer", flexShrink: 0 }}
                title={dark ? "Light mode" : "Dark mode"}>
                {dark ? <IconSun /> : <IconMoon />}
              </button>
              <button onClick={() => setSettingsOpen(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 30, width: 30, color: "var(--wt-muted)", background: "transparent", border: "1px solid var(--wt-border)", borderRadius: "4px", cursor: "pointer", flexShrink: 0 }}
                title={t.nav.settings}>
                <IconSettings />
              </button>
              <button onClick={logout}
                style={{ height: 30, fontSize: "12px", color: "var(--wt-muted)", background: "transparent", border: "1px solid var(--wt-border)", borderRadius: "4px", padding: "0 10px", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>
                {t.common.signOut}
              </button>
            </div>

          </div>
        </div>
      </header>

      {isAdmin && <UserManagementDialog open={userMgmtOpen} onOpenChange={setUserMgmtOpen} />}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
