import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TiposProducto = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formData, setFormData] = useState({ nombre_tipo: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, tipo: null });

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      const response = await axios.get(`${API}/tipos-producto`);
      setTipos(response.data);
    } catch (error) {
      toast.error('Error al cargar tipos de producto');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTipo) {
        await axios.put(`${API}/tipos-producto/${editingTipo.id_tipo}`, formData);
        toast.success('Tipo de producto actualizado');
      } else {
        await axios.post(`${API}/tipos-producto`, formData);
        toast.success('Tipo de producto creado');
      }
      fetchTipos();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error al guardar tipo de producto');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.tipo) return;
    try {
      await axios.delete(`${API}/tipos-producto/${deleteConfirm.tipo.id_tipo}`);
      toast.success('Tipo de producto eliminado');
      fetchTipos();
    } catch (error) {
      toast.error('Error al eliminar tipo de producto');
    } finally {
      setDeleteConfirm({ open: false, tipo: null });
    }
  };

  const handleOpenDialog = (tipo = null) => {
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({ nombre_tipo: tipo.nombre_tipo });
    } else {
      setEditingTipo(null);
      setFormData({ nombre_tipo: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTipo(null);
  };

  const columns = [
    {
      accessorKey: 'id_tipo',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_tipo}</span>,
    },
    {
      accessorKey: 'nombre_tipo',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.nombre_tipo}</span>,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {canEdit('tipos') && (
            <Button
              data-testid={`edit-tipo-${row.original.id_tipo}`}
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog(row.original)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit size={16} />
            </Button>
          )}
          {canDelete('tipos') && (
            <Button
              data-testid={`delete-tipo-${row.original.id_tipo}`}
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm({ open: true, tipo: row.original })}
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
        data={tipos}
        columns={columns}
        onAdd={canCreate('tipos') ? () => handleOpenDialog() : null}
        searchPlaceholder="Buscar tipos de producto..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingTipo ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_tipo">Nombre *</Label>
                <Input
                  id="nombre_tipo"
                  data-testid="input-nombre-tipo"
                  value={formData.nombre_tipo}
                  onChange={(e) => setFormData({ ...formData, nombre_tipo: e.target.value })}
                  required
                  className="border-slate-200 focus:ring-blue-500"
                  placeholder="Ej: Polo, Pantalón, Jean, Short"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-tipo-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingTipo ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el tipo 
              <strong> "{deleteConfirm.tipo?.nombre_tipo}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TiposProducto;
