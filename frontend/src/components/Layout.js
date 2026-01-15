import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Tag, Package, Ruler, Layers, FileText, Zap, Users, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout, isAdmin } = useAuth();

  const menuItems = [
    { path: '/', icon: LayoutGrid, label: 'Dashboard', exact: true },
    { path: '/marcas', icon: Tag, label: 'Marcas' },
    { path: '/tipos-producto', icon: Package, label: 'Tipos Producto' },
    { path: '/entalles', icon: Ruler, label: 'Entalles' },
    { path: '/telas', icon: Layers, label: 'Telas' },
    { path: '/muestras-base', icon: FileText, label: 'Muestras Base' },
    { path: '/bases', icon: Zap, label: 'Bases' },
    { path: '/tizados', icon: FileText, label: 'Tizados' },
  ];

  // Agregar usuarios si es admin
  if (isAdmin()) {
    menuItems.push({ path: '/usuarios', icon: Users, label: 'Usuarios' });
  }

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRolBadge = (rol) => {
    const config = {
      super_admin: 'bg-red-500',
      admin: 'bg-orange-500',
      editor: 'bg-blue-500',
      viewer: 'bg-slate-500'
    };
    return config[rol] || 'bg-slate-500';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col sidebar-texture">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Modulo Muestras
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sistema de Desarrollo</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={
                  isActive(item)
                    ? 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-600 text-white transition-colors'
                    : 'flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors'
                }
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Usuario y logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${getRolBadge(usuario?.rol)} flex items-center justify-center`}>
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario?.nombre}</p>
              <p className="text-xs text-slate-400 truncate">@{usuario?.username}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut size={18} className="mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                {menuItems.find((item) => isActive(item))?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                usuario?.rol === 'super_admin' ? 'bg-red-100 text-red-800' :
                usuario?.rol === 'admin' ? 'bg-orange-100 text-orange-800' :
                usuario?.rol === 'editor' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {usuario?.rol?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
