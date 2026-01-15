import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, Ruler, Package, FileText, Zap, Tag,
  TrendingUp, CheckCircle, Clock, AlertCircle,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { usuario, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    muestras: { total: 0, aprobadas: 0, pendientes: 0 },
    bases: { total: 0, aprobadas: 0, pendientes: 0 },
    tizados: { total: 0 },
    telas: { total: 0 },
    marcas: { total: 0 },
    entalles: { total: 0 },
    tipos: { total: 0 },
    historial: { hoy: 0, semana: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [muestras, bases, tizados, telas, marcas, entalles, tipos] = await Promise.all([
        axios.get(`${API}/muestras-base`),
        axios.get(`${API}/bases`),
        axios.get(`${API}/tizados`),
        axios.get(`${API}/telas`),
        axios.get(`${API}/marcas`),
        axios.get(`${API}/entalles`),
        axios.get(`${API}/tipos-producto`)
      ]);

      const muestrasData = muestras.data;
      const basesData = bases.data;

      // Calcular estadísticas
      setStats({
        muestras: {
          total: muestrasData.length,
          aprobadas: muestrasData.filter(m => m.aprobado).length,
          pendientes: muestrasData.filter(m => !m.aprobado).length
        },
        bases: {
          total: basesData.length,
          aprobadas: basesData.filter(b => b.aprobado).length,
          pendientes: basesData.filter(b => !b.aprobado).length
        },
        tizados: { total: tizados.data.length },
        telas: { total: telas.data.length },
        marcas: { total: marcas.data.length },
        entalles: { total: entalles.data.length },
        tipos: { total: tipos.data.length }
      });

      // Obtener actividad reciente si es admin
      if (isAdmin()) {
        try {
          const historial = await axios.get(`${API}/historial?page=1&page_size=5`);
          setRecentActivity(historial.data);
        } catch (e) {
          console.log('No se pudo cargar historial');
        }
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { title: 'Marcas', count: stats.marcas.total, icon: Tag, path: '/marcas', color: 'bg-pink-500' },
    { title: 'Tipos Producto', count: stats.tipos.total, icon: Package, path: '/tipos-producto', color: 'bg-green-500' },
    { title: 'Entalles', count: stats.entalles.total, icon: Ruler, path: '/entalles', color: 'bg-purple-500' },
    { title: 'Telas', count: stats.telas.total, icon: Layers, path: '/telas', color: 'bg-blue-500' },
    { title: 'Muestras Base', count: stats.muestras.total, icon: FileText, path: '/muestras-base', color: 'bg-orange-500' },
    { title: 'Bases', count: stats.bases.total, icon: Zap, path: '/bases', color: 'bg-red-500' },
    { title: 'Tizados', count: stats.tizados.total, icon: FileText, path: '/tizados', color: 'bg-indigo-500' },
  ];

  const getAccionColor = (accion) => {
    const colors = {
      crear: 'text-green-600 bg-green-50',
      editar: 'text-blue-600 bg-blue-50',
      eliminar: 'text-red-600 bg-red-50',
      login: 'text-purple-600 bg-purple-50',
    };
    return colors[accion] || 'text-slate-600 bg-slate-50';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">¡Hola, {usuario?.nombre?.split(' ')[0] || 'Usuario'}!</h1>
        <p className="text-blue-100 mt-1">Resumen de tu sistema de desarrollo de muestras</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Muestras */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Muestras Base</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.muestras.total}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FileText className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} />
              {stats.muestras.aprobadas} aprobadas
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock size={14} />
              {stats.muestras.pendientes} pendientes
            </span>
          </div>
        </div>

        {/* Bases */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Bases</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.bases.total}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Zap className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} />
              {stats.bases.aprobadas} aprobadas
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock size={14} />
              {stats.bases.pendientes} pendientes
            </span>
          </div>
        </div>

        {/* Tizados */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Tizados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.tizados.total}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-indigo-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/tizados" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Telas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Telas Registradas</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.telas.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Layers className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/telas" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Gestionar <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos rápidos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Módulos del Sistema</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.path}
                  to={module.path}
                  className="flex flex-col items-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                >
                  <div className={`${module.color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 text-center">{module.title}</span>
                  <span className="text-lg font-bold text-slate-900">{module.count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Actividad reciente (solo admin) */}
        {isAdmin() && recentActivity.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Actividad Reciente</h3>
              <Link to="/historial" className="text-sm text-blue-600 hover:text-blue-700">
                Ver todo
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id_movimiento} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getAccionColor(item.accion)}`}>
                    {item.accion === 'crear' && '+'}
                    {item.accion === 'editar' && '✎'}
                    {item.accion === 'eliminar' && '×'}
                    {item.accion === 'login' && '→'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{item.descripcion}</p>
                    <p className="text-xs text-slate-500">{item.username} • {formatTimeAgo(item.fecha_hora)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de aprobación */}
        {!isAdmin() || recentActivity.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Estado de Aprobación</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Muestras Aprobadas</span>
                  <span className="font-medium">{stats.muestras.total > 0 ? Math.round((stats.muestras.aprobadas / stats.muestras.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ width: `${stats.muestras.total > 0 ? (stats.muestras.aprobadas / stats.muestras.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Bases Aprobadas</span>
                  <span className="font-medium">{stats.bases.total > 0 ? Math.round((stats.bases.aprobadas / stats.bases.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all" 
                    style={{ width: `${stats.bases.total > 0 ? (stats.bases.aprobadas / stats.bases.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Alerta de pendientes */}
            {(stats.muestras.pendientes > 0 || stats.bases.pendientes > 0) && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">
                    {stats.muestras.pendientes + stats.bases.pendientes} items pendientes de aprobar
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
