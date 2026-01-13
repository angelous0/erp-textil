import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Entalles = () => {
  const [entalles, setEntalles] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntalle, setEditingEntalle] = useState(null);
  const [formData, setFormData] = useState({ nombre_entalle: '' });

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

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/entalles/${id}`);
      toast.success('Entalle eliminado');
      fetchEntalles();
    } catch (error) {
      toast.error('Error al eliminar entalle');
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
          <Button
            data-testid={`edit-entalle-${row.original.id_entalle}`}
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit size={16} />
          </Button>
          <Button
            data-testid={`delete-entalle-${row.original.id_entalle}`}
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id_entalle)}
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
        data={entalles}
        columns={columns}
        onAdd={() => handleOpenDialog()}
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
    </div>
  );
};

export default Entalles;