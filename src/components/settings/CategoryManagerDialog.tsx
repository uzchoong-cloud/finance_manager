"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useFinanceStore } from "@/store/useFinanceStore";
import { addCategory, updateCategory, deleteCategory, countTransactionsForCategory } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { hexToRgba } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PRESET_COLORS = [
  "#533afd", "#108c3d", "#ea2261", "#f59e0b",
  "#06b6d4", "#8b5cf6", "#f97316", "#be185d",
  "#0ea5e9", "#14b8a6", "#64748b", "#273951",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: 20, height: 20, borderRadius: "50%", background: c, border: "none",
            cursor: "pointer", flexShrink: 0,
            outline: value === c ? `2px solid ${c}` : "2px solid transparent",
            outlineOffset: 2,
          }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title="Custom colour"
        style={{ width: 20, height: 20, padding: 0, border: "1px solid var(--wt-border)", borderRadius: "50%", cursor: "pointer", background: "none" }}
      />
    </div>
  );
}

export function CategoryManagerDialog({ open, onOpenChange }: Props) {
  const categories = useFinanceStore((s) => s.categories);
  const loadCategories = useFinanceStore((s) => s.loadCategories);
  const { t } = useI18n();
  const cm = t.categoryManager;

  // Edit state: which category row is being edited inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("#533afd");

  // Add state
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#533afd");

  const [saving, setSaving] = useState(false);

  const startEdit = (id: string, label: string, color: string) => {
    setEditingId(id); setEditLabel(label); setEditColor(color);
    setAdding(false);
  };

  const cancelEdit = () => { setEditingId(null); };

  const handleSaveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    setSaving(true);
    try {
      await updateCategory(id, { label: editLabel.trim(), color: editColor });
      await loadCategories();
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cm.saveError);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, key: string, label: string) => {
    const count = await countTransactionsForCategory(key);
    const msg = count > 0 ? cm.deleteConfirm(label, count) : cm.deleteConfirmEmpty(label);
    if (!confirm(msg)) return;
    setSaving(true);
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cm.saveError);
    } finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      const key = crypto.randomUUID();
      const maxOrder = Math.max(0, ...categories.map((c) => c.sortOrder));
      await addCategory({ key, label: newLabel.trim(), color: newColor, sortOrder: maxOrder + 1 });
      await loadCategories();
      setAdding(false); setNewLabel(""); setNewColor("#533afd");
      toast.success(cm.addSuccess(newLabel.trim()));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cm.saveError);
    } finally { setSaving(false); }
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
    borderBottom: "1px solid var(--wt-border)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ borderRadius: "8px", border: "1px solid var(--wt-border)", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: "1.1rem", fontWeight: 300, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>
            {cm.title}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-1">
          {categories.map((cat) => (
            <div key={cat.id} style={rowStyle}>
              {editingId === cat.id ? (
                /* ── Inline edit row ── */
                <div className="flex-1 space-y-2">
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(cat.id!); if (e.key === "Escape") cancelEdit(); }}
                    style={{ width: "100%", fontSize: "13px", padding: "5px 8px", borderRadius: "4px", border: "1px solid #533afd", background: "var(--wt-surface)", color: "var(--wt-text)", outline: "none", fontFeatureSettings: '"ss01"' }}
                  />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSaveEdit(cat.id!)}
                      disabled={saving || !editLabel.trim()}
                      style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "4px", background: "#533afd", color: "#fff", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>
                      {saving ? t.common.saving : t.common.save}
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "4px", background: "transparent", color: "var(--wt-muted)", border: "1px solid var(--wt-border)", cursor: "pointer" }}>
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal row ── */
                <>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block",
                    boxShadow: `0 0 0 3px ${hexToRgba(cat.color, 0.15)}` }} />
                  <span style={{ flex: 1, fontSize: "14px", color: "var(--wt-text)", fontFeatureSettings: '"ss01"', fontWeight: 300 }}>
                    {cat.label}
                  </span>
                  <button
                    onClick={() => startEdit(cat.id!, cat.label, cat.color)}
                    style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(83,58,253,0.06)", color: "#533afd", border: "1px solid rgba(83,58,253,0.2)", cursor: "pointer" }}>
                    {t.common.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id!, cat.key, cat.label)}
                    style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(234,34,97,0.06)", color: "#ea2261", border: "1px solid rgba(234,34,97,0.2)", cursor: "pointer" }}>
                    {t.common.delete}
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add new */}
          {adding ? (
            <div className="space-y-2 pt-4">
              <input
                autoFocus
                placeholder={cm.namePlaceholder}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
                style={{ width: "100%", fontSize: "13px", padding: "6px 10px", borderRadius: "4px", border: "1px solid #533afd", background: "var(--wt-surface)", color: "var(--wt-text)", outline: "none", fontFeatureSettings: '"ss01"' }}
              />
              <ColorPicker value={newColor} onChange={setNewColor} />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={saving || !newLabel.trim()}
                  style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "4px", background: "#533afd", color: "#fff", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>
                  {saving ? t.common.saving : t.common.add}
                </button>
                <button
                  onClick={() => { setAdding(false); setNewLabel(""); }}
                  style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "4px", background: "transparent", color: "var(--wt-muted)", border: "1px solid var(--wt-border)", cursor: "pointer" }}>
                  {t.common.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setAdding(true); setEditingId(null); }}
              style={{ marginTop: 16, fontSize: "13px", color: "#533afd", background: "rgba(83,58,253,0.04)", border: "1px dashed rgba(83,58,253,0.3)", borderRadius: "4px", padding: "8px 0", width: "100%", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>
              {cm.addBtn}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
