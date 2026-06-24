import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  institutionAdminOf: string[];
  isPlatformAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [institutionAdminOf, setInstitutionAdminOf] = useState<string[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, phone, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }

  async function loadRoles(uid: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, institution_id")
      .eq("user_id", uid);
    const rows = data ?? [];
    setInstitutionAdminOf(rows.filter((r) => r.role === "INSTITUTION_ADMIN").map((r) => r.institution_id).filter((x): x is string => !!x));
    setIsPlatformAdmin(rows.some((r) => r.role === "PLATFORM_ADMIN"));
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const uid = newSession.user.id;
        setTimeout(() => { loadProfile(uid); loadRoles(uid); }, 0);
      } else {
        setProfile(null);
        setInstitutionAdminOf([]);
        setIsPlatformAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
        loadRoles(data.session.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setInstitutionAdminOf([]);
    setIsPlatformAdmin(false);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  async function refreshRoles() {
    if (user) await loadRoles(user.id);
  }

  return (
    <Ctx.Provider value={{ user, session, profile, institutionAdminOf, isPlatformAdmin, loading, signOut, refreshProfile, refreshRoles }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

