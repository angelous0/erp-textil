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

const Marcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState(null);
  const [formData, setFormData] = useState({ nombre_marca: '' });

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    try {
      const response = await axios.get(`${API}/marcas`);
      setMarcas(response.data);
    } catch (error) {
      toast.error('Error al cargar marcas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMarca) {
        await axios.put(`${API}/marcas/${editingMarca.id_marca}`, formData);
        toast.success('Marca actualizada');
      } else {
        await axios.post(`${API}/marcas`, formData);
        toast.success('Marca creada');
      }
      fetchMarcas();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error al guardar marca');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/marcas/${id}`);
      toast.success('Marca eliminada');
      fetchMarcas();
    } catch (error) {
      toast.error('Error al eliminar marca');
    }
  };

  const handleOpenDialog = (marca = null) => {
    if (marca) {
      setEditingMarca(marca);
      setFormData({ nombre_marca: marca.nombre_marca });
    } else {
      setEditingMarca(null);
      setFormData({ nombre_marca: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMarca(null);
  };

  const columns = [
    {
      accessorKey: 'id_marca',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_marca}</span>,
    },
    {
      accessorKey: 'nombre_marca',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.nombre_marca}</span>,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            data-testid={`edit-marca-${row.original.id_marca}`}
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit size={16} />
          </Button>
          <Button
            data-testid={`delete-marca-${row.original.id_marca}`}
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id_marca)}
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
        data={marcas}
        columns={columns}
        onAdd={() => handleOpenDialog()}
        searchPlaceholder="Buscar marcas..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_marca">Nombre *</Label>
                <Input
                  id="nombre_marca"
                  data-testid="input-nombre-marca"
                  value={formData.nombre_marca}
                  onChange={(e) => setFormData({ ...formData, nombre_marca: e.target.value })}
                  required
                  className="border-slate-200 focus:ring-blue-500"
                  placeholder="Ej: Nike, Adidas, Puma"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-marca-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingMarca ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marcas;
