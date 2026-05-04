"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const profile = useAuthStore((s) => s.profile);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Profile is null here (not logged in), so useI18n falls back to "en".
  // We try to read from localStorage for a language hint if desired in future.
  const { t } = useI18n();
  const a = t.auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : a.invalidCredentials);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    fontFeatureSettings: '"ss01"', color: "#061b31",
    border: "1px solid #e5edf5", borderRadius: "4px",
    outline: "none", boxSizing: "border-box", background: "#ffffff",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8fafc" }}>
      <div className="w-full max-w-sm" style={{
        background: "#ffffff", border: "1px solid #e5edf5", borderRadius: "8px",
        boxShadow: "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
        padding: "40px 36px",
      }}>
        <div className="mb-8">
          <Image src="/wealthtrackr-lockup.svg" alt="Wealthtrackr" width={160} height={32} priority />
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 300, color: "#061b31", letterSpacing: "-0.4px", fontFeatureSettings: '"ss01"', marginBottom: 6 }}>
          {a.signIn}
        </h1>
        <p style={{ fontSize: "14px", color: "#64748d", fontWeight: 300, fontFeatureSettings: '"ss01"', marginBottom: 28 }}>
          {a.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label style={{ fontSize: "13px", fontWeight: 400, color: "#273951", fontFeatureSettings: '"ss01"', display: "block", marginBottom: 4 }}>
              {a.username}
            </label>
            <input type="text" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="admin"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#533afd")}
              onBlur={(e) => (e.target.style.borderColor = "#e5edf5")} />
          </div>

          <div className="space-y-1">
            <label style={{ fontSize: "13px", fontWeight: 400, color: "#273951", fontFeatureSettings: '"ss01"', display: "block", marginBottom: 4 }}>
              {a.password}
            </label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#533afd")}
              onBlur={(e) => (e.target.style.borderColor = "#e5edf5")} />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#ea2261", fontFeatureSettings: '"ss01"', padding: "6px 10px", background: "rgba(234,34,97,0.06)", borderRadius: "4px", border: "1px solid rgba(234,34,97,0.2)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "9px 16px", background: loading ? "#b9b9f9" : "#533afd", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: 400, fontFeatureSettings: '"ss01"', cursor: loading ? "not-allowed" : "pointer", marginTop: 8, transition: "background 0.15s" }}>
            {loading ? a.signingIn : a.signIn}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-1.5" style={{ padding: "8px 10px", background: "rgba(21,190,83,0.06)", border: "1px solid rgba(21,190,83,0.2)", borderRadius: "4px" }}>
          <span style={{ fontSize: "11px", color: "#108c3d" }}>●</span>
          <span style={{ fontSize: "11px", color: "#108c3d", fontFeatureSettings: '"ss01"' }}>{a.secureNotice}</span>
        </div>
      </div>
    </div>
  );
}
