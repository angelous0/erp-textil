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

  // Verifica si el usuario tiene un permiso específico
  const hasPermission = (permiso) => {
    if (!usuario) return false;
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin') return true;
    return permisos[permiso] === true;
  };

  // Verifica permisos CRUD por módulo
  // modulo: marcas, tipos, entalles, telas, muestras, bases, tizados, fichas
  // accion: ver, crear, editar, eliminar
  const canAccess = (modulo, accion) => {
    if (!usuario) return false;
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin') return true;
    
    const permisoKey = `${modulo}_${accion}`;
    return permisos[permisoKey] === true;
  };

  // Alias para acciones comunes
  const canView = (modulo) => canAccess(modulo, 'ver');
  const canCreate = (modulo) => canAccess(modulo, 'crear');
  const canEdit = (modulo) => canAccess(modulo, 'editar');
  const canDelete = (modulo) => canAccess(modulo, 'eliminar');

  // Permisos de descarga por tipo de archivo
  const canDownload = (tipo) => {
    if (!usuario) return false;
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin') return true;
    
    const permisoMap = {
      'patron': 'descargar_patrones',
      'patrones': 'descargar_patrones',
      'tizado': 'descargar_tizados',
      'tizados': 'descargar_tizados',
      'ficha': 'descargar_fichas',
      'fichas': 'descargar_fichas',
      'imagen': 'descargar_imagenes',
      'imagenes': 'descargar_imagenes',
      'costo': 'descargar_costos',
      'costos': 'descargar_costos'
    };
    
    return permisos[permisoMap[tipo]] === true;
  };

  // Permisos de subida por tipo de archivo
  const canUpload = (tipo) => {
    if (!usuario) return false;
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin') return true;
    
    const permisoMap = {
      'patron': 'subir_patrones',
      'patrones': 'subir_patrones',
      'tizado': 'subir_tizados',
      'tizados': 'subir_tizados',
      'ficha': 'subir_fichas',
      'fichas': 'subir_fichas',
      'imagen': 'subir_imagenes',
      'imagenes': 'subir_imagenes',
      'costo': 'subir_costos',
      'costos': 'subir_costos'
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
    canAccess,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canDownload,
    canUpload,
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
