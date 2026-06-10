import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 stagger-1">
      <h2 className="heading-2">Entrar</h2>
      <p className="text-muted-foreground mb-6">Acesse sua conta para continuar.</p>
      
      {error && <div className="bg-destructive/20 text-destructive border border-destructive/50 p-3 rounded-xl mb-4 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
        </div>
        <button type="submit" className="btn-accent w-full mt-2" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <p className="text-center text-sm text-muted-foreground mt-6">
        Não tem uma conta? <Link to="/register" className="text-primary hover:underline">Cadastre-se</Link>
      </p>
    </div>
  );
};
