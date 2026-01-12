import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Ruler, Package, FileText, Zap, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const modules = [
    {
      title: 'Telas',
      description: 'Gestionar materiales textiles',
      icon: Layers,
      path: '/telas',
      color: 'bg-blue-500',
    },
    {
      title: 'Entalles',
      description: 'Formas y siluetas',
      icon: Ruler,
      path: '/entalles',
      color: 'bg-purple-500',
    },
    {
      title: 'Tipos de Producto',
      description: 'Categorías de prendas',
      icon: Package,
      path: '/tipos-producto',
      color: 'bg-green-500',
    },
    {
      title: 'Muestras Base',
      description: 'Desarrollo de producto',
      icon: FileText,
      path: '/muestras-base',
      color: 'bg-orange-500',
    },
    {
      title: 'Bases',
      description: 'Moldes y patrones',
      icon: Zap,
      path: '/bases',
      color: 'bg-red-500',
    },
    {
      title: 'Tizados',
      description: 'Configuraciones de corte',
      icon: FileText,
      path: '/tizados',
      color: 'bg-indigo-500',
    },
  ];

  const stats = [
    { label: 'Muestras Activas', value: '0', icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Bases Aprobadas', value: '0', icon: CheckCircle, color: 'text-green-600' },
    { label: 'En Desarrollo', value: '0', icon: Clock, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              data-testid={`stat-card-${index}`}
              className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-heading font-bold text-slate-900 mt-2 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <Icon className={stat.color} size={32} strokeWidth={1.5} />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-lg font-heading font-bold text-slate-900 mb-4">Módulos del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link
                key={index}
                to={module.path}
                data-testid={`module-card-${module.title.toLowerCase().replace(' ', '-')}`}
                className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${module.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">{module.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">Bienvenido al ERP Textil</h3>
        <p className="text-slate-600">
          Sistema de desarrollo de producto para la industria textil. Gestiona telas, muestras, bases y tizados
          de forma eficiente y organizada.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;