"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load user session from local storage on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem("waypoint_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("waypoint_user");
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return false;
      }

      setUser(data.user);
      localStorage.setItem("waypoint_user", JSON.stringify(data.user));
      return true;
    } catch {
      setLoginError("Network error. Please try again.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setLoginError(null);
    localStorage.removeItem("waypoint_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, loginError }}
    >
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
