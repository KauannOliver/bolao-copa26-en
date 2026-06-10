import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess('Cadastro realizado! Aguarde a aprovação do administrador.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 stagger-1">
      <h2 className="heading-2">Cadastro</h2>
      <p className="text-muted-foreground mb-6">Crie sua conta para participar do bolão.</p>
      
      {error && <div className="bg-destructive/20 text-destructive border border-destructive/50 p-3 rounded-xl mb-4 text-sm">{error}</div>}
      {success && <div className="bg-success/20 text-success border border-success/50 p-3 rounded-xl mb-4 text-sm">{success}</div>}
      
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn-accent w-full mt-2" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      )}
      
      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem uma conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
      </p>
    </div>
  );
};
