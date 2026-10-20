"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  guestId: string;
  isMockMode: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "signin" | "signup";
  openAuthModal: (defaultTab?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const GUEST_STORAGE_KEY = "vibecut_guest_session_id";
const MOCK_AUTH_STORAGE_KEY = "vibecut_mock_auth_session";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createMockUser(email = "creator@vibecut.ai", name = "Demo Creator"): User {
  return {
    id: "usr_mock_demo_creator",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {
      full_name: name,
      name: name,
      avatar_url: "",
      is_demo_account: true,
    },
    aud: "authenticated",
    confirmation_sent_at: "",
    recovery_sent_at: "",
    email_change_sent_at: "",
    new_email: "",
    invited_at: "",
    action_link: "",
    email: email,
    phone: "",
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: "",
    last_sign_in_at: new Date().toISOString(),
    role: "authenticated",
    updated_at: new Date().toISOString(),
    identities: [],
    factors: [],
  } as unknown as User;
}

function createMockSession(user: User): Session {
  return {
    access_token: "mock-access-token-" + Date.now(),
    refresh_token: "mock-refresh-token-" + Date.now(),
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [guestId, setGuestId] = useState<string>("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");

  const isMockMode = useMemo(() => !isSupabaseConfigured(), []);

  // 1. Initialize persistent guest session id
  useEffect(() => {
    try {
      let storedGuestId = localStorage.getItem(GUEST_STORAGE_KEY);
      if (!storedGuestId) {
        storedGuestId = generateUUID();
        localStorage.setItem(GUEST_STORAGE_KEY, storedGuestId);
      }
      setGuestId(storedGuestId);
    } catch {
      setGuestId(generateUUID());
    }
  }, []);

  // 2. Initialize Auth state (Mock vs Supabase)
  useEffect(() => {
    if (isMockMode) {
      try {
        const storedMock = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
        if (storedMock) {
          const parsedUser = JSON.parse(storedMock) as User;
          setUser(parsedUser);
          setSession(createMockSession(parsedUser));
        }
      } catch (err) {
        console.error("Failed to restore mock session:", err);
      }
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Fetch initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isMockMode]);

  // Modal controls
  const openAuthModal = useCallback((defaultTab: "signin" | "signup" = "signin") => {
    setAuthModalTab(defaultTab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Sign In with Email
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      if (isMockMode) {
        const mockUser = createMockUser(email || "creator@vibecut.ai", "Demo Creator");
        const mockSession = createMockSession(mockUser);
        try {
          localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        } catch {
          // ignore localStorage error
        }
        setUser(mockUser);
        setSession(mockSession);
        setIsAuthModalOpen(false);
        return { error: null };
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        setIsAuthModalOpen(false);
      }
      return { error };
    },
    [isMockMode]
  );

  // Sign Up with Email
  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      if (isMockMode) {
        const mockUser = createMockUser(email || "creator@vibecut.ai", "Demo Creator");
        const mockSession = createMockSession(mockUser);
        try {
          localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        } catch {
          // ignore
        }
        setUser(mockUser);
        setSession(mockSession);
        setIsAuthModalOpen(false);
        return { error: null };
      }

      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            guest_id: guestId, // Polymorphic guest linking
          },
        },
      });

      if (!error) {
        setIsAuthModalOpen(false);
      }
      return { error };
    },
    [isMockMode, guestId]
  );

  // Sign In with Google
  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    if (isMockMode) {
      const mockUser = createMockUser("google.creator@vibecut.ai", "Google Creator");
      const mockSession = createMockSession(mockUser);
      try {
        localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // ignore
      }
      setUser(mockUser);
      setSession(mockSession);
      setIsAuthModalOpen(false);
      return { error: null };
    }

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error };
  }, [isMockMode]);

  // Sign Out
  const signOut = useCallback(async () => {
    if (isMockMode) {
      try {
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
      } catch {
        // ignore
      }
      setUser(null);
      setSession(null);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [isMockMode]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isGuest: !user,
      guestId,
      isMockMode,
      isAuthModalOpen,
      authModalTab,
      openAuthModal,
      closeAuthModal,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [
      user,
      session,
      loading,
      guestId,
      isMockMode,
      isAuthModalOpen,
      authModalTab,
      openAuthModal,
      closeAuthModal,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
