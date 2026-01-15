import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Telas from './pages/Telas';
import Entalles from './pages/Entalles';
import TiposProducto from './pages/TiposProducto';
import Marcas from './pages/Marcas';
import MuestrasBase from './pages/MuestrasBase';
import Bases from './pages/Bases';
import Tizados from './pages/Tizados';
import Usuarios from './pages/Usuarios';
import Historial from './pages/Historial';
import '@/App.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Componente principal con rutas
const AppRoutes = () => {
  const { isAuthenticated, login } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={login} />
        } 
      />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/telas" element={<Telas />} />
                <Route path="/entalles" element={<Entalles />} />
                <Route path="/tipos-producto" element={<TiposProducto />} />
                <Route path="/marcas" element={<Marcas />} />
                <Route path="/muestras-base" element={<MuestrasBase />} />
                <Route path="/bases" element={<Bases />} />
                <Route path="/tizados" element={<Tizados />} />
                <Route 
                  path="/usuarios" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Usuarios />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/historial" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Historial />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
