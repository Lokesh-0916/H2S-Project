import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Role } from "./types";

const AUTH_URL = "http://localhost:3001";

type Theme = "dark" | "light";
interface Ctx {
  user: User | null;
  theme: Theme;
  section: string;
  toggleTheme: () => void;
  login: (u: User) => void;
  logout: () => void;
  setSection: (s: string) => void;
  updateProfile: (fields: Partial<User>) => void;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [section, setSection] = useState("dashboard");

  // ── Load persisted session & handle OAuth callback ────
  useEffect(() => {
    try {
      // Handle OAuth token in URL (Google/Microsoft redirect)
      const params = new URLSearchParams(window.location.search);
      const token = params.get("oauth_token");
      const error = params.get("oauth_error");

      if (token || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (token) {
        // Decode JWT payload (no verification needed — server already verified)
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        const role: Role = payload.role === "store" ? "store" : "patient";
        const partialUser: User = {
          name: payload.name || payload.email?.split("@")[0] || "User",
          email: payload.email,
          role,
          pharmacyName: payload.storeName || undefined,
          region: "Bengaluru Zone",
          token,
        };
        // Fetch full profile from DB and merge
        fetchAndMergeProfile(partialUser);
        return;
      }

      // Restore session from sessionStorage
      const raw = sessionStorage.getItem("medsmart-user");
      if (raw) {
        const saved: User = JSON.parse(raw);
        setUser(saved);
        // Re-fetch profile to get latest DB data
        if (saved.token) fetchAndMergeProfile(saved);
      }

      const t = (sessionStorage.getItem("medsmart-theme") as Theme) || "dark";
      setTheme(t);
    } catch (e) {
      console.error("Session restore error:", e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { sessionStorage.setItem("medsmart-theme", theme); } catch {}
  }, [theme]);

  // ── Fetch full profile from /profile and merge into user ─
  async function fetchAndMergeProfile(base: User) {
    if (!base.token) {
      persistUser(base);
      return;
    }
    try {
      const res = await fetch(`${AUTH_URL}/profile`, {
        headers: { Authorization: `Bearer ${base.token}` },
      });
      if (res.ok) {
        const { user: dbUser } = await res.json();
        const merged: User = {
          ...base,
          name:    dbUser.profile?.name    || base.name,
          phone:   dbUser.profile?.phone   || base.phone,
          address: dbUser.profile?.address || base.address,
          gender:  dbUser.profile?.gender  || base.gender,
          age:     dbUser.profile?.age     ?? base.age,
          dob:     dbUser.profile?.dob     || base.dob,
          pharmacyName: dbUser.storeName   || base.pharmacyName,
        };
        persistUser(merged);
      } else {
        persistUser(base);
      }
    } catch {
      // Offline / server down — use base data
      persistUser(base);
    }
  }

  function persistUser(u: User) {
    setUser(u);
    setSection("dashboard");
    try { sessionStorage.setItem("medsmart-user", JSON.stringify(u)); } catch {}
  }

  const login = (u: User) => {
    if (u.token) {
      fetchAndMergeProfile(u);
    } else {
      persistUser(u);
    }
  };

  const logout = () => {
    setUser(null);
    try { sessionStorage.removeItem("medsmart-user"); } catch {}
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // ── Update profile locally (Shell calls this after a successful PUT /profile) ─
  const updateProfile = (fields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      try { sessionStorage.setItem("medsmart-user", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  return (
    <AppCtx.Provider value={{ user, theme, section, toggleTheme, login, logout, setSection, updateProfile }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("AppProvider missing");
  return c;
}

export function roleFromString(s: string): Role { return s === "store" ? "store" : "patient"; }
