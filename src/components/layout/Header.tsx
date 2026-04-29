"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { UserManagementDialog } from "@/components/admin/UserManagementDialog";

export function Header() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const { t } = useI18n();
  const isAdmin = profile?.role === "admin";

  const NAV_LINKS = [
    { href: "/", label: t.nav.dashboard },
    { href: "/expenses", label: t.nav.expenses },
    { href: "/portfolio", label: t.nav.portfolio },
    { href: "/settings", label: t.nav.settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-[12px]" style={{ borderBottom: "1px solid #e5edf5" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: "15px", fontWeight: 400, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.3px" }}>Finance</span>
              <span style={{ background: "#533afd", color: "#fff", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 500 }}>Manager</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-[14px] transition-colors"
                    style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: isActive ? "#533afd" : "#061b31", background: isActive ? "rgba(83,58,253,0.06)" : "transparent", borderRadius: "6px", textDecoration: "none" }}>
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {profile && (
                <span style={{ fontSize: "12px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
                  {profile.username}
                  {isAdmin && (
                    <span style={{ marginLeft: 4, fontSize: "10px", color: "#533afd", background: "rgba(83,58,253,0.08)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "3px", padding: "1px 5px" }}>
                      {t.admin.roleAdmin}
                    </span>
                  )}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => setUserMgmtOpen(true)}
                  style={{ fontSize: "12px", color: "#533afd", background: "rgba(83,58,253,0.06)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontFeatureSettings: '"ss01"' }}
                >
                  {t.common.manageUsers}
                </button>
              )}
              <button
                onClick={logout}
                style={{ fontSize: "12px", color: "#64748d", background: "transparent", border: "1px solid #e5edf5", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontFeatureSettings: '"ss01"' }}
              >
                {t.common.signOut}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isAdmin && (
        <UserManagementDialog open={userMgmtOpen} onOpenChange={setUserMgmtOpen} />
      )}
    </>
  );
}
