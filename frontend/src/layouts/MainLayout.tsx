import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, LayoutDashboard, Target, Swords, BarChart3, Settings, LogOut, BookOpen } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.status === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in-up">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Aguardando Aprovação</h2>
          <p className="text-muted-foreground mb-6">Seu cadastro foi recebido! O administrador precisa aprovar sua conta antes de você poder palpitar.</p>
          <button onClick={logout} className="btn-secondary w-full">Sair</button>
        </div>
      </div>
    );
  }

  if (user.status === 'REJECTED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in-up">
          <h2 className="text-2xl font-bold text-destructive mb-2">Conta Rejeitada</h2>
          <p className="text-muted-foreground mb-6">Infelizmente, seu acesso não foi aprovado pelo administrador.</p>
          <button onClick={logout} className="btn-secondary w-full">Sair</button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fase de Grupos', path: '/grupos', icon: Target },
    { name: 'Mata-Mata', path: '/mata-mata', icon: Swords },
    { name: 'Ranking', path: '/ranking', icon: BarChart3 },
    { name: 'Regras', path: '/regras', icon: BookOpen },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ name: 'Admin', path: '/admin', icon: Settings });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 glass-panel border-b md:border-b-0 md:border-r border-white/10 flex flex-col md:min-h-screen p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between md:mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
              <Trophy className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Bolão 2026</span>
          </div>
          <button onClick={logout} className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive-foreground transition-all" title="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-row md:flex-col flex overflow-x-auto md:overflow-visible gap-2 md:gap-2 mt-4 md:mt-0 pb-2 md:pb-0 scrollbar-hide">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-2 md:gap-3 px-3 py-2.5 rounded-xl transition-all whitespace-nowrap ${isActive ? 'bg-primary/20 text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm md:text-base">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block mt-auto pt-4 border-t border-white/10">
          <div className="px-3 mb-4">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive-foreground transition-all">
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
