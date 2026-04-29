import { create } from "zustand";
import { supabase, toEmail, toUsername } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateSettings: (settings: Partial<Pick<Profile, "language" | "currency" | "startingBalance">>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: false,
  initialized: false,
  mustChangePassword: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      const mustChangePassword = !!session.user.user_metadata?.must_change_password;
      set({ profile, initialized: true, mustChangePassword });
    } else {
      set({ initialized: true });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        const mustChangePassword = !!session.user.user_metadata?.must_change_password;
        set({ profile, mustChangePassword });
      } else {
        set({ profile: null, mustChangePassword: false });
      }
    });
  },

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: toEmail(username),
        password,
      });
      if (error) throw new Error("Invalid username or password");
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ profile: null, mustChangePassword: false });
  },

  changePassword: async (newPassword: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false },
      });
      if (error) throw new Error(error.message);
      set({ mustChangePassword: false });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (settings) => {
    const { profile } = get();
    if (!profile) return;
    set({ loading: true });
    try {
      const updates: Record<string, unknown> = {};
      if (settings.language !== undefined) updates.language = settings.language;
      if (settings.currency !== undefined) updates.currency = settings.currency;
      if (settings.startingBalance !== undefined) updates.starting_balance = settings.startingBalance;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);
      if (error) throw new Error(error.message);

      set({ profile: { ...profile, ...settings } });
    } finally {
      set({ loading: false });
    }
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.id as string,
    username: data.username as string,
    role: data.role as UserRole,
    createdAt: data.created_at as string,
    language: (data.language as "en" | "ko") ?? "en",
    currency: (data.currency as "USD" | "KRW" | "HKD") ?? "USD",
    startingBalance: (data.starting_balance as number) ?? 0,
  };
}

export function useIsAdmin() {
  return useAuthStore((s) => s.profile?.role === "admin");
}

export function useUsername() {
  return useAuthStore((s) =>
    s.profile ? s.profile.username : toUsername(s.profile ?? "")
  );
}
