"use client";

import { useEffect } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useFinanceStore } from "@/store/useFinanceStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const loadAll = useFinanceStore((s) => s.loadAll);

  // Hydrate store from IndexedDB on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
