import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MuestrasBase = () => {
  const [muestras, setMuestras] = useState([]);
  const [telas, setTelas] = useState([]);
  const [entalles, setEntalles] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMuestra, setEditingMuestra] = useState(null);
  const [formData, setFormData] = useState({
    id_tipo: '',
    id_entalle: '',
    id_tela: '',
    consumo_estimado: '',
    costo_estimado: '',
    archivo_costo: '',
    aprobado: false,
  });

  useEffect(() => {
    fetchMuestras();
    fetchTelas();
    fetchEntalles();
    fetchTipos();
  }, []);

  const fetchMuestras = async () => {
    try {
      const response = await axios.get(`${API}/muestras-base`);
      setMuestras(response.data);
    } catch (error) {
      toast.error('Error al cargar muestras base');
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación manual
    if (!formData.id_tipo || !formData.id_entalle || !formData.id_tela) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      const submitData = {
        id_tipo: parseInt(formData.id_tipo),
        id_entalle: parseInt(formData.id_entalle),
        id_tela: parseInt(formData.id_tela),
        consumo_estimado: formData.consumo_estimado ? parseFloat(formData.consumo_estimado) : null,
        costo_estimado: formData.costo_estimado ? parseFloat(formData.costo_estimado) : null,
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
    try {
      await axios.delete(`${API}/muestras-base/${id}`);
      toast.success('Muestra base eliminada');
      fetchMuestras();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar muestra base';
      toast.error(errorMsg);
      console.error('Error completo:', error);
    }
  };

  const handleOpenDialog = (muestra = null) => {
    if (muestra) {
      setEditingMuestra(muestra);
      setFormData({
        id_tipo: muestra.id_tipo.toString(),
        id_entalle: muestra.id_entalle.toString(),
        id_tela: muestra.id_tela.toString(),
        consumo_estimado: muestra.consumo_estimado || '',
        costo_estimado: muestra.costo_estimado || '',
        archivo_costo: muestra.archivo_costo || '',
        aprobado: muestra.aprobado,
      });
    } else {
      setEditingMuestra(null);
      setFormData({
        id_tipo: '',
        id_entalle: '',
        id_tela: '',
        consumo_estimado: '',
        costo_estimado: '',
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
      accessorKey: 'consumo_estimado',
      header: 'Consumo Est.',
      cell: ({ row }) => <span className="font-mono">{row.original.consumo_estimado}</span>,
    },
    {
      accessorKey: 'costo_estimado',
      header: 'Costo Est.',
      cell: ({ row }) => <span className="font-mono">{row.original.costo_estimado}</span>,
    },
    {
      accessorKey: 'archivo_costo',
      header: 'Archivo',
      cell: ({ row }) => {
        const archivo = row.original.archivo_costo;
        return archivo ? (
          <a
            href={`${API}/files/${archivo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs"
            download
          >
            📄 Ver
          </a>
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
      <ExcelGrid
        data={muestras}
        columns={columns}
        onAdd={() => handleOpenDialog()}
        searchPlaceholder="Buscar muestras base..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor="costo_estimado">Costo Estimado</Label>
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
    </div>
  );
};

export default MuestrasBase;
