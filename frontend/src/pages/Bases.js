import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

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
    fichas: '',
    aprobado: false,
  });

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
        fichas: formData.fichas || null,
        aprobado: formData.aprobado,
      };

      if (editingBase) {
        await axios.put(`${API}/bases/${editingBase.id_base}`, submitData);
        toast.success('Base actualizada');
      } else {
        await axios.post(`${API}/bases`, submitData);
        toast.success('Base creada');
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
        fichas: base.fichas || '',
        aprobado: base.aprobado,
      });
    } else {
      setEditingBase(null);
      setFormData({
        id_muestra_base: '',
        patron: '',
        fichas: '',
        aprobado: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBase(null);
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
          <a
            href={`${API}/files/${row.original.patron}`}
            target="_blank"
            rel="noopener noreferrer"
            download={row.original.patron}
            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs hover:font-semibold transition-all"
          >
            📄 Descargar
          </a>
        ) : '-'
      ),
    },
    {
      accessorKey: 'fichas',
      header: 'Fichas',
      cell: ({ row }) => (
        row.original.fichas ? (
          <a
            href={`${API}/files/${row.original.fichas}`}
            target="_blank"
            rel="noopener noreferrer"
            download={row.original.fichas}
            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs hover:font-semibold transition-all"
          >
            📄 Descargar
          </a>
        ) : '-'
      ),
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                          ID {muestra.id_muestra_base} - {muestra.tipo_producto?.nombre_tipo}
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

              <div className="space-y-2">
                <Label>Fichas Técnicas (Múltiples archivos)</Label>
                <FileUpload
                  value={formData.fichas}
                  onChange={(file) => setFormData({ ...formData, fichas: file })}
                  accept=".pdf,.xlsx,.doc,.docx"
                />
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