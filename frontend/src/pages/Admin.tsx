import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Check, X, ShieldAlert, Trash2, Save, Play, ChevronUp, ChevronDown } from 'lucide-react';

const PHASES = [
  { key: 'GROUPS', label: 'Fase de Grupos' },
  { key: 'ROUND_OF_32', label: '16 Avos' },
  { key: 'ROUND_OF_16', label: 'Oitavas' },
  { key: 'QUARTER_FINAL', label: 'Quartas' },
  { key: 'SEMI_FINAL', label: 'Semis' },
  { key: 'THIRD_PLACE', label: '3º Lugar' },
  { key: 'FINAL', label: 'Final' }
];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'settings' | 'results'>('approvals');
  const [activeResultTab, setActiveResultTab] = useState<string>('GROUPS');
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [deadline, setDeadline] = useState('');
  
  const [knockoutSettings, setKnockoutSettings] = useState<any>({
    r32_deadline: '', r32_visible: false,
    r16_deadline: '', r16_visible: false,
    qf_deadline: '', r16_visible: false,
    qf_visible: false,
    sf_deadline: '', sf_visible: false,
    third_deadline: '', third_visible: false,
    final_deadline: '', final_visible: false,
  });

  const [groups, setGroups] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualifiedThirds, setQualifiedThirds] = useState<Record<string, boolean>>({});
  const [draggedItem, setDraggedItem] = useState<{groupId: string, teamIndex: number} | null>(null);
  const [matchForms, setMatchForms] = useState<Record<string, {ta?: number, tb?: number, winnerId?: string}>>({});

  const fetchUsers = async () => {
    try {
      const [pending, all] = await Promise.all([
        api.get('/admin/users/pending'),
        api.get('/admin/users')
      ]);
      setPendingUsers(pending.data);
      setAllUsers(all.data);
    } catch (e) { console.error(e); }
  };

  const fetchSettingsAndData = async () => {
    try {
      const [sets, grps, mats, results] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/groups'),
        api.get('/admin/matches'),
        api.get('/admin/group-results')
      ]);
      setSettings(sets.data);
      if (sets.data) {
        if (sets.data.group_stage_deadline) setDeadline(new Date(sets.data.group_stage_deadline).toISOString().slice(0, 16));
        setKnockoutSettings({
          r32_deadline: sets.data.r32_deadline ? new Date(sets.data.r32_deadline).toISOString().slice(0, 16) : '',
          r32_visible: sets.data.r32_visible,
          r16_deadline: sets.data.r16_deadline ? new Date(sets.data.r16_deadline).toISOString().slice(0, 16) : '',
          r16_visible: sets.data.r16_visible,
          qf_deadline: sets.data.qf_deadline ? new Date(sets.data.qf_deadline).toISOString().slice(0, 16) : '',
          qf_visible: sets.data.qf_visible,
          sf_deadline: sets.data.sf_deadline ? new Date(sets.data.sf_deadline).toISOString().slice(0, 16) : '',
          sf_visible: sets.data.sf_visible,
          third_deadline: sets.data.third_deadline ? new Date(sets.data.third_deadline).toISOString().slice(0, 16) : '',
          third_visible: sets.data.third_visible,
          final_deadline: sets.data.final_deadline ? new Date(sets.data.final_deadline).toISOString().slice(0, 16) : '',
          final_visible: sets.data.final_visible,
        });
      }
      
      const officialResults = results.data;
      const initialQualified: Record<string, boolean> = {};
      officialResults.forEach((r: any) => {
        if (r.is_third_place_qualified) {
          initialQualified[r.team_id] = true;
        }
      });
      setQualifiedThirds(initialQualified);

      const initializedGroups = grps.data.map((g: any) => {
        const teams = [...g.Team];
        teams.sort((a, b) => {
          const resA = officialResults.find((p: any) => p.team_id === a.id);
          const resB = officialResults.find((p: any) => p.team_id === b.id);
          if (resA && resB) return resA.official_position - resB.official_position;
          if (resA) return -1;
          if (resB) return 1;
          return 0;
        });
        return { ...g, Team: teams };
      });
      
      setGroups(initializedGroups);
      setMatches(mats.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchSettingsAndData();
  }, []);

  const [approvalRoles, setApprovalRoles] = useState<Record<string, string>>({});

  const approveUser = async (id: string) => {
    const role = approvalRoles[id] || 'BETTOR';
    await api.patch(`/admin/users/${id}/approve`, { role });
    fetchUsers();
  };

  const rejectUser = async (id: string) => {
    await api.patch(`/admin/users/${id}/reject`);
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Todos os palpites dele serão perdidos.')) {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    }
  };

  const saveDeadline = async () => {
    if (!deadline) return;
    try {
      await api.patch('/admin/settings/group-deadline', { deadline: new Date(deadline).toISOString() });
      alert('Data limite salva com sucesso!');
    } catch (e) { console.error(e); }
  };

  const saveKnockoutSettings = async () => {
    try {
      const payload: any = { ...knockoutSettings };
      if (payload.r32_deadline) payload.r32_deadline = new Date(payload.r32_deadline).toISOString(); else delete payload.r32_deadline;
      if (payload.r16_deadline) payload.r16_deadline = new Date(payload.r16_deadline).toISOString(); else delete payload.r16_deadline;
      if (payload.qf_deadline) payload.qf_deadline = new Date(payload.qf_deadline).toISOString(); else delete payload.qf_deadline;
      if (payload.sf_deadline) payload.sf_deadline = new Date(payload.sf_deadline).toISOString(); else delete payload.sf_deadline;
      if (payload.third_deadline) payload.third_deadline = new Date(payload.third_deadline).toISOString(); else delete payload.third_deadline;
      if (payload.final_deadline) payload.final_deadline = new Date(payload.final_deadline).toISOString(); else delete payload.final_deadline;
      
      await api.patch('/admin/settings/knockout-phases', payload);
      alert('Configurações do mata-mata salvas com sucesso!');
    } catch (e) { console.error(e); }
  };

  const calculateGroupScores = async () => {
    await api.post('/admin/group-results/calculate-scores');
    alert('Pontuações da Fase de Grupos calculadas e chaveamento inicial gerado!');
    fetchSettingsAndData();
  };

  const calculateKnockoutScores = async () => {
    if (!confirm(`Deseja calcular os pontos do mata-mata para a fase ${activeResultTab} e gerar o chaveamento da próxima fase?`)) return;
    try {
      await api.post('/admin/knockout/calculate-scores', { phase: activeResultTab });
      alert('Pontos calculados e chaveamento atualizado com sucesso!');
      fetchSettingsAndData();
    } catch (e) { console.error(e); }
  };

  const factoryReset = async () => {
    if (!confirm('ATENÇÃO: Você está prestes a excluir TODOS os palpites, resultados oficiais e pontuações calculadas. O bolão voltará ao estado inicial. Essa ação é IRREVERSÍVEL. Digite "CONFIRMAR" na próxima tela para continuar.')) return;
    const check = prompt('Digite CONFIRMAR para apagar todos os dados:');
    if (check === 'CONFIRMAR') {
      try {
        await api.post('/admin/factory-reset');
        alert('Bolão resetado com sucesso.');
        fetchSettingsAndData();
      } catch (e) {
        console.error(e);
        alert('Erro ao resetar o bolão.');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, groupId: string, index: number) => {
    setDraggedItem({ groupId, teamIndex: index });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.5'; }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, groupId: string, targetIndex: number) => {
    e.preventDefault();
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

  const saveGroupResults = async () => {
    const checkedCount = Object.values(qualifiedThirds).filter(v => v).length;
    if (checkedCount !== 8) {
      alert(`Você deve classificar exatamente 8 seleções de terceiro lugar. Atualmente você selecionou ${checkedCount}.`);
      return;
    }

    let allResults: any[] = [];
    groups.forEach(group => {
      group.Team.forEach((t: any, i: number) => {
        allResults.push({
          group_id: group.id,
          team_id: t.id,
          official_position: i + 1,
          is_third_place_qualified: i === 2 ? !!qualifiedThirds[t.id] : false
        });
      });
    });
    
    await api.post('/admin/group-results', { results: allResults });
    alert('Todos os resultados salvos com sucesso!');
  };

  const saveMassKnockoutResults = async () => {
    const phaseMatches = matches.filter(m => m.stage === activeResultTab && m.TeamA && m.TeamB);
    const payloads = [];

    for (const match of phaseMatches) {
      const f = matchForms[match.id];
      if (!f || f.ta === undefined || f.tb === undefined) continue;

      let winnerId = f.winnerId;
      if (f.ta > f.tb) winnerId = match.TeamA.id;
      else if (f.tb > f.ta) winnerId = match.TeamB.id;
      else if (!winnerId) {
        alert(`Você declarou empate no Jogo ${match.fifa_match_number}, mas não selecionou quem avança nos pênaltis.`);
        return;
      }

      payloads.push({
        match_id: match.id,
        goals_team_a: Number(f.ta),
        goals_team_b: Number(f.tb),
        winner_team_id: winnerId
      });
    }

    if (payloads.length === 0) {
      alert('Nenhum resultado preenchido para salvar.');
      return;
    }

    try {
      await api.post('/admin/matches/mass-result', { results: payloads });
      alert('Resultados da fase salvos com sucesso!');
      fetchSettingsAndData();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar resultados');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div>
        <h1 className="heading-1">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie o bolão, aprove usuários e cadastre resultados.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('approvals')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'approvals' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Aprovações</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Usuários</button>
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Configurações</button>
        <button onClick={() => setActiveTab('results')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'results' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Resultados Oficiais</button>
      </div>

      <div className="glass-card p-6">
        {loading ? <p className="text-white">Carregando...</p> : (
          <>
            {activeTab === 'approvals' && (
              <div>
                <h2 className="heading-2">Aprovação de Usuários</h2>
                {pendingUsers.length === 0 ? <p className="text-muted-foreground">Nenhum usuário pendente no momento.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white">
                      <thead className="text-xs uppercase bg-white/10 text-white/80">
                        <tr><th className="px-4 py-3 rounded-tl-xl">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3 rounded-tr-xl">Ações</th></tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map(user => (
                          <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 font-medium">{user.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                            <td className="px-4 py-3">
                              <select 
                                className="bg-background border border-white/10 rounded text-sm text-white py-1 px-2 focus:border-primary focus:outline-none"
                                value={approvalRoles[user.id] || 'BETTOR'}
                                onChange={(e) => setApprovalRoles(prev => ({...prev, [user.id]: e.target.value}))}
                              >
                                <option value="BETTOR">Apostador</option>
                                <option value="ADMIN">Administrador</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button onClick={() => approveUser(user.id)} className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30" title="Aprovar"><Check className="w-4 h-4" /></button>
                              <button onClick={() => rejectUser(user.id)} className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30" title="Rejeitar"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="heading-2">Todos os Usuários</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-white">
                    <thead className="text-xs uppercase bg-white/10 text-white/80">
                      <tr><th className="px-4 py-3 rounded-tl-xl">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3 rounded-tr-xl">Ações</th></tr>
                    </thead>
                    <tbody>
                      {allUsers.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 font-medium">{user.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
                          <td className="px-4 py-3">
                            {user.role !== 'ADMIN' && (
                              <button onClick={() => deleteUser(user.id)} className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                  <h2 className="heading-2">Fase de Grupos</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Data/Hora Limite</label>
                      <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="input-field" />
                    </div>
                    <button onClick={saveDeadline} className="btn-primary w-full flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Salvar Limite</button>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h2 className="heading-2">Mata-Mata (Por Fase)</h2>
                  <div className="space-y-6">
                    {[
                      { key: 'r32', label: '16 Avos de Final' },
                      { key: 'r16', label: 'Oitavas de Final' },
                      { key: 'qf', label: 'Quartas de Final' },
                      { key: 'sf', label: 'Semifinal' },
                      { key: 'third', label: 'Disputa 3º Lugar' },
                      { key: 'final', label: 'Final' }
                    ].map(phase => (
                      <div key={phase.key} className="p-4 rounded bg-white/5 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{phase.label}</span>
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input 
                              type="checkbox" 
                              className="rounded border-white/20 bg-transparent text-primary focus:ring-primary"
                              checked={knockoutSettings[`${phase.key}_visible`]}
                              onChange={e => setKnockoutSettings((prev: any) => ({...prev, [`${phase.key}_visible`]: e.target.checked}))}
                            />
                            <span className="text-white/80">Liberar Palpites</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Data/Hora Limite</label>
                          <input 
                            type="datetime-local" 
                            className="input-field py-1" 
                            value={knockoutSettings[`${phase.key}_deadline`]}
                            onChange={e => setKnockoutSettings((prev: any) => ({...prev, [`${phase.key}_deadline`]: e.target.value}))}
                          />
                        </div>
                      </div>
                    ))}
                    <button onClick={saveKnockoutSettings} className="btn-primary w-full flex items-center justify-center gap-2 mt-4"><Save className="w-4 h-4"/> Salvar Fases do Mata-Mata</button>
                  </div>
                </div>

                <div className="glass-card p-6 border-red-500/30 lg:col-span-2">
                  <h2 className="heading-2 text-destructive">Zona de Perigo</h2>
                  <p className="text-muted-foreground mb-4 text-sm">Ações críticas que afetam todo o sistema do bolão.</p>
                  <button onClick={factoryReset} className="px-4 py-2 bg-destructive/20 text-destructive border border-destructive/50 rounded-lg hover:bg-destructive/30 font-bold transition-colors">
                    Resetar Bolão (Apagar Dados)
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-hide">
                  {PHASES.map(phase => (
                    <button 
                      key={phase.key}
                      onClick={() => setActiveResultTab(phase.key)}
                      className={`px-4 py-3 font-semibold whitespace-nowrap transition-colors border-b-2 ${activeResultTab === phase.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>

                {activeResultTab === 'GROUPS' ? (
                  <div className="space-y-8 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h2 className="heading-2 !mb-0">Fechamento da Fase de Grupos</h2>
                      <div className="flex items-center gap-2">
                        <button onClick={saveGroupResults} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4"/> Salvar Posições</button>
                        <button onClick={calculateGroupScores} className="btn-secondary flex items-center gap-2"><Play className="w-4 h-4"/> Calcular Pontos Grupos</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groups.map(group => (
                        <div key={group.id} className="bg-white/5 rounded-xl p-4">
                          <h3 className="font-bold text-white mb-4 text-center">Grupo {group.letter}</h3>
                          <ul className="space-y-2">
                            {group.Team.map((team: any, index: number) => (
                              <li 
                                key={team.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, group.id, index)}
                                onDragEnter={(e) => handleDragEnter(e, group.id, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center gap-3 bg-white/5 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/10"
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 2 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                                  {index + 1}º
                                </div>
                                <span className="text-white text-sm flex-1 truncate pointer-events-none">{team.name}</span>
                                {index === 2 && (
                                  <label className="flex items-center gap-1 text-xs text-white/80 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      checked={!!qualifiedThirds[team.id]}
                                      onChange={(e) => setQualifiedThirds(prev => ({...prev, [team.id]: e.target.checked}))}
                                      className="rounded bg-background border-white/20 text-primary focus:ring-primary w-3 h-3"
                                    />
                                    <span>Avança?</span>
                                  </label>
                                )}
                                <div className="flex flex-col gap-1 ml-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); moveTeam(group.id, index, 'up'); }} 
                                    disabled={index === 0}
                                    className="p-0.5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 rounded"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); moveTeam(group.id, index, 'down'); }} 
                                    disabled={index === group.Team.length - 1}
                                    className="p-0.5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 rounded"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <h2 className="heading-2 !mb-0">Resultados Oficiais</h2>
                      <div className="flex items-center gap-2">
                        {matches.some(m => m.stage === activeResultTab && m.TeamA && m.TeamB) && (
                          <button onClick={saveMassKnockoutResults} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4"/> Salvar FASE</button>
                        )}
                        <button onClick={calculateKnockoutScores} className="btn-secondary flex items-center gap-2"><Play className="w-4 h-4"/> Fechar Fase e Avançar</button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {matches.filter(m => m.stage === activeResultTab).map(m => {
                        const isReady = m.TeamA && m.TeamB;
                        const f = matchForms[m.id] || { ta: undefined, tb: undefined, winnerId: null };
                        const isTie = f.ta !== undefined && f.tb !== undefined && f.ta === f.tb;

                        return (
                          <div key={m.id} className="bg-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col">
                            <span className="absolute top-0 right-0 bg-white/10 px-3 py-1 text-xs font-bold text-white/50 rounded-bl-lg">Jogo {m.fifa_match_number}</span>
                            
                            <div className="mt-4 space-y-4 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isReady && isTie && (
                                    <input 
                                      type="radio" name={`official-winner-${m.id}`}
                                      checked={f.winnerId === m.TeamA.id}
                                      onChange={() => setMatchForms(prev => ({...prev, [m.id]: {...prev[m.id], winnerId: m.TeamA.id}}))}
                                      className="w-4 h-4 text-primary bg-background border-white/20 focus:ring-primary cursor-pointer" title="Avança nos pênaltis"
                                    />
                                  )}
                                  <span className={`text-sm flex-1 ${isReady && isTie && f.winnerId === m.TeamA.id ? 'text-primary font-bold' : 'text-white'}`}>{m.TeamA?.name || 'A definir'}</span>
                                </div>
                                {isReady && (
                                  <input type="number" min="0" className="w-12 text-center bg-background border border-white/10 rounded text-white py-1"
                                    value={f.ta ?? ''}
                                    onChange={e => setMatchForms(prev => ({...prev, [m.id]: {...(prev[m.id]||{tb:0, winnerId:null}), ta: e.target.value === '' ? undefined : parseInt(e.target.value)}}))}
                                  />
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isReady && isTie && (
                                    <input 
                                      type="radio" name={`official-winner-${m.id}`}
                                      checked={f.winnerId === m.TeamB.id}
                                      onChange={() => setMatchForms(prev => ({...prev, [m.id]: {...prev[m.id], winnerId: m.TeamB.id}}))}
                                      className="w-4 h-4 text-primary bg-background border-white/20 focus:ring-primary cursor-pointer" title="Avança nos pênaltis"
                                    />
                                  )}
                                  <span className={`text-sm flex-1 ${isReady && isTie && f.winnerId === m.TeamB.id ? 'text-primary font-bold' : 'text-white'}`}>{m.TeamB?.name || 'A definir'}</span>
                                </div>
                                {isReady && (
                                  <input type="number" min="0" className="w-12 text-center bg-background border border-white/10 rounded text-white py-1"
                                    value={f.tb ?? ''}
                                    onChange={e => setMatchForms(prev => ({...prev, [m.id]: {...(prev[m.id]||{ta:0, winnerId:null}), tb: e.target.value === '' ? undefined : parseInt(e.target.value)}}))}
                                  />
                                )}
                              </div>
                            </div>

                            {isReady && isTie && (
                              <div className="mt-4 pt-3 border-t border-white/10 text-center text-xs text-primary animate-fade-in-up">
                                Selecione quem avançou nos pênaltis
                              </div>
                            )}

                          </div>
                        );
                      })}

                      {matches.filter(m => m.stage === activeResultTab).length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          Nenhum jogo gerado para esta fase ainda.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
