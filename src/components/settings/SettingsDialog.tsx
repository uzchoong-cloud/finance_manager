"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LANGUAGES = [
  { value: "en", labelEn: "English", labelKo: "영어" },
  { value: "ko", labelEn: "한국어", labelKo: "한국어" },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "KRW", label: "KRW — Korean Won (₩)" },
  { value: "HKD", label: "HKD — HK Dollar (HK$)" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const updateUsername = useAuthStore((s) => s.updateUsername);
  const changePassword = useAuthStore((s) => s.changePassword);
  const { t } = useI18n();
  const s = t.settings;

  const [language, setLanguage] = useState<"en" | "ko">(profile?.language ?? "en");
  const [currency, setCurrency] = useState<"USD" | "KRW" | "HKD">(profile?.currency ?? "USD");
  const [startingBalance, setStartingBalance] = useState(String(profile?.startingBalance ?? 0));

  const [showUsername, setShowUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLanguage(profile.language);
      setCurrency(profile.currency);
      setStartingBalance(String(profile.startingBalance));
    }
  }, [profile]);

  useEffect(() => {
    if (!open) {
      setShowUsername(false); setNewUsername("");
      setShowPassword(false); setNewPassword(""); setConfirmPassword("");
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const balance = parseFloat(startingBalance);
    if (isNaN(balance) || balance < 0) { toast.error(t.expenses.invalidAmount); return; }

    // Validate password fields if the section is open and filled
    if (showPassword && (newPassword || confirmPassword)) {
      if (newPassword.length < 8) { toast.error(t.changePassword.errorMinLength); return; }
      if (newPassword !== confirmPassword) { toast.error(t.changePassword.errorMismatch); return; }
    }

    setSaving(true);
    try {
      // Always save preferences
      await updateSettings({ language, currency, startingBalance: balance });

      // Save username if changed
      if (showUsername && newUsername.trim() && newUsername.trim() !== profile?.username) {
        await updateUsername(newUsername.trim());
      }

      // Save password if filled
      if (showPassword && newPassword) {
        await changePassword(newPassword);
      }

      toast.success(s.saved);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error && err.message.includes("unique")
        ? s.usernameTaken
        : s.saveError;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "11px", fontWeight: 500, color: "var(--wt-muted)", letterSpacing: "0.08em",
    textTransform: "uppercase", fontFeatureSettings: '"ss01"',
  };

  const optionBase: React.CSSProperties = {
    flex: 1, padding: "9px 12px", fontSize: "13px", borderRadius: "4px",
    cursor: "pointer", fontFeatureSettings: '"ss01"', transition: "all 0.12s",
    textAlign: "left",
  };
  const optionActive: React.CSSProperties = { ...optionBase, border: "1px solid #533afd", background: "rgba(83,58,253,0.06)", color: "#533afd" };
  const optionInactive: React.CSSProperties = { ...optionBase, border: "1px solid var(--wt-border)", background: "var(--wt-surface)", color: "var(--wt-text-2)" };

  const inputStyle = { borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"ss01"' };
  const divider: React.CSSProperties = { borderTop: "1px solid var(--wt-border)" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ borderRadius: "8px", border: "1px solid var(--wt-border)", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: "1.1rem", fontWeight: 300, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>
            {s.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-1">
          {/* Language */}
          <div className="space-y-2.5">
            <p style={sectionLabel}>{s.languageSection}</p>
            <div className="flex gap-2">
              {LANGUAGES.map(({ value, labelEn, labelKo }) => (
                <button key={value} type="button" onClick={() => setLanguage(value)} style={language === value ? optionActive : optionInactive}>
                  <span style={{ fontWeight: 400 }}>{labelEn}</span>
                  {labelEn !== labelKo && <span style={{ marginLeft: 6, fontSize: "12px", opacity: 0.6 }}>{labelKo}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2.5">
            <p style={sectionLabel}>{s.currencySection}</p>
            <div className="flex flex-col gap-2">
              {CURRENCIES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setCurrency(value)} style={currency === value ? optionActive : optionInactive}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Starting Balance */}
          <div className="space-y-2.5">
            <p style={sectionLabel}>{s.startingBalanceSection}</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--wt-muted)" }}>
                {currency === "USD" ? "$" : currency === "KRW" ? "₩" : "HK$"}
              </span>
              <Input
                type="number" min="0" step={currency === "KRW" ? "1" : "0.01"}
                value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)}
                style={{ ...inputStyle, fontFeatureSettings: '"tnum"', paddingLeft: currency === "HKD" ? "44px" : "28px" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"', lineHeight: 1.5 }}>
              {s.startingBalanceHint}
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2.5" style={divider}>
            <div className="flex items-center justify-between pt-5">
              <p style={sectionLabel}>{s.changeUsernameSection}</p>
              <button
                type="button"
                onClick={() => { setShowUsername((v) => !v); setNewUsername(""); }}
                style={{ fontSize: "12px", color: "#533afd", background: "none", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}
              >
                {showUsername ? t.common.cancel : t.common.edit}
              </button>
            </div>
            {!showUsername
              ? <p style={{ fontSize: "13px", color: "var(--wt-text-2)", fontFeatureSettings: '"ss01"' }}>{profile?.username}</p>
              : <Input
                  autoFocus
                  placeholder={s.newUsernamePlaceholder}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  style={inputStyle}
                />
            }
          </div>

          {/* Password */}
          <div className="space-y-2.5" style={divider}>
            <div className="flex items-center justify-between pt-5">
              <p style={sectionLabel}>{s.changePasswordSection}</p>
              <button
                type="button"
                onClick={() => { setShowPassword((v) => !v); setNewPassword(""); setConfirmPassword(""); }}
                style={{ fontSize: "12px", color: "#533afd", background: "none", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}
              >
                {showPassword ? t.common.cancel : t.common.edit}
              </button>
            </div>
            {!showPassword
              ? <p style={{ fontSize: "13px", color: "var(--wt-text-2)", letterSpacing: "0.15em" }}>••••••••</p>
              : <div className="space-y-2">
                  <Input
                    autoFocus type="password"
                    placeholder={s.newPasswordPlaceholder}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle}
                  />
                  <Input
                    type="password"
                    placeholder={s.confirmPasswordPlaceholder}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>
            }
          </div>

          {/* Single save button */}
          <Button type="submit" disabled={saving} className="w-full"
            style={{ background: saving ? "#b9b9f9" : "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
            {saving ? t.common.saving : s.saveChanges}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
