import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2, CheckCircle, XCircle, Eye, Plus, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MuestrasBase = () => {
  const [muestras, setMuestras] = useState([]);
  const [muestrasFiltradas, setMuestrasFiltradas] = useState([]);
  const [filtroAprobacion, setFiltroAprobacion] = useState('aprobados'); // 'todos', 'aprobados', 'pendientes'
  const [telas, setTelas] = useState([]);
  const [entalles, setEntalles] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMuestra, setEditingMuestra] = useState(null);
  const [formData, setFormData] = useState({
    id_tipo: '',
    id_entalle: '',
    id_tela: '',
    id_marca: '',
    consumo_estimado: '',
    costo_estimado: '',
    precio_estimado: '',
    archivo_costo: '',
    aprobado: false,
  });

  const [baseViewDialogOpen, setBaseViewDialogOpen] = useState(false);
  const [viewingBase, setViewingBase] = useState(null);
  
  // Estados para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDownloadFile = async (filename) => {
    try {
      const response = await fetch(`${API}/files/${filename}`);
      if (!response.ok) {
        toast.error('Error al descargar el archivo');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Archivo descargado');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  const handleViewBase = (base) => {
    setViewingBase(base);
    setBaseViewDialogOpen(true);
  };

  useEffect(() => {
    fetchMuestras();
    fetchTelas();
    fetchEntalles();
    fetchTipos();
    fetchMarcas();
  }, []);

  const fetchMuestras = async () => {
    try {
      const response = await axios.get(`${API}/muestras-base`);
      setMuestras(response.data);
      aplicarFiltro(response.data, filtroAprobacion);
    } catch (error) {
      toast.error('Error al cargar muestras base');
    }
  };

  const aplicarFiltro = (data, filtro) => {
    let filtradas = data;
    if (filtro === 'aprobados') {
      filtradas = data.filter(m => m.aprobado === true);
    } else if (filtro === 'pendientes') {
      filtradas = data.filter(m => m.aprobado === false);
    }
    setMuestrasFiltradas(filtradas);
  };

  useEffect(() => {
    aplicarFiltro(muestras, filtroAprobacion);
  }, [filtroAprobacion, muestras]);

  const fetchTelas = async () => {
    try {
      const response = await axios.get(`${API}/telas`);
      setTelas(response.data);
    } catch (error) {
      console.error('Error al cargar telas');
    }
  };

  const fetchEntalles = async () => {
    try {
      const response = await axios.get(`${API}/entalles`);
      setEntalles(response.data);
    } catch (error) {
      console.error('Error al cargar entalles');
    }
  };

  const fetchTipos = async () => {
    try {
      const response = await axios.get(`${API}/tipos-producto`);
      setTipos(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de producto');
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await axios.get(`${API}/marcas`);
      setMarcas(response.data);
    } catch (error) {
      console.error('Error al cargar marcas');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_tipo || !formData.id_entalle || !formData.id_tela) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      const submitData = {
        id_tipo: parseInt(formData.id_tipo),
        id_entalle: parseInt(formData.id_entalle),
        id_tela: parseInt(formData.id_tela),
        id_marca: formData.id_marca ? parseInt(formData.id_marca) : null,
        consumo_estimado: formData.consumo_estimado ? parseFloat(formData.consumo_estimado) : null,
        costo_estimado: formData.costo_estimado ? parseFloat(formData.costo_estimado) : null,
        precio_estimado: formData.precio_estimado ? parseFloat(formData.precio_estimado) : null,
        archivo_costo: formData.archivo_costo || null,
        aprobado: formData.aprobado,
      };

      if (editingMuestra) {
        await axios.put(`${API}/muestras-base/${editingMuestra.id_muestra_base}`, submitData);
        toast.success('Muestra base actualizada');
      } else {
        await axios.post(`${API}/muestras-base`, submitData);
        toast.success('Muestra base creada');
      }
      fetchMuestras();
      handleCloseDialog();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar muestra base';
      toast.error(errorMsg);
      console.error('Error completo:', error);
    }
  };

  const handleDelete = async (id) => {
    // Encontrar la muestra y mostrar confirmación
    const muestra = muestras.find(m => m.id_muestra_base === id);
    setItemToDelete(muestra);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Eliminar archivo de costo de R2 si existe
      if (itemToDelete.archivo_costo) {
        try {
          await axios.delete(`${API}/files/${itemToDelete.archivo_costo}`);
        } catch (e) {
          console.log(`Archivo ${itemToDelete.archivo_costo} no encontrado o ya eliminado`);
        }
      }
      
      // Eliminar archivos de bases asociadas
      if (itemToDelete.bases) {
        for (const base of itemToDelete.bases) {
          if (base.patron) {
            try { await axios.delete(`${API}/files/${base.patron}`); } catch (e) { /* archivo no encontrado */ }
          }
          if (base.imagen) {
            try { await axios.delete(`${API}/files/${base.imagen}`); } catch (e) { /* archivo no encontrado */ }
          }
          // Fichas
          if (base.fichas) {
            for (const ficha of base.fichas) {
              if (ficha.archivo) {
                try { await axios.delete(`${API}/files/${ficha.archivo}`); } catch (e) { /* archivo no encontrado */ }
              }
            }
          }
          // Tizados
          if (base.tizados) {
            for (const tizado of base.tizados) {
              if (tizado.archivo_tizado) {
                try { await axios.delete(`${API}/files/${tizado.archivo_tizado}`); } catch (e) { /* archivo no encontrado */ }
              }
            }
          }
        }
      }
      
      // Eliminar la muestra base
      await axios.delete(`${API}/muestras-base/${itemToDelete.id_muestra_base}`);
      toast.success('Muestra base y archivos eliminados');
      fetchMuestras();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar muestra base';
      toast.error(errorMsg);
      console.error('Error completo:', error);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleOpenDialog = (muestra = null) => {
    if (muestra) {
      setEditingMuestra(muestra);
      setFormData({
        id_tipo: muestra.id_tipo.toString(),
        id_entalle: muestra.id_entalle.toString(),
        id_tela: muestra.id_tela.toString(),
        id_marca: muestra.id_marca ? muestra.id_marca.toString() : '',
        consumo_estimado: muestra.consumo_estimado || '',
        costo_estimado: muestra.costo_estimado || '',
        precio_estimado: muestra.precio_estimado || '',
        archivo_costo: muestra.archivo_costo || '',
        aprobado: muestra.aprobado,
      });
    } else {
      setEditingMuestra(null);
      setFormData({
        id_tipo: '',
        id_entalle: '',
        id_tela: '',
        id_marca: '',
        consumo_estimado: '',
        costo_estimado: '',
        precio_estimado: '',
        archivo_costo: '',
        aprobado: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMuestra(null);
  };

  const columns = [
    {
      accessorKey: 'id_muestra_base',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_muestra_base}</span>,
    },
    {
      accessorKey: 'tipo_producto.nombre_tipo',
      header: 'Tipo Producto',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">
          {row.original.tipo_producto?.nombre_tipo || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'entalle.nombre_entalle',
      header: 'Entalle',
      cell: ({ row }) => row.original.entalle?.nombre_entalle || '-',
    },
    {
      accessorKey: 'tela.nombre_tela',
      header: 'Tela',
      cell: ({ row }) => row.original.tela?.nombre_tela || '-',
    },
    {
      accessorKey: 'marca.nombre_marca',
      header: 'Marca',
      cell: ({ row }) => row.original.marca?.nombre_marca || '-',
    },
    {
      accessorKey: 'consumo_estimado',
      header: 'Consumo Est.',
      cell: ({ row }) => <span className="font-mono">{row.original.consumo_estimado}</span>,
    },
    {
      accessorKey: 'costo_estimado',
      header: 'Costo Est.',
      cell: ({ row }) => {
        const costo = row.original.costo_estimado;
        return costo ? <span className="font-mono">S/ {parseFloat(costo).toFixed(2)}</span> : '-';
      },
    },
    {
      accessorKey: 'precio_estimado',
      header: 'Precio Est.',
      cell: ({ row }) => {
        const precio = row.original.precio_estimado;
        return precio ? <span className="font-mono">S/ {parseFloat(precio).toFixed(2)}</span> : '-';
      },
    },
    {
      id: 'rentabilidad',
      header: 'Rentabilidad',
      cell: ({ row }) => {
        const costo = row.original.costo_estimado;
        const precio = row.original.precio_estimado;
        if (!costo || !precio || costo === 0) return '-';
        const rentabilidad = ((precio - costo) / costo) * 100;
        const color = rentabilidad >= 25 ? 'text-green-600' : rentabilidad >= 10 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-mono font-semibold ${color}`}>{rentabilidad.toFixed(1)}%</span>;
      },
    },
    {
      accessorKey: 'archivo_costo',
      header: 'Archivo',
      cell: ({ row }) => {
        const archivo = row.original.archivo_costo;
        return archivo ? (
          <button
            onClick={() => handleDownloadFile(archivo)}
            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs hover:font-semibold transition-all cursor-pointer"
          >
            📄 Descargar
          </button>
        ) : '-';
      },
    },
    {
      accessorKey: 'aprobado',
      header: 'Estado',
      cell: ({ row }) => {
        const aprobado = row.original.aprobado;
        return aprobado ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20">
            <CheckCircle size={12} className="mr-1" />
            Aprobado
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-500/10">
            <XCircle size={12} className="mr-1" />
            Pendiente
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            data-testid={`edit-muestra-${row.original.id_muestra_base}`}
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit size={16} />
          </Button>
          <Button
            data-testid={`delete-muestra-${row.original.id_muestra_base}`}
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id_muestra_base)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Filtros de Aprobación */}
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-sm font-medium text-slate-700">Filtrar por estado:</span>
        <Button
          variant={filtroAprobacion === 'aprobados' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAprobacion('aprobados')}
          className={filtroAprobacion === 'aprobados' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <CheckCircle size={14} className="mr-1" />
          Aprobados ({muestras.filter(m => m.aprobado).length})
        </Button>
        <Button
          variant={filtroAprobacion === 'pendientes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAprobacion('pendientes')}
          className={filtroAprobacion === 'pendientes' ? 'bg-slate-600 hover:bg-slate-700' : ''}
        >
          <XCircle size={14} className="mr-1" />
          Pendientes ({muestras.filter(m => !m.aprobado).length})
        </Button>
        <Button
          variant={filtroAprobacion === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAprobacion('todos')}
          className={filtroAprobacion === 'todos' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          Todos ({muestras.length})
        </Button>
      </div>

      <ExcelGrid
        data={muestrasFiltradas}
        columns={columns}
        onAdd={() => handleOpenDialog()}
        searchPlaceholder="Buscar por marca, tipo, tela, entalle..."
        globalFilterFn={(row, columnId, filterValue) => {
          // Búsqueda personalizada en múltiples campos
          const searchValue = filterValue.toLowerCase();
          const marca = row.original.marca?.nombre_marca?.toLowerCase() || '';
          const tipo = row.original.tipo_producto?.nombre_tipo?.toLowerCase() || '';
          const tela = row.original.tela?.nombre_tela?.toLowerCase() || '';
          const entalle = row.original.entalle?.nombre_entalle?.toLowerCase() || '';
          const id = row.original.id_muestra_base?.toString() || '';
          
          return marca.includes(searchValue) || 
                 tipo.includes(searchValue) || 
                 tela.includes(searchValue) || 
                 entalle.includes(searchValue) ||
                 id.includes(searchValue);
        }}
      />

      {/* Dialog para ver detalles de una Base */}
      <Dialog open={baseViewDialogOpen} onOpenChange={setBaseViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Detalles de Base #{viewingBase?.id_base}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">ID Muestra Base</Label>
                <p className="text-slate-900 font-mono">{viewingBase?.id_muestra_base}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Estado</Label>
                <p>
                  {viewingBase?.aprobado ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={12} className="mr-1" />
                      Aprobado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      <XCircle size={12} className="mr-1" />
                      Pendiente
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <Separator />

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Patrón</Label>
              {viewingBase?.patron ? (
                <button
                  onClick={() => handleDownloadFile(viewingBase.patron)}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  📄 Descargar Patrón
                </button>
              ) : (
                <p className="text-slate-400 text-sm">Sin patrón</p>
              )}
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Fichas Técnicas ({viewingBase?.fichas?.length || 0})
              </Label>
              {viewingBase?.fichas && viewingBase.fichas.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">#</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Nombre</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Archivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingBase.fichas.map((ficha, idx) => (
                        <tr key={ficha.id_ficha} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600">{idx + 1}</td>
                          <td className="py-2 px-3">{ficha.nombre_ficha || <span className="text-slate-400 italic">Sin nombre</span>}</td>
                          <td className="py-2 px-3">
                            {ficha.archivo ? (
                              <button
                                onClick={() => handleDownloadFile(ficha.archivo)}
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                              >
                                📄 Descargar
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Sin archivo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Sin fichas técnicas</p>
              )}
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Tizados ({viewingBase?.tizados?.length || 0})
              </Label>
              {viewingBase?.tizados && viewingBase.tizados.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">ID</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Curva</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Archivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingBase.tizados.map((tizado) => (
                        <tr key={tizado.id_tizado} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600">{tizado.id_tizado}</td>
                          <td className="py-2 px-3 text-xs">{tizado.curva || '-'}</td>
                          <td className="py-2 px-3">
                            {tizado.archivo_tizado ? (
                              <button
                                onClick={() => handleDownloadFile(tizado.archivo_tizado)}
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                              >
                                📄 Descargar
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Sin archivo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Sin tizados</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setBaseViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog principal para crear/editar Muestra Base */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingMuestra ? 'Editar Muestra Base' : 'Nueva Muestra Base'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_tipo">Tipo de Producto *</Label>
                  <Select
                    value={formData.id_tipo}
                    onValueChange={(value) => setFormData({ ...formData, id_tipo: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-tipo-producto">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map((tipo) => (
                        <SelectItem key={tipo.id_tipo} value={tipo.id_tipo.toString()}>
                          {tipo.nombre_tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_entalle">Entalle *</Label>
                  <Select
                    value={formData.id_entalle}
                    onValueChange={(value) => setFormData({ ...formData, id_entalle: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-entalle">
                      <SelectValue placeholder="Seleccionar entalle" />
                    </SelectTrigger>
                    <SelectContent>
                      {entalles.map((entalle) => (
                        <SelectItem key={entalle.id_entalle} value={entalle.id_entalle.toString()}>
                          {entalle.nombre_entalle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_tela">Tela *</Label>
                  <Select
                    value={formData.id_tela}
                    onValueChange={(value) => setFormData({ ...formData, id_tela: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-tela">
                      <SelectValue placeholder="Seleccionar tela" />
                    </SelectTrigger>
                    <SelectContent>
                      {telas.map((tela) => (
                        <SelectItem key={tela.id_tela} value={tela.id_tela.toString()}>
                          {tela.nombre_tela}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_marca">Marca</Label>
                  <Select
                    value={formData.id_marca}
                    onValueChange={(value) => setFormData({ ...formData, id_marca: value })}
                  >
                    <SelectTrigger data-testid="select-marca">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id_marca} value={marca.id_marca.toString()}>
                          {marca.nombre_marca}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumo_estimado">Consumo Estimado</Label>
                  <Input
                    id="consumo_estimado"
                    data-testid="input-consumo-estimado"
                    type="number"
                    step="0.01"
                    value={formData.consumo_estimado}
                    onChange={(e) => setFormData({ ...formData, consumo_estimado: e.target.value })}
                    className="border-slate-200 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo_estimado">Costo Estimado (S/)</Label>
                  <Input
                    id="costo_estimado"
                    data-testid="input-costo-estimado"
                    type="number"
                    step="0.01"
                    value={formData.costo_estimado}
                    onChange={(e) => setFormData({ ...formData, costo_estimado: e.target.value })}
                    className="border-slate-200 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio_estimado">Precio Estimado (S/)</Label>
                  <Input
                    id="precio_estimado"
                    data-testid="input-precio-estimado"
                    type="number"
                    step="0.01"
                    value={formData.precio_estimado}
                    onChange={(e) => setFormData({ ...formData, precio_estimado: e.target.value })}
                    className="border-slate-200 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  {/* Muestra rentabilidad calculada */}
                  <Label>Rentabilidad Estimada</Label>
                  <div className="text-lg font-mono font-semibold">
                    {formData.costo_estimado && formData.precio_estimado && parseFloat(formData.costo_estimado) > 0 ? (
                      <span className={
                        ((parseFloat(formData.precio_estimado) - parseFloat(formData.costo_estimado)) / parseFloat(formData.costo_estimado) * 100) >= 25 
                          ? 'text-green-600' 
                          : ((parseFloat(formData.precio_estimado) - parseFloat(formData.costo_estimado)) / parseFloat(formData.costo_estimado) * 100) >= 10 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }>
                        {(((parseFloat(formData.precio_estimado) - parseFloat(formData.costo_estimado)) / parseFloat(formData.costo_estimado)) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aprobado"
                      data-testid="switch-aprobado"
                      checked={formData.aprobado}
                      onCheckedChange={(checked) => setFormData({ ...formData, aprobado: checked })}
                    />
                    <Label htmlFor="aprobado">Aprobado</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Archivo de Costo</Label>
                <FileUpload
                  value={formData.archivo_costo}
                  onChange={(file) => setFormData({ ...formData, archivo_costo: file })}
                  accept=".pdf,.xlsx,.xls,.doc,.docx"
                />
              </div>

              {editingMuestra && editingMuestra.bases && editingMuestra.bases.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Bases Relacionadas ({editingMuestra.bases.length})
                      </Label>
                    </div>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm excel-grid">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">ID Base</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Patrón</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Fichas</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Tizados</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Estado</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {editingMuestra.bases.map((base) => (
                            <tr key={base.id_base} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-600">{base.id_base}</td>
                              <td className="py-3 px-4">
                                {base.patron ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(base.patron)}
                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                  >
                                    📄 Ver
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {base.fichas && base.fichas.length > 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {base.fichas.length} ficha{base.fichas.length > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {base.tizados && base.tizados.length > 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {base.tizados.length} tizado{base.tizados.length > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {base.aprobado ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={10} className="mr-1" />
                                    Aprobado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    <XCircle size={10} className="mr-1" />
                                    Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewBase(base)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye size={14} className="mr-1" />
                                  Ver
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-500 italic">
                      Haz clic en "Ver" para ver los detalles completos de cada base, incluyendo fichas y tizados.
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-muestra-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingMuestra ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              ¿Estás seguro de que deseas eliminar esta muestra base?
              {itemToDelete && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <p><strong>ID:</strong> {itemToDelete.id_muestra_base}</p>
                  <p><strong>Tipo:</strong> {itemToDelete.tipo_producto?.nombre_tipo || '-'}</p>
                  <p><strong>Marca:</strong> {itemToDelete.marca?.nombre_marca || '-'}</p>
                  {itemToDelete.archivo_costo && <p><strong>Archivo Costo:</strong> Se eliminará</p>}
                  {itemToDelete.bases?.length > 0 && (
                    <p className="text-orange-600"><strong>⚠️ Bases:</strong> Se eliminarán {itemToDelete.bases.length} base(s) y todos sus archivos asociados</p>
                  )}
                </div>
              )}
              <p className="mt-3 text-red-500 font-medium">
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MuestrasBase;
