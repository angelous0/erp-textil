import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Tag, Package, Ruler, Layers, FileText, Zap } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

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

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
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

        <nav className="flex-1 p-4 space-y-1">
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

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">v1.0.0 - Módulo Muestras</p>
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