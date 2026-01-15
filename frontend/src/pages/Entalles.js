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

const Entalles = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [entalles, setEntalles] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntalle, setEditingEntalle] = useState(null);
  const [formData, setFormData] = useState({ nombre_entalle: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, entalle: null });

  useEffect(() => {
    fetchEntalles();
  }, []);

  const fetchEntalles = async () => {
    try {
      const response = await axios.get(`${API}/entalles`);
      setEntalles(response.data);
    } catch (error) {
      toast.error('Error al cargar entalles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntalle) {
        await axios.put(`${API}/entalles/${editingEntalle.id_entalle}`, formData);
        toast.success('Entalle actualizado');
      } else {
        await axios.post(`${API}/entalles`, formData);
        toast.success('Entalle creado');
      }
      fetchEntalles();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error al guardar entalle');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.entalle) return;
    try {
      await axios.delete(`${API}/entalles/${deleteConfirm.entalle.id_entalle}`);
      toast.success('Entalle eliminado');
      fetchEntalles();
    } catch (error) {
      toast.error('Error al eliminar entalle');
    } finally {
      setDeleteConfirm({ open: false, entalle: null });
    }
  };

  const handleOpenDialog = (entalle = null) => {
    if (entalle) {
      setEditingEntalle(entalle);
      setFormData({ nombre_entalle: entalle.nombre_entalle });
    } else {
      setEditingEntalle(null);
      setFormData({ nombre_entalle: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntalle(null);
  };

  const columns = [
    {
      accessorKey: 'id_entalle',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_entalle}</span>,
    },
    {
      accessorKey: 'nombre_entalle',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.nombre_entalle}</span>,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {canEdit('entalles') && (
            <Button
              data-testid={`edit-entalle-${row.original.id_entalle}`}
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog(row.original)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit size={16} />
            </Button>
          )}
          {canDelete('entalles') && (
            <Button
              data-testid={`delete-entalle-${row.original.id_entalle}`}
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm({ open: true, entalle: row.original })}
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
        data={entalles}
        columns={columns}
        onAdd={canCreate('entalles') ? () => handleOpenDialog() : null}
        searchPlaceholder="Buscar entalles..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingEntalle ? 'Editar Entalle' : 'Nuevo Entalle'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_entalle">Nombre *</Label>
                <Input
                  id="nombre_entalle"
                  data-testid="input-nombre-entalle"
                  value={formData.nombre_entalle}
                  onChange={(e) => setFormData({ ...formData, nombre_entalle: e.target.value })}
                  required
                  className="border-slate-200 focus:ring-blue-500"
                  placeholder="Ej: Regular, Slim, Oversize"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-entalle-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingEntalle ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entalle?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el entalle 
              <strong> "{deleteConfirm.entalle?.nombre_entalle}"</strong>.
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

export default Entalles;
