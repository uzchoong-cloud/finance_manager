"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";

interface UserRow {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

type PanelMode = "list" | "add" | "reset";

export function UserManagementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const currentProfile = useAuthStore((s) => s.profile);
  const { t } = useI18n();
  const adm = t.admin;
  const [mode, setMode] = useState<PanelMode>("list");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Add form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");

  // Reset form
  const [resetPassword, setResetPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.users) setUsers(json.users);
    } catch {
      toast.error(t.admin.title);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (open) { loadUsers(); setMode("list"); }
  }, [open, loadUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim().toLowerCase(), password: newPassword, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? adm.createAccount); return; }
      toast.success(adm.createSuccess(newUsername.trim().toLowerCase()));
      setNewUsername(""); setNewPassword(""); setNewRole("user");
      setMode("list");
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPassword) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, password: resetPassword }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? adm.resetSubmit); return; }
      toast.success(adm.resetSuccess(selectedUser.username));
      setResetPassword(""); setSelectedUser(null); setMode("list");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (user.id === currentProfile?.id) { toast.error(adm.cantDeleteSelf); return; }
    if (!confirm(adm.deleteConfirm(user.username))) return;
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? adm.resetSubmit); return; }
      toast.success(adm.deleteSuccess(user.username));
      await loadUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: "13px", color: "#273951", fontFeatureSettings: '"ss01"' };
  const inputStyle = { borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"ss01"' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ borderRadius: "8px", border: "1px solid #e5edf5", maxWidth: 480 }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle style={{ fontSize: "1.1rem", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>
              {mode === "list" ? adm.title : mode === "add" ? adm.addTitle : adm.resetTitle(selectedUser?.username ?? "")}
            </DialogTitle>
            {mode !== "list" && (
              <button
                onClick={() => { setMode("list"); setSelectedUser(null); setResetPassword(""); setNewUsername(""); setNewPassword(""); }}
                style={{ fontSize: "12px", color: "#64748d", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
              >
                {t.common.back}
              </button>
            )}
          </div>
        </DialogHeader>

        {/* LIST */}
        {mode === "list" && (
          <div className="space-y-3 pt-1">
            {loadingUsers ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded animate-pulse" style={{ background: "#f0f4f8" }} />)}
              </div>
            ) : users.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#64748d", textAlign: "center", padding: "24px 0" }}>{adm.noUsers}</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded px-3 py-2.5" style={{ background: "#f8fafc", border: "1px solid #e5edf5", borderRadius: "6px" }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "14px", color: "#061b31", fontFeatureSettings: '"ss01"' }}>{u.username}</span>
                        {u.role === "admin" && (
                          <span style={{ fontSize: "10px", color: "#533afd", background: "rgba(83,58,253,0.08)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "3px", padding: "1px 5px" }}>{adm.roleAdmin}</span>
                        )}
                        {u.id === currentProfile?.id && (
                          <span style={{ fontSize: "10px", color: "#64748d", background: "rgba(100,116,141,0.08)", border: "1px solid rgba(100,116,141,0.2)", borderRadius: "3px", padding: "1px 5px" }}>{adm.you}</span>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
                        {adm.joined} {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setSelectedUser(u); setMode("reset"); }}
                        style={{ fontSize: "11px", color: "#273951", background: "rgba(39,57,81,0.06)", border: "1px solid rgba(39,57,81,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}
                      >
                        {adm.resetPw}
                      </button>
                      {u.id !== currentProfile?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          style={{ fontSize: "11px", color: "#ea2261", background: "rgba(234,34,97,0.06)", border: "1px solid rgba(234,34,97,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => setMode("add")}
              className="w-full"
              style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none", marginTop: 4 }}
            >
              {adm.addAccount}
            </Button>
          </div>
        )}

        {/* ADD */}
        {mode === "add" && (
          <form onSubmit={handleAdd} className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label style={labelStyle}>{adm.usernameLabel}</Label>
              <Input
                placeholder="e.g. john"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                required
                autoFocus
                style={inputStyle}
              />
            </div>
            <div className="space-y-1">
              <Label style={labelStyle}>{adm.tempPassword}</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <p style={{ fontSize: "11px", color: "#64748d", fontFeatureSettings: '"ss01"', marginTop: 4 }}>
                {adm.tempPasswordHint}
              </p>
            </div>
            <div className="space-y-1">
              <Label style={labelStyle}>{adm.roleLabel}</Label>
              <div className="flex gap-2">
                {(["user", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRole(r)}
                    style={{
                      flex: 1, padding: "7px 0", fontSize: "13px", borderRadius: "4px", cursor: "pointer",
                      border: newRole === r ? "1px solid #533afd" : "1px solid #e5edf5",
                      background: newRole === r ? "rgba(83,58,253,0.06)" : "#fff",
                      color: newRole === r ? "#533afd" : "#273951",
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    {r === "admin" ? adm.roleAdmin : adm.roleUser}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full" style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
              {saving ? adm.creating : adm.createAccount}
            </Button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {mode === "reset" && selectedUser && (
          <form onSubmit={handleReset} className="space-y-4 pt-1">
            <div className="rounded px-3 py-2.5" style={{ background: "rgba(83,58,253,0.04)", border: "1px solid rgba(83,58,253,0.15)", borderRadius: "6px" }}>
              <p style={{ fontSize: "12px", color: "#533afd", fontFeatureSettings: '"ss01"' }}>
                {adm.resetHint(selectedUser.username)}
              </p>
            </div>
            <div className="space-y-1">
              <Label style={labelStyle}>{adm.newPassword}</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                autoFocus
                style={inputStyle}
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full" style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
              {saving ? t.common.saving : adm.resetSubmit}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
