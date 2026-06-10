import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { GripVertical, Save, ChevronUp, ChevronDown } from 'lucide-react';

export const Grupos: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{groupId: string, teamIndex: number} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, predsRes, settingsRes] = await Promise.all([
          api.get('/groups'),
          api.get('/predictions/group-stage/me'),
          api.get('/predictions/settings')
        ]);
        
        const preds = predsRes.data;
        const settings = settingsRes.data;
        if (settings && settings.group_stage_deadline) {
          if (new Date() > new Date(settings.group_stage_deadline)) {
            setIsLocked(true);
          }
        }
        
        const initializedGroups = groupsRes.data.map((g: any) => {
          const teams = [...g.Team];
          teams.sort((a, b) => {
            const predA = preds.find((p: any) => p.team_id === a.id);
            const predB = preds.find((p: any) => p.team_id === b.id);
            if (predA && predB) return predA.predicted_position - predB.predicted_position;
            if (predA) return -1;
            if (predB) return 1;
            return 0;
          });
          return { ...g, Team: teams };
        });

        setGroups(initializedGroups);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDragStart = (e: React.DragEvent, groupId: string, index: number) => {
    if (isLocked) return;
    setDraggedItem({ groupId, teamIndex: index });
    e.dataTransfer.effectAllowed = 'move';
    // Small timeout to allow the visual drag image to capture before styling changes
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, groupId: string, targetIndex: number) => {
    e.preventDefault();
    if (isLocked) return;
    if (!draggedItem || draggedItem.groupId !== groupId || draggedItem.teamIndex === targetIndex) return;
    
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const newTeams = [...g.Team];
      const temp = newTeams[draggedItem.teamIndex];
      newTeams.splice(draggedItem.teamIndex, 1);
      newTeams.splice(targetIndex, 0, temp);
      return { ...g, Team: newTeams };
    }));
    
    setDraggedItem({ groupId, teamIndex: targetIndex });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedItem(null);
  };

  const moveTeam = (groupId: string, index: number, direction: 'up' | 'down') => {
    if (isLocked) return;
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const newTeams = [...g.Team];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newTeams.length) return g;
      
      const temp = newTeams[index];
      newTeams[index] = newTeams[targetIndex];
      newTeams[targetIndex] = temp;
      
      return { ...g, Team: newTeams };
    }));
  };

  const saveAllPredictions = async () => {
    let allPredictions: any[] = [];
    groups.forEach(group => {
      group.Team.forEach((t: any, i: number) => {
        allPredictions.push({
          group_id: group.id,
          team_id: t.id,
          predicted_position: i + 1
        });
      });
    });
    
    try {
      await api.post('/predictions/group-stage', { predictions: allPredictions });
      alert('Todos os palpites foram salvos com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar palpites');
    }
  };

  if (loading) return <div className="text-white">Carregando...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="heading-1 !mb-2">Fase de Grupos</h1>
          <p className="text-muted-foreground">
            {isLocked ? 'O prazo para palpitar encerrou. Você está no modo visualização.' : 'Arraste as seleções para reordenar seu palpite em cada grupo.'}
          </p>
        </div>
        {!isLocked && (
          <button onClick={saveAllPredictions} className="btn-primary flex items-center justify-center gap-2 px-8 py-3 shadow-lg shadow-primary/20">
            <Save className="w-5 h-5" /> Salvar Todos os Palpites
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groups.map(group => (
          <div key={group.id} className="glass-card p-4 flex flex-col hover:border-primary/50 transition-all duration-300">
            <h3 className="text-xl font-bold text-white text-center mb-4 border-b border-white/10 pb-2">Grupo {group.letter}</h3>
            
            <ul className="space-y-2 flex-1">
              {group.Team.map((team: any, index: number) => (
                            <li 
                  key={team.id} 
                  draggable={!isLocked}
                  onDragStart={(e) => handleDragStart(e, group.id, index)}
                  onDragEnter={(e) => handleDragEnter(e, group.id, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`flex items-center gap-3 bg-white/5 p-2 rounded-lg transition-colors ${!isLocked ? 'cursor-grab active:cursor-grabbing hover:bg-white/10' : 'opacity-80'}`}
                >
                  <GripVertical className="w-4 h-4 text-white/30" />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 2 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                    {index + 1}º
                  </div>
                  <span className="text-white flex-1 font-medium select-none pointer-events-none">{team.name}</span>
                  {!isLocked && (
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveTeam(group.id, index, 'up'); }} 
                        disabled={index === 0}
                        className="p-1 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 rounded"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveTeam(group.id, index, 'down'); }} 
                        disabled={index === group.Team.length - 1}
                        className="p-1 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 rounded"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
          </div>
        ))}
      </div>
    </div>
  );
};
