"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Changed from 'next/navigation' to 'next/router' if using older Next.js, but for App Router it's 'next/navigation'

interface Admin {
  id: string;
  username: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (token: string, adminData: Admin) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedAdmin = localStorage.getItem('authAdmin');
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, adminData: Admin) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authAdmin', JSON.stringify(adminData));
    setToken(newToken);
    setAdmin(adminData);
    router.push('/'); // Redirect to dashboard after login
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authAdmin');
    setToken(null);
    setAdmin(null);
    router.push('/login'); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

