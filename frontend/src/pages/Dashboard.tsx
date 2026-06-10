import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { Trophy, Target, Swords, ArrowRight, Star, BookOpen } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rankings, setRankings] = useState<{groupStage: any[], knockout: any[]}>({ groupStage: [], knockout: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meRes, rankRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/rankings')
        ]);
        setUser(meRes.data);
        
        if (Array.isArray(rankRes.data)) {
           setRankings({ groupStage: rankRes.data, knockout: [] });
        } else {
           setRankings(rankRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-white">Carregando...</div>;

  const myGroupRank = rankings.groupStage?.find((r: any) => r.id === user.id);
  const myKnockoutRank = rankings.knockout?.find((r: any) => r.id === user.id);

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card border-none bg-gradient-to-br from-primary/30 to-background p-8 md:p-12">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 text-white/5">
          <Trophy className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Olá, <span className="text-primary">{user.name.split(' ')[0]}</span>!
          </h1>
          <p className="text-lg text-white/80 max-w-xl mb-8">
            Bem-vindo ao Bolão Oficial da Copa do Mundo 2026. Prepare seus palpites, acompanhe os resultados e suba no ranking para garantir a premiação!
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/grupos')} className="btn-primary flex items-center gap-2">
              <Target className="w-5 h-5"/> Palpites: Grupos
            </button>
            <button onClick={() => navigate('/mata-mata')} className="btn-secondary flex items-center gap-2">
              <Swords className="w-5 h-5"/> Palpites: Mata-Mata
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-center justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/ranking')}>
          <div>
            <h3 className="text-muted-foreground font-medium mb-1">Ranking 1ª Etapa (Grupos)</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">{myGroupRank?.position || '-'}º</span>
              <span className="text-lg text-primary font-semibold">{myGroupRank?.totalPoints || 0} pts</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowRight className="w-6 h-6 text-white/50" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/ranking')}>
          <div>
            <h3 className="text-muted-foreground font-medium mb-1">Ranking 2ª Etapa (Mata-Mata)</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">{myKnockoutRank?.position || '-'}º</span>
              <span className="text-lg text-primary font-semibold">{myKnockoutRank?.totalPoints || 0} pts</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowRight className="w-6 h-6 text-white/50" />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="heading-2 mt-12">Acesso Rápido</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => navigate('/regras')} className="glass-card p-6 hover:bg-white/5 cursor-pointer transition-colors text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">Regras e Premiação</h3>
          <p className="text-sm text-muted-foreground">Confira a pontuação e os critérios de desempate.</p>
        </div>
        <div onClick={() => navigate('/ranking')} className="glass-card p-6 hover:bg-white/5 cursor-pointer transition-colors text-center">
          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">Quadro de Líderes</h3>
          <p className="text-sm text-muted-foreground">Veja quem está liderando o bolão no momento.</p>
        </div>
        {user.role === 'ADMIN' && (
          <div onClick={() => navigate('/admin')} className="glass-card p-6 border-primary/30 hover:bg-primary/10 cursor-pointer transition-colors text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-primary mb-2">Painel de Controle</h3>
            <p className="text-sm text-primary/70">Área exclusiva do Administrador para gerenciar o bolão.</p>
          </div>
        )}
      </div>

    </div>
  );
};
