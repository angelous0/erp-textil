import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { 
  History, Search, Filter, ChevronLeft, ChevronRight, 
  Eye, User, Calendar, Database, Activity,
  Plus, Edit, Trash2, Upload, Download, LogIn, LogOut
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACCION_CONFIG = {
  crear: { label: 'Crear', color: 'bg-green-100 text-green-800 border-green-200', icon: Plus },
  editar: { label: 'Editar', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Edit },
  eliminar: { label: 'Eliminar', color: 'bg-red-100 text-red-800 border-red-200', icon: Trash2 },
  subir_archivo: { label: 'Subir Archivo', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Upload },
  descargar_archivo: { label: 'Descargar', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: Download },
  eliminar_archivo: { label: 'Eliminar Archivo', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Trash2 },
  login: { label: 'Login', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: LogIn },
  logout: { label: 'Logout', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: LogOut },
};

const TABLA_LABELS = {
  telas: 'Telas',
  entalles: 'Entalles',
  tipos_producto: 'Tipos de Producto',
  marcas: 'Marcas',
  muestras_base: 'Muestras Base',
  bases: 'Bases',
  tizados: 'Tizados',
  fichas: 'Fichas',
  archivos: 'Archivos',
  sesiones: 'Sesiones',
  usuarios: 'Usuarios',
};

const Historial = () => {
  const { isAdmin } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tablasDisponibles, setTablasDisponibles] = useState([]);
  
  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('all');
  const [filtroAccion, setFiltroAccion] = useState('all');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Modal de detalles
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      fetchHistorial();
      fetchStats();
      fetchTablas();
    }
  }, [page, filtroUsuario, filtroTabla, filtroAccion, filtroFechaDesde, filtroFechaHasta]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (filtroUsuario) params.append('usuario', filtroUsuario);
      if (filtroTabla && filtroTabla !== 'all') params.append('tabla', filtroTabla);
      if (filtroAccion && filtroAccion !== 'all') params.append('accion', filtroAccion);
      if (filtroFechaDesde) params.append('fecha_desde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fecha_hasta', filtroFechaHasta);
      
      const response = await axios.get(`${API}/historial?${params}`);
      setHistorial(response.data);
    } catch (error) {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/historial/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const fetchTablas = async () => {
    try {
      const response = await axios.get(`${API}/historial/tablas`);
      setTablasDisponibles(response.data);
    } catch (error) {
      console.error('Error cargando tablas:', error);
    }
  };

  const handleClearFilters = () => {
    setFiltroUsuario('');
    setFiltroTabla('all');
    setFiltroAccion('all');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const AccionBadge = ({ accion }) => {
    const config = ACCION_CONFIG[accion] || { label: accion, color: 'bg-slate-100 text-slate-800', icon: Activity };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const renderDatosJSON = (datos, titulo) => {
    if (!datos) return null;
    return (
      <div className="mt-4">
        <h4 className="font-medium text-slate-700 mb-2">{titulo}</h4>
        <pre className="bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-48">
          {JSON.stringify(datos, null, 2)}
        </pre>
      </div>
    );
  };

  if (!isAdmin()) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">No tienes permisos para ver esta página</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <History className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Historial de Movimientos</h1>
            <p className="text-slate-500">Registro de todas las acciones en el sistema</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Movimientos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Últimos 7 días</p>
                <p className="text-2xl font-bold text-slate-900">{stats.ultimos_7_dias}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tablas Afectadas</p>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.por_tabla || {}).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Usuarios Activos</p>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.por_usuario || {}).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-500" />
          <h3 className="font-medium text-slate-700">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Usuario</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuario..."
                value={filtroUsuario}
                onChange={(e) => { setFiltroUsuario(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tabla</label>
            <Select value={filtroTabla} onValueChange={(v) => { setFiltroTabla(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {tablasDisponibles.map(t => (
                  <SelectItem key={t} value={t}>{TABLA_LABELS[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Acción</label>
            <Select value={filtroAccion} onValueChange={(v) => { setFiltroAccion(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(ACCION_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Desde</label>
            <Input
              type="datetime-local"
              value={filtroFechaDesde}
              onChange={(e) => { setFiltroFechaDesde(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Hasta</label>
            <Input
              type="datetime-local"
              value={filtroFechaHasta}
              onChange={(e) => { setFiltroFechaHasta(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : historial.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No se encontraron movimientos con los filtros actuales
          </div>
        ) : (
          <table className="w-full" data-testid="historial-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">Fecha/Hora</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">Usuario</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">Acción</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">Tabla</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">Descripción</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">IP</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historial.map((mov) => (
                <tr key={mov.id_movimiento} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(mov.fecha_hora)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-medium text-slate-900">{mov.username}</span>
                  </td>
                  <td className="py-3 px-4">
                    <AccionBadge accion={mov.accion} />
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {TABLA_LABELS[mov.tabla] || mov.tabla}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                    {mov.descripcion}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                    {mov.ip_address || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedMovimiento(mov); setIsDetailOpen(true); }}
                      className="text-indigo-600 hover:text-indigo-700"
                      data-testid={`view-detail-${mov.id_movimiento}`}
                    >
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            Página {page} • {historial.length} resultados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={historial.length < pageSize}
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={20} />
              Detalle del Movimiento
            </DialogTitle>
          </DialogHeader>
          
          {selectedMovimiento && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">ID</label>
                  <p className="font-mono text-sm">{selectedMovimiento.id_movimiento}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Fecha/Hora</label>
                  <p className="text-sm">{formatDate(selectedMovimiento.fecha_hora)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Usuario</label>
                  <p className="font-medium">{selectedMovimiento.username}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Acción</label>
                  <div className="mt-1">
                    <AccionBadge accion={selectedMovimiento.accion} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Tabla</label>
                  <p className="text-sm">{TABLA_LABELS[selectedMovimiento.tabla] || selectedMovimiento.tabla}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">ID Registro</label>
                  <p className="font-mono text-sm">{selectedMovimiento.id_registro || '-'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500">Descripción</label>
                <p className="text-sm mt-1 p-2 bg-slate-50 rounded">{selectedMovimiento.descripcion}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">IP</label>
                  <p className="font-mono text-xs">{selectedMovimiento.ip_address || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">User Agent</label>
                  <p className="text-xs text-slate-600 truncate">{selectedMovimiento.user_agent || '-'}</p>
                </div>
              </div>

              {renderDatosJSON(selectedMovimiento.datos_anteriores, 'Datos Anteriores (antes del cambio)')}
              {renderDatosJSON(selectedMovimiento.datos_nuevos, 'Datos Nuevos (después del cambio)')}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Historial;
