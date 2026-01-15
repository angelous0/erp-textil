import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar recuperar sesión
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('usuario');
    const storedPermisos = localStorage.getItem('permisos');

    if (token && storedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUsuario(JSON.parse(storedUser));
      if (storedPermisos) {
        setPermisos(JSON.parse(storedPermisos));
      }
      
      // Verificar token válido
      axios.get(`${API}/auth/me`)
        .then(res => {
          setUsuario(res.data);
          localStorage.setItem('usuario', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (user, userPermisos) => {
    setUsuario(user);
    setPermisos(userPermisos);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('permisos');
    delete axios.defaults.headers.common['Authorization'];
    setUsuario(null);
    setPermisos({});
  };

  const hasPermission = (permiso) => {
    if (!usuario) return false;
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin') return true;
    return permisos[permiso] === true;
  };

  const canDownload = (tipo) => {
    if (!usuario) return false;
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin') return true;
    
    const permisoMap = {
      'patron': 'descargar_patrones',
      'tizado': 'descargar_tizados',
      'ficha': 'descargar_fichas',
      'imagen': 'descargar_imagenes',
      'costo': 'descargar_costos'
    };
    
    return permisos[permisoMap[tipo]] === true;
  };

  const isAdmin = () => {
    return usuario && (usuario.rol === 'super_admin' || usuario.rol === 'admin');
  };

  const value = {
    usuario,
    permisos,
    loading,
    login,
    logout,
    hasPermission,
    canDownload,
    isAdmin,
    isAuthenticated: !!usuario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;
