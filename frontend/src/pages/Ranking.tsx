import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Trophy, Medal, Target, Swords } from 'lucide-react';

export const Ranking: React.FC = () => {
  const [rankings, setRankings] = useState<{groupStage: any[], knockout: any[]}>({ groupStage: [], knockout: [] });
  const [activeTab, setActiveTab] = useState<'groupStage' | 'knockout'>('groupStage');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await api.get('/rankings');
        // If the backend is still returning an array (old logic), fallback gracefully
        if (Array.isArray(res.data)) {
           setRankings({ groupStage: res.data, knockout: [] });
        } else {
           setRankings(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  if (loading) return <div className="text-white">Carregando...</div>;

  const currentRanking = rankings[activeTab] || [];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Trophy className="w-12 h-12 text-primary" />
        <div>
          <h1 className="heading-1 !mb-0">Rankings das Etapas</h1>
          <p className="text-muted-foreground">Classificação separada por etapa para premiação individual.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('groupStage')} 
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'groupStage' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
        >
          <Target className="w-4 h-4"/> 1ª Etapa (Grupos)
        </button>
        <button 
          onClick={() => setActiveTab('knockout')} 
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'knockout' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
        >
          <Swords className="w-4 h-4"/> 2ª Etapa (Mata-Mata)
        </button>
      </div>
      
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold text-white/70 uppercase text-xs tracking-wider">Posição</th>
              <th className="px-6 py-4 font-semibold text-white/70 uppercase text-xs tracking-wider">Participante</th>
              <th className="px-6 py-4 font-semibold text-white/70 uppercase text-xs tracking-wider text-right">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {currentRanking.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white/90 w-8">{user.position}º</span>
                    {user.position === 1 && <Medal className="w-5 h-5 text-yellow-400" />}
                    {user.position === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                    {user.position === 3 && <Medal className="w-5 h-5 text-amber-600" />}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                <td className="px-6 py-4 font-bold text-primary text-right text-lg">{user.totalPoints}</td>
              </tr>
            ))}
            {currentRanking.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Nenhuma pontuação registrada ainda nesta etapa.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
