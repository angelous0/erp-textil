import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tizados = () => {
  const [tizados, setTizados] = useState([]);
  const [bases, setBases] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTizado, setEditingTizado] = useState(null);
  const [formData, setFormData] = useState({
    id_base: '',
    archivo_tizado: '',
    curva: '',
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
    fetchTizados();
    fetchBases();
  }, []);

  const fetchTizados = async () => {
    try {
      const response = await axios.get(`${API}/tizados`);
      setTizados(response.data);
    } catch (error) {
      toast.error('Error al cargar tizados');
    }
  };

  const fetchBases = async () => {
    try {
      const response = await axios.get(`${API}/bases`);
      setBases(response.data);
    } catch (error) {
      console.error('Error al cargar bases');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_base) {
      toast.error('Por favor selecciona una base');
      return;
    }
    
    try {
      const submitData = {
        id_base: parseInt(formData.id_base),
        archivo_tizado: formData.archivo_tizado || null,
        curva: formData.curva || null,
      };

      if (editingTizado) {
        await axios.put(`${API}/tizados/${editingTizado.id_tizado}`, submitData);
        toast.success('Tizado actualizado');
      } else {
        await axios.post(`${API}/tizados`, submitData);
        toast.success('Tizado creado');
      }
      fetchTizados();
      handleCloseDialog();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar tizado';
      toast.error(errorMsg);
      console.error('Error completo:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/tizados/${id}`);
      toast.success('Tizado eliminado');
      fetchTizados();
    } catch (error) {
      toast.error('Error al eliminar tizado');
    }
  };

  const handleOpenDialog = (tizado = null) => {
    if (tizado) {
      setEditingTizado(tizado);
      setFormData({
        id_base: tizado.id_base.toString(),
        archivo_tizado: tizado.archivo_tizado || '',
        curva: tizado.curva || '',
      });
    } else {
      setEditingTizado(null);
      setFormData({
        id_base: '',
        archivo_tizado: '',
        curva: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTizado(null);
  };

  const columns = [
    {
      accessorKey: 'id_tizado',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_tizado}</span>,
    },
    {
      accessorKey: 'id_base',
      header: 'ID Base',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_base}</span>,
    },
    {
      accessorKey: 'archivo_tizado',
      header: 'Archivo Tizado',
      cell: ({ row }) => (
        row.original.archivo_tizado ? (
          <a
            href={`${API}/files/${row.original.archivo_tizado}`}
            target="_blank"
            rel="noopener noreferrer"
            download={row.original.archivo_tizado}
            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs hover:font-semibold transition-all"
          >
            📄 Descargar
          </a>
        ) : '-'
      ),
    },
    {
      accessorKey: 'curva',
      header: 'Curva',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.curva ? row.original.curva.substring(0, 50) + '...' : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            data-testid={`edit-tizado-${row.original.id_tizado}`}
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit size={16} />
          </Button>
          <Button
            data-testid={`delete-tizado-${row.original.id_tizado}`}
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id_tizado)}
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
        data={tizados}
        columns={columns}
        onAdd={() => handleOpenDialog()}
        searchPlaceholder="Buscar tizados..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingTizado ? 'Editar Tizado' : 'Nuevo Tizado'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="id_base">Base *</Label>
                <Select
                  value={formData.id_base}
                  onValueChange={(value) => setFormData({ ...formData, id_base: value })}
                  required
                >
                  <SelectTrigger data-testid="select-base">
                    <SelectValue placeholder="Seleccionar base" />
                  </SelectTrigger>
                  <SelectContent>
                    {bases.map((base) => (
                      <SelectItem key={base.id_base} value={base.id_base.toString()}>
                        ID {base.id_base} - Muestra {base.id_muestra_base}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Archivo de Tizado</Label>
                <FileUpload
                  value={formData.archivo_tizado}
                  onChange={(file) => setFormData({ ...formData, archivo_tizado: file })}
                  accept=".pdf,.dxf,.ai,.cdr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="curva">Curva (Configuración)</Label>
                <Textarea
                  id="curva"
                  data-testid="textarea-curva"
                  value={formData.curva}
                  onChange={(e) => setFormData({ ...formData, curva: e.target.value })}
                  placeholder="Ej: S-M-L-XL, 2-4-6-8, etc."
                  className="border-slate-200 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-tizado-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingTizado ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tizados;