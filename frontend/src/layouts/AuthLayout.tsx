import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Carregando...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg mb-4">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <h1 className="heading-1 text-center mb-2">Bolão 2026</h1>
          <p className="text-muted-foreground text-center">Aposte, compita e divirta-se na Copa do Mundo</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
