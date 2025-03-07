import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/lib/locale/pt_BR';

import Dashboard from './components/Dashboard';
import Login from './components/Login';

// Configura o axios para incluir o token em todas as requisições
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepta respostas de erro 401 (não autorizado)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpa o token e redireciona para o login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário está autenticado ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Função para lidar com o login bem-sucedido
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Componente de rota protegida
  const PrivateRoute = ({ element }) => {
    if (loading) {
      return <div>Carregando...</div>;
    }
    
    return user ? element : <Navigate to="/login" />;
  };

  return (
    <ConfigProvider locale={ptBR}>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/" 
            element={<PrivateRoute element={<Dashboard onLogout={handleLogout} />} />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" />} 
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App; 