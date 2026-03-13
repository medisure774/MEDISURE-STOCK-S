"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: any;
  login: (userData: any, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const storedUser = localStorage.getItem('medisure_user');
    const token = localStorage.getItem('medisure_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    localStorage.setItem('medisure_user', JSON.stringify(userData));
    localStorage.setItem('medisure_token', token);
    setUser(userData);
    
    if (userData.role === 'admin') {
      router.push('/admin/orders');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('medisure_user');
    localStorage.removeItem('medisure_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
