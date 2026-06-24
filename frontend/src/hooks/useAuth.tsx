"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { api } from "@/lib/api";
import { setToken, removeToken, getToken } from "@/lib/auth";

interface User {
  id: number;
  email: string;
  role: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.post<{ token: string; user: User }>("/auth/register/", payload);
    setToken(res.token);
    setUser(res.user);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}