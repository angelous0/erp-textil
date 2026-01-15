import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tizados = () => {
  const { canCreate, canEdit, canDelete, canDownload } = useAuth();
  const [tizados, setTizados] = useState([]);
  const [bases, setBases] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTizado, setEditingTizado] = useState(null);
  const [formData, setFormData] = useState({
    id_base: '',
    ancho: '',
    archivo_tizado: '',
    curva: '',
  });
  
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
        ancho: formData.ancho ? parseFloat(formData.ancho) : null,
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
    // Encontrar el tizado y mostrar confirmación
    const tizado = tizados.find(t => t.id_tizado === id);
    setItemToDelete(tizado);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Eliminar archivo de R2 si existe
      if (itemToDelete.archivo_tizado) {
        try {
          await axios.delete(`${API}/files/${itemToDelete.archivo_tizado}`);
        } catch (e) {
          console.log(`Archivo ${itemToDelete.archivo_tizado} no encontrado o ya eliminado`);
        }
      }
      
      // Eliminar el tizado
      await axios.delete(`${API}/tizados/${itemToDelete.id_tizado}`);
      toast.success('Tizado y archivo eliminados');
      fetchTizados();
    } catch (error) {
      toast.error('Error al eliminar tizado');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleOpenDialog = (tizado = null) => {
    if (tizado) {
      setEditingTizado(tizado);
      setFormData({
        id_base: tizado.id_base.toString(),
        ancho: tizado.ancho || '',
        archivo_tizado: tizado.archivo_tizado || '',
        curva: tizado.curva || '',
      });
    } else {
      setEditingTizado(null);
      setFormData({
        id_base: '',
        ancho: '',
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
      accessorKey: 'ancho',
      header: 'Ancho',
      cell: ({ row }) => (
        row.original.ancho ? <span className="font-mono">{row.original.ancho}</span> : '-'
      ),
    },
    {
      accessorKey: 'archivo_tizado',
      header: 'Archivo Tizado',
      cell: ({ row }) => {
        const archivo = row.original.archivo_tizado;
        if (!archivo) return <span className="text-slate-400 text-xs">Sin archivo</span>;
        
        if (!canDownload('tizados')) {
          const extension = archivo.split('.').pop()?.toUpperCase() || 'FILE';
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
              {extension}
            </span>
          );
        }
        
        const extension = archivo.split('.').pop()?.toUpperCase() || 'FILE';
        const getFileColor = (ext) => {
          const colors = {
            'PDF': 'bg-red-100 text-red-700 border-red-200',
            'XLSX': 'bg-green-100 text-green-700 border-green-200',
            'XLS': 'bg-green-100 text-green-700 border-green-200',
            'DOC': 'bg-blue-100 text-blue-700 border-blue-200',
            'DOCX': 'bg-blue-100 text-blue-700 border-blue-200',
            'DXF': 'bg-purple-100 text-purple-700 border-purple-200',
            'AI': 'bg-orange-100 text-orange-700 border-orange-200',
            'CDR': 'bg-yellow-100 text-yellow-700 border-yellow-200',
          };
          return colors[ext] || 'bg-slate-100 text-slate-700 border-slate-200';
        };
        
        return (
          <button
            onClick={() => handleDownloadFile(archivo)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all hover:shadow-md hover:scale-105 cursor-pointer ${getFileColor(extension)}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {extension}
          </button>
        );
      },
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
          {canEdit('tizados') && (
            <Button
              data-testid={`edit-tizado-${row.original.id_tizado}`}
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog(row.original)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit size={16} />
            </Button>
          )}
          {canDelete('tizados') && (
            <Button
              data-testid={`delete-tizado-${row.original.id_tizado}`}
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id_tizado)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <ExcelGrid
        data={tizados}
        columns={columns}
        onAdd={canCreate('tizados') ? () => handleOpenDialog() : null}
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
                <Label htmlFor="ancho">Ancho (Número)</Label>
                <Input
                  id="ancho"
                  data-testid="input-ancho"
                  type="number"
                  step="0.01"
                  value={formData.ancho}
                  onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                  className="border-slate-200 focus:ring-blue-500"
                  placeholder="Ej: 150, 180"
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

              <div className="space-y-2">
                <Label>Archivo de Tizado</Label>
                <FileUpload
                  value={formData.archivo_tizado}
                  onChange={(file) => setFormData({ ...formData, archivo_tizado: file })}
                  accept=".pdf,.dxf,.ai,.cdr"
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

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              ¿Estás seguro de que deseas eliminar este tizado?
              {itemToDelete && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <p><strong>ID:</strong> {itemToDelete.id_tizado}</p>
                  <p><strong>Base:</strong> {itemToDelete.id_base}</p>
                  {itemToDelete.ancho && <p><strong>Ancho:</strong> {itemToDelete.ancho}</p>}
                  {itemToDelete.archivo_tizado && <p><strong>Archivo:</strong> Se eliminará el archivo</p>}
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

export default Tizados;