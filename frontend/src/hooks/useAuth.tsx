"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { api } from "@/lib/api";
import { setToken, removeToken, getToken } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

interface User {
  id: number;
  email: string;
  role: string;
  full_name?: string;
  email_verified?: boolean;
}

interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  language?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { locale } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get<{ user: User }>("/auth/me/").then(res => {
        setUser(res.user);
      }).catch(() => {
        removeToken();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login/", { email, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.post<{ token: string; user: User }>("/auth/register/", { ...payload, language: locale });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Short display name for a user: first word of the full name, else the local
 * part of the email (before "@"), lowercased. Falls back when not logged in.
 */
export function userDisplayName(user: Pick<User, "email" | "full_name"> | null, fallback: string) {
  if (!user) return fallback;
  const firstName = (user.full_name || "").trim().split(/\s+/)[0];
  if (firstName) return firstName.toLowerCase();
  const local = (user.email || "").split("@")[0];
  return local ? local.toLowerCase() : fallback;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
