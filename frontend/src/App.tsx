import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/Admin';
import { Grupos } from './pages/Grupos';
import { MataMata } from './pages/MataMata';
import { Ranking } from './pages/Ranking';
import { Regras } from './pages/Regras';
import { Dashboard } from './pages/Dashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/mata-mata" element={<MataMata />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/regras" element={<Regras />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
