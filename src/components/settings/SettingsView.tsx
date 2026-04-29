"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { value: "en", labelEn: "English", labelKo: "영어" },
  { value: "ko", labelEn: "한국어", labelKo: "한국어" },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "KRW", label: "KRW — Korean Won (₩)" },
  { value: "HKD", label: "HKD — HK Dollar (HK$)" },
] as const;

export function SettingsView() {
  const profile = useAuthStore((s) => s.profile);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const loading = useAuthStore((s) => s.loading);
  const { t } = useI18n();
  const s = t.settings;

  const [language, setLanguage] = useState<"en" | "ko">(profile?.language ?? "en");
  const [currency, setCurrency] = useState<"USD" | "KRW" | "HKD">(profile?.currency ?? "USD");
  const [startingBalance, setStartingBalance] = useState(String(profile?.startingBalance ?? 0));

  // Sync if profile loads after mount
  useEffect(() => {
    if (profile) {
      setLanguage(profile.language);
      setCurrency(profile.currency);
      setStartingBalance(String(profile.startingBalance));
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(startingBalance);
    if (isNaN(balance) || balance < 0) {
      toast.error(t.expenses.invalidAmount);
      return;
    }
    try {
      await updateSettings({ language, currency, startingBalance: balance });
      toast.success(s.saved);
    } catch {
      toast.error(s.saveError);
    }
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "11px", fontWeight: 500, color: "#64748d", letterSpacing: "0.08em",
    textTransform: "uppercase", fontFeatureSettings: '"ss01"', marginBottom: 10,
  };

  const optionBase: React.CSSProperties = {
    flex: 1, padding: "9px 12px", fontSize: "14px", borderRadius: "4px",
    cursor: "pointer", fontFeatureSettings: '"ss01"', transition: "all 0.12s",
    textAlign: "left",
  };

  const optionActive: React.CSSProperties = {
    ...optionBase,
    border: "1px solid #533afd",
    background: "rgba(83,58,253,0.06)",
    color: "#533afd",
  };

  const optionInactive: React.CSSProperties = {
    ...optionBase,
    border: "1px solid #e5edf5",
    background: "#fff",
    color: "#273951",
  };

  return (
    <div className="space-y-8 max-w-lg">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.5px", fontFeatureSettings: '"ss01"', color: "#061b31", lineHeight: 1.2 }}>
          {s.title}
        </h1>
        <p style={{ fontSize: "14px", color: "#64748d", fontWeight: 300, marginTop: 4, fontFeatureSettings: '"ss01"' }}>
          {s.subtitle}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Language */}
        <div>
          <p style={sectionLabel}>{s.languageSection}</p>
          <div className="flex gap-2">
            {LANGUAGES.map(({ value, labelEn, labelKo }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLanguage(value)}
                style={language === value ? optionActive : optionInactive}
              >
                <span style={{ fontWeight: 400 }}>{labelEn}</span>
                {labelEn !== labelKo && (
                  <span style={{ marginLeft: 6, fontSize: "12px", opacity: 0.6 }}>{labelKo}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div>
          <p style={sectionLabel}>{s.currencySection}</p>
          <div className="flex flex-col gap-2">
            {CURRENCIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCurrency(value)}
                style={currency === value ? optionActive : optionInactive}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Starting Balance */}
        <div>
          <p style={sectionLabel}>{s.startingBalanceSection}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: "#64748d" }}>
              {currency === "USD" ? "$" : currency === "KRW" ? "₩" : "HK$"}
            </span>
            <Input
              type="number"
              min="0"
              step={currency === "KRW" ? "1" : "0.01"}
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"tnum"', paddingLeft: currency === "HKD" ? "44px" : "28px" }}
            />
          </div>
          <p style={{ fontSize: "12px", color: "#64748d", marginTop: 6, fontFeatureSettings: '"ss01"', lineHeight: 1.5 }}>
            {s.startingBalanceHint}
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          style={{ background: loading ? "#b9b9f9" : "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}
        >
          {loading ? t.common.saving : s.saveChanges}
        </Button>
      </form>
    </div>
  );
}
