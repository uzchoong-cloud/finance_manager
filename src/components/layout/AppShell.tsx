"use client";

import { useEffect } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { LoginPage } from "@/components/auth/LoginPage";
import { ChangePasswordPage } from "@/components/auth/ChangePasswordPage";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  const loadAll = useFinanceStore((s) => s.loadAll);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (profile) loadAll();
  }, [profile, loadAll]);

  // Splash while checking session
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #e5edf5", borderTopColor: "#533afd", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) return <LoginPage />;
  if (mustChangePassword) return <ChangePasswordPage />;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 pb-nav sm:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
