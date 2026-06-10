import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Swords, Save, Lock, Clock } from 'lucide-react';

const PHASES = [
  { key: 'ROUND_OF_32', label: '16 Avos de Final', short: '16 Avos', settingPrefix: 'r32' },
  { key: 'ROUND_OF_16', label: 'Oitavas de Final', short: 'Oitavas', settingPrefix: 'r16' },
  { key: 'QUARTER_FINAL', label: 'Quartas de Final', short: 'Quartas', settingPrefix: 'qf' },
  { key: 'SEMI_FINAL', label: 'Semifinal', short: 'Semis', settingPrefix: 'sf' },
  { key: 'THIRD_PLACE', label: 'Disputa 3º Lugar', short: '3º Lugar', settingPrefix: 'third' },
  { key: 'FINAL', label: 'Final', short: 'Final', settingPrefix: 'final' }
];

export const MataMata: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activePhase, setActivePhase] = useState('ROUND_OF_32');
  const [forms, setForms] = useState<Record<string, {ta: number|'', tb: number|'', winnerId: string|null}>>({});

  const fetchData = async () => {
    try {
      const [matchesRes, predsRes, setsRes] = await Promise.all([
        api.get('/predictions/matches'),
        api.get('/predictions/knockout/me'),
        api.get('/predictions/settings')
      ]);
      setMatches(matchesRes.data);
      setPredictions(predsRes.data);
      setSettings(setsRes.data);
      
      const initialForms: any = {};
      predsRes.data.forEach((p: any) => {
        initialForms[p.match_id] = { 
          ta: p.predicted_goals_team_a, 
          tb: p.predicted_goals_team_b,
          winnerId: p.predicted_winner_team_id
        };
      });
      setForms(initialForms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveMassPredictions = async () => {
    const phaseMatches = matches.filter(m => m.stage === activePhase && m.TeamA && m.TeamB);
    const payloads = [];

    for (const match of phaseMatches) {
      const f = forms[match.id];
      if (!f || f.ta === '' || f.tb === '') continue; // Skip incomplete

      let winnerId = f.winnerId;
      if (f.ta > f.tb) winnerId = match.TeamA.id;
      else if (f.tb > f.ta) winnerId = match.TeamB.id;
      else {
        if (!winnerId) {
          alert(`Você declarou empate no Jogo ${match.fifa_match_number}, mas não selecionou quem avança nos pênaltis.`);
          return;
        }
      }

      payloads.push({
        match_id: match.id,
        predicted_goals_team_a: Number(f.ta),
        predicted_goals_team_b: Number(f.tb),
        predicted_winner_team_id: winnerId
      });
    }

    if (payloads.length === 0) {
      alert('Nenhum palpite preenchido nesta fase para salvar.');
      return;
    }

    try {
      await api.post('/predictions/knockout/mass-save', {
        phase: activePhase,
        predictions: payloads
      });
      alert('Todos os palpites desta fase foram salvos com sucesso!');
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Erro ao salvar palpites');
    }
  };

  if (loading) return <div className="text-white">Carregando...</div>;

  const activePhaseDef = PHASES.find(p => p.key === activePhase);
  const isVisible = settings?.[`${activePhaseDef?.settingPrefix}_visible`];
  const deadline = settings?.[`${activePhaseDef?.settingPrefix}_deadline`] ? new Date(settings[`${activePhaseDef?.settingPrefix}_deadline`]) : null;
  const isLocked = deadline ? new Date() > deadline : false;

  const phaseMatches = matches.filter(m => m.stage === activePhase);

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div>
        <h1 className="heading-1">Mata-Mata</h1>
        <p className="text-muted-foreground">Palpite nos resultados dos confrontos eliminatórios.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-hide">
        {PHASES.map(phase => (
          <button 
            key={phase.key}
            onClick={() => setActivePhase(phase.key)}
            className={`px-4 py-3 font-semibold whitespace-nowrap transition-colors border-b-2 ${activePhase === phase.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
          >
            {phase.label}
          </button>
        ))}
      </div>
      
      {!isVisible ? (
        <div className="glass-card p-12 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Fase Oculta</h2>
          <p className="text-muted-foreground">O administrador ainda não liberou esta fase para palpites.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              {isLocked ? (
                <div className="flex items-center gap-2 text-destructive">
                  <Lock className="w-5 h-5"/>
                  <span className="font-bold">Apostas Encerradas</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="w-5 h-5"/>
                  <span className="font-bold">Apostas Abertas</span>
                </div>
              )}
              {deadline && <span className="text-sm text-white/70 ml-2">Limite: {deadline.toLocaleString()}</span>}
            </div>

            {!isLocked && phaseMatches.some(m => m.TeamA && m.TeamB) && (
              <button onClick={saveMassPredictions} className="btn-primary flex items-center justify-center gap-2">
                <Save className="w-4 h-4"/> Salvar Palpites ({activePhaseDef?.short})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {phaseMatches.map(match => {
              const isReady = match.TeamA && match.TeamB;
              const f = forms[match.id] || { ta: '', tb: '', winnerId: null };
              const isTie = f.ta !== '' && f.tb !== '' && f.ta === f.tb;

              return (
                <div key={match.id} className={`glass-card p-5 relative overflow-hidden flex flex-col ${isLocked ? 'opacity-80' : ''}`}>
                  <div className="absolute top-0 right-0 bg-white/10 px-3 py-1 text-xs font-bold text-white/50 rounded-bl-lg">
                    Jogo {match.fifa_match_number}
                  </div>
                  
                  <div className="mt-4 space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isReady && isTie && (
                          <input 
                            type="radio"
                            name={`winner-${match.id}`}
                            disabled={isLocked}
                            checked={f.winnerId === match.TeamA.id}
                            onChange={() => setForms(prev => ({...prev, [match.id]: {...prev[match.id], winnerId: match.TeamA.id}}))}
                            className="w-4 h-4 text-primary bg-background border-white/20 focus:ring-primary cursor-pointer"
                            title="Avança nos pênaltis"
                          />
                        )}
                        {match.TeamA ? (
                          <span className={`font-semibold truncate max-w-[120px] ${isReady && isTie && f.winnerId === match.TeamA.id ? 'text-primary' : 'text-white'}`}>{match.TeamA.name}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">A definir</span>
                        )}
                      </div>
                      {isReady && (
                        <input 
                          type="number" min="0" max="20"
                          disabled={isLocked}
                          className="w-12 text-center bg-background border border-white/10 rounded text-white py-1 disabled:opacity-50"
                          value={f.ta}
                          onChange={e => setForms(prev => ({...prev, [match.id]: {...(prev[match.id]||{tb:'',winnerId:null}), ta: e.target.value === '' ? '' : parseInt(e.target.value)}}))}
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isReady && isTie && (
                          <input 
                            type="radio"
                            name={`winner-${match.id}`}
                            disabled={isLocked}
                            checked={f.winnerId === match.TeamB.id}
                            onChange={() => setForms(prev => ({...prev, [match.id]: {...prev[match.id], winnerId: match.TeamB.id}}))}
                            className="w-4 h-4 text-primary bg-background border-white/20 focus:ring-primary cursor-pointer"
                            title="Avança nos pênaltis"
                          />
                        )}
                        {match.TeamB ? (
                          <span className={`font-semibold truncate max-w-[120px] ${isReady && isTie && f.winnerId === match.TeamB.id ? 'text-primary' : 'text-white'}`}>{match.TeamB.name}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">A definir</span>
                        )}
                      </div>
                      {isReady && (
                        <input 
                          type="number" min="0" max="20"
                          disabled={isLocked}
                          className="w-12 text-center bg-background border border-white/10 rounded text-white py-1 disabled:opacity-50"
                          value={f.tb}
                          onChange={e => setForms(prev => ({...prev, [match.id]: {...(prev[match.id]||{ta:'',winnerId:null}), tb: e.target.value === '' ? '' : parseInt(e.target.value)}}))}
                        />
                      )}
                    </div>
                  </div>
                  
                  {isReady && isTie && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-center text-xs text-primary animate-fade-in-up">
                      Selecione acima quem avança nos pênaltis
                    </div>
                  )}

                </div>
              );
            })}
            
            {phaseMatches.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Nenhum jogo gerado para esta fase ainda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
