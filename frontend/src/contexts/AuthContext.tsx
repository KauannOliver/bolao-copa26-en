import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'PENDING' | 'BETTOR' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('bolao_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('bolao_token');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthError = () => {
      setUser(null);
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('bolao_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bolao_token');
    setUser(null);
  };

  const refetchUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
