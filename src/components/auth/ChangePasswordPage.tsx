"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";

export function ChangePasswordPage() {
  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const { t } = useI18n();
  const cp = t.changePassword;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError(cp.errorMinLength); return; }
    if (password !== confirm) { setError(cp.errorMismatch); return; }
    try {
      await changePassword(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : cp.errorMinLength);
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
        <div className="flex items-center gap-2 mb-8">
          <span style={{ fontSize: "15px", fontWeight: 400, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.3px" }}>Finance</span>
          <span style={{ background: "#533afd", color: "#fff", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 500 }}>Manager</span>
        </div>

        <div className="mb-6 rounded px-3 py-2.5" style={{ background: "rgba(83,58,253,0.04)", border: "1px solid rgba(83,58,253,0.15)", borderRadius: "6px" }}>
          <p style={{ fontSize: "12px", color: "#533afd", fontFeatureSettings: '"ss01"', fontWeight: 400 }}>
            {cp.welcome}, <strong>{profile?.username}</strong>. {cp.welcomeSubtitle}
          </p>
        </div>

        <h1 style={{ fontSize: "1.3rem", fontWeight: 300, color: "#061b31", letterSpacing: "-0.4px", fontFeatureSettings: '"ss01"', marginBottom: 4 }}>
          {cp.title}
        </h1>
        <p style={{ fontSize: "14px", color: "#64748d", fontWeight: 300, fontFeatureSettings: '"ss01"', marginBottom: 24 }}>
          {cp.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label style={{ fontSize: "13px", fontWeight: 400, color: "#273951", fontFeatureSettings: '"ss01"', display: "block", marginBottom: 4 }}>
              {cp.newPassword}
            </label>
            <input type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder={cp.newPasswordPlaceholder} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#533afd")}
              onBlur={(e) => (e.target.style.borderColor = "#e5edf5")} />
          </div>

          <div className="space-y-1">
            <label style={{ fontSize: "13px", fontWeight: 400, color: "#273951", fontFeatureSettings: '"ss01"', display: "block", marginBottom: 4 }}>
              {cp.confirmPassword}
            </label>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              placeholder={cp.confirmPasswordPlaceholder} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#533afd")}
              onBlur={(e) => (e.target.style.borderColor = "#e5edf5")} />
          </div>

          {password && (
            <div style={{ fontSize: "11px", color: password.length >= 8 ? "#108c3d" : "#64748d", fontFeatureSettings: '"ss01"' }}>
              {password.length >= 8 ? cp.strengthOk : cp.strengthNeeded(8 - password.length)}
            </div>
          )}

          {error && (
            <p style={{ fontSize: "13px", color: "#ea2261", padding: "6px 10px", background: "rgba(234,34,97,0.06)", borderRadius: "4px", border: "1px solid rgba(234,34,97,0.2)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "9px 16px", marginTop: 8, background: loading ? "#b9b9f9" : "#533afd", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: 400, fontFeatureSettings: '"ss01"', cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
            {loading ? t.common.saving : cp.submit}
          </button>
        </form>

        <button onClick={logout}
          style={{ marginTop: 16, width: "100%", fontSize: "13px", color: "#64748d", background: "none", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>
          {t.common.signOut}
        </button>
      </div>
    </div>
  );
}
