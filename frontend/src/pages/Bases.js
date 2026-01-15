import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2, CheckCircle, XCircle, Plus, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Bases = () => {
  const [bases, setBases] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState(null);
  const [formData, setFormData] = useState({
    id_muestra_base: '',
    patron: '',
    imagen: '',
    aprobado: false,
  });
  const [fichas, setFichas] = useState([]);
  const [fichasDialogOpen, setFichasDialogOpen] = useState(false);
  const [fichasViewing, setFichasViewing] = useState([]);

  const handleViewFichas = (fichasData) => {
    setFichasViewing(fichasData);
    setFichasDialogOpen(true);
  };

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

  useEffect(() => {
    fetchBases();
    fetchMuestras();
  }, []);

  const fetchBases = async () => {
    try {
      const response = await axios.get(`${API}/bases`);
      setBases(response.data);
    } catch (error) {
      toast.error('Error al cargar bases');
    }
  };

  const fetchMuestras = async () => {
    try {
      const response = await axios.get(`${API}/muestras-base`);
      setMuestras(response.data);
    } catch (error) {
      console.error('Error al cargar muestras base');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_muestra_base) {
      toast.error('Por favor selecciona una muestra base');
      return;
    }
    
    try {
      const submitData = {
        id_muestra_base: parseInt(formData.id_muestra_base),
        patron: formData.patron || null,
        aprobado: formData.aprobado,
      };

      let baseId;
      if (editingBase) {
        await axios.put(`${API}/bases/${editingBase.id_base}`, submitData);
        baseId = editingBase.id_base;
        toast.success('Base actualizada');
      } else {
        const response = await axios.post(`${API}/bases`, submitData);
        baseId = response.data.id_base;
        toast.success('Base creada');
      }

      // Guardar fichas
      for (const ficha of fichas) {
        if (ficha.id_ficha) {
          // Actualizar ficha existente
          await axios.put(`${API}/fichas/${ficha.id_ficha}`, {
            nombre_ficha: ficha.nombre_ficha,
            archivo: ficha.archivo,
          });
        } else if (ficha.nombre_ficha || ficha.archivo) {
          // Crear nueva ficha
          await axios.post(`${API}/fichas`, {
            id_base: baseId,
            nombre_ficha: ficha.nombre_ficha,
            archivo: ficha.archivo,
          });
        }
      }

      fetchBases();
      handleCloseDialog();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar base';
      toast.error(errorMsg);
      console.error('Error completo:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/bases/${id}`);
      toast.success('Base eliminada');
      fetchBases();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar base';
      toast.error(errorMsg);
    }
  };

  const handleOpenDialog = (base = null) => {
    if (base) {
      setEditingBase(base);
      setFormData({
        id_muestra_base: base.id_muestra_base.toString(),
        patron: base.patron || '',
        aprobado: base.aprobado,
      });
      setFichas(base.fichas || []);
    } else {
      setEditingBase(null);
      setFormData({
        id_muestra_base: '',
        patron: '',
        aprobado: false,
      });
      setFichas([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBase(null);
    setFichas([]);
  };

  const handleAddFicha = () => {
    setFichas([...fichas, { nombre_ficha: '', archivo: '' }]);
  };

  const handleRemoveFicha = async (index, fichaId) => {
    if (fichaId) {
      // Si tiene ID, eliminarla del backend
      try {
        await axios.delete(`${API}/fichas/${fichaId}`);
        toast.success('Ficha eliminada');
      } catch (error) {
        toast.error('Error al eliminar ficha');
      }
    }
    const newFichas = fichas.filter((_, i) => i !== index);
    setFichas(newFichas);
  };

  const handleFichaChange = (index, field, value) => {
    const newFichas = [...fichas];
    newFichas[index][field] = value;
    setFichas(newFichas);
  };

  const columns = [
    {
      accessorKey: 'id_base',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_base}</span>,
    },
    {
      accessorKey: 'id_muestra_base',
      header: 'ID Muestra',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_muestra_base}</span>,
    },
    {
      accessorKey: 'patron',
      header: 'Patrón',
      cell: ({ row }) => (
        row.original.patron ? (
          <button
            onClick={() => handleDownloadFile(row.original.patron)}
            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs hover:font-semibold transition-all cursor-pointer"
          >
            📄 Descargar
          </button>
        ) : '-'
      ),
    },
    {
      accessorKey: 'fichas',
      header: 'Fichas',
      cell: ({ row }) => {
        const fichasCount = row.original.fichas?.length || 0;
        return fichasCount > 0 ? (
          <button
            onClick={() => handleViewFichas(row.original.fichas)}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
          >
            {fichasCount} ficha{fichasCount > 1 ? 's' : ''}
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
            data-testid={`edit-base-${row.original.id_base}`}
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit size={16} />
          </Button>
          <Button
            data-testid={`delete-base-${row.original.id_base}`}
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id_base)}
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
      <ExcelGrid
        data={bases}
        columns={columns}
        onAdd={() => handleOpenDialog()}
        searchPlaceholder="Buscar bases..."
      />

      {/* Dialog para ver fichas */}
      <Dialog open={fichasDialogOpen} onOpenChange={setFichasDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Fichas Técnicas
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {fichasViewing.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Nombre de Ficha
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Archivo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {fichasViewing.map((ficha, index) => (
                      <tr key={ficha.id_ficha} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-mono text-slate-600">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {ficha.nombre_ficha || <span className="text-slate-400 italic">Sin nombre</span>}
                        </td>
                        <td className="py-3 px-4">
                          {ficha.archivo ? (
                            <button
                              onClick={() => handleDownloadFile(ficha.archivo)}
                              className="text-blue-600 hover:text-blue-800 underline font-mono text-xs hover:font-semibold transition-all cursor-pointer"
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
              <p className="text-center text-slate-500 py-8">No hay fichas disponibles</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setFichasDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog principal para crear/editar base */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingBase ? 'Editar Base' : 'Nueva Base'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_muestra_base">Muestra Base *</Label>
                  <Select
                    value={formData.id_muestra_base}
                    onValueChange={(value) => setFormData({ ...formData, id_muestra_base: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-muestra-base">
                      <SelectValue placeholder="Seleccionar muestra" />
                    </SelectTrigger>
                    <SelectContent>
                      {muestras.map((muestra) => (
                        <SelectItem key={muestra.id_muestra_base} value={muestra.id_muestra_base.toString()}>
                          {muestra.id_muestra_base} - {muestra.marca?.nombre_marca || 'Sin Marca'} - {muestra.tipo_producto?.nombre_tipo} - {muestra.tela?.nombre_tela} - {muestra.entalle?.nombre_entalle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="aprobado"
                      data-testid="switch-aprobado-base"
                      checked={formData.aprobado}
                      onCheckedChange={(checked) => setFormData({ ...formData, aprobado: checked })}
                    />
                    <Label htmlFor="aprobado">Aprobado</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Patrón (Archivo)</Label>
                <FileUpload
                  value={formData.patron}
                  onChange={(file) => setFormData({ ...formData, patron: file })}
                  accept=".pdf,.dxf,.ai,.cdr"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Fichas Técnicas (Múltiples archivos)</Label>
                  <Button
                    type="button"
                    onClick={handleAddFicha}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar Ficha
                  </Button>
                </div>

                {fichas.length > 0 ? (
                  <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
                    {fichas.map((ficha, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Ficha #{index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFicha(index, ficha.id_ficha)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre de Ficha</Label>
                          <Input
                            value={ficha.nombre_ficha || ''}
                            onChange={(e) => handleFichaChange(index, 'nombre_ficha', e.target.value)}
                            placeholder="Ej: Ficha de Medidas"
                            className="border-slate-200 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Archivo</Label>
                          {ficha.archivo ? (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(ficha.archivo)}
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                📄 {ficha.archivo.substring(0, 30)}...
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFichaChange(index, 'archivo', '')}
                                className="text-red-600"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <FileUpload
                              value={ficha.archivo}
                              onChange={(file) => handleFichaChange(index, 'archivo', file)}
                              accept=".pdf,.xlsx,.doc,.docx"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-300 rounded-lg">
                    No hay fichas técnicas. Haz clic en "Agregar Ficha" para añadir una.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-base-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingBase ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bases;
