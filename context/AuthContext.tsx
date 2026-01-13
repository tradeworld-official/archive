import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockSupabase } from '../services/mockSupabase';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<string | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = mockSupabase.auth.getSession();
      setIsAuthenticated(session);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (password: string) => {
    setIsLoading(true);
    const { error } = await mockSupabase.auth.signIn(password);
    if (!error) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return null;
    }
    setIsLoading(false);
    return error;
  };

  const logout = async () => {
    await mockSupabase.auth.signOut();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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