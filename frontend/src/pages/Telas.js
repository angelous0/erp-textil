import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Telas = () => {
  const [telas, setTelas] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTela, setEditingTela] = useState(null);
  const [formData, setFormData] = useState({
    nombre_tela: '',
    gramaje: '',
    elasticidad: '',
    proveedor: '',
    ancho_estandar: '',
    color: '',
  });

  useEffect(() => {
    fetchTelas();
  }, []);

  const fetchTelas = async () => {
    try {
      const response = await axios.get(`${API}/telas`);
      setTelas(response.data);
    } catch (error) {
      toast.error('Error al cargar telas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTela) {
        await axios.put(`${API}/telas/${editingTela.id_tela}`, formData);
        toast.success('Tela actualizada');
      } else {
        await axios.post(`${API}/telas`, formData);
        toast.success('Tela creada');
      }
      fetchTelas();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error al guardar tela');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/telas/${id}`);
      toast.success('Tela eliminada');
      fetchTelas();
    } catch (error) {
      toast.error('Error al eliminar tela');
    }
  };

  const handleOpenDialog = (tela = null) => {
    if (tela) {
      setEditingTela(tela);
      setFormData({
        nombre_tela: tela.nombre_tela,
        gramaje: tela.gramaje || '',
        elasticidad: tela.elasticidad || '',
        proveedor: tela.proveedor || '',
        ancho_estandar: tela.ancho_estandar || '',
        color: tela.color || '',
      });
    } else {
      setEditingTela(null);
      setFormData({
        nombre_tela: '',
        gramaje: '',
        elasticidad: '',
        proveedor: '',
        ancho_estandar: '',
        color: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTela(null);
  };

  const columns = [
    {
      accessorKey: 'id_tela',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.id_tela}</span>,
    },
    {
      accessorKey: 'nombre_tela',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.nombre_tela}</span>,
    },
    {
      accessorKey: 'gramaje',
      header: 'Gramaje',
      cell: ({ row }) => <span className="font-mono">{row.original.gramaje}</span>,
    },
    {
      accessorKey: 'elasticidad',
      header: 'Elasticidad',
    },
    {
      accessorKey: 'proveedor',
      header: 'Proveedor',
    },
    {
      accessorKey: 'ancho_estandar',
      header: 'Ancho Estándar',
      cell: ({ row }) => <span className="font-mono">{row.original.ancho_estandar}</span>,
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => {
        const color = row.original.color;
        return color ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-500/10">
            {color}
          </span>
        ) : null;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            data-testid={`edit-tela-${row.original.id_tela}`}
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit size={16} />
          </Button>
          <Button
            data-testid={`delete-tela-${row.original.id_tela}`}
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id_tela)}
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
        data={telas}
        columns={columns}
        onAdd={() => handleOpenDialog()}
        searchPlaceholder="Buscar telas..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingTela ? 'Editar Tela' : 'Nueva Tela'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_tela">Nombre *</Label>
                <Input
                  id="nombre_tela"
                  data-testid="input-nombre-tela"
                  value={formData.nombre_tela}
                  onChange={(e) => setFormData({ ...formData, nombre_tela: e.target.value })}
                  required
                  className="border-slate-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gramaje">Gramaje</Label>
                <Input
                  id="gramaje"
                  data-testid="input-gramaje"
                  type="number"
                  step="0.01"
                  value={formData.gramaje}
                  onChange={(e) => setFormData({ ...formData, gramaje: e.target.value })}
                  className="border-slate-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elasticidad">Elasticidad</Label>
                <Input
                  id="elasticidad"
                  data-testid="input-elasticidad"
                  value={formData.elasticidad}
                  onChange={(e) => setFormData({ ...formData, elasticidad: e.target.value })}
                  className="border-slate-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  data-testid="input-proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  className="border-slate-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ancho_estandar">Ancho Estándar</Label>
                <Input
                  id="ancho_estandar"
                  data-testid="input-ancho-estandar"
                  type="number"
                  step="0.01"
                  value={formData.ancho_estandar}
                  onChange={(e) => setFormData({ ...formData, ancho_estandar: e.target.value })}
                  className="border-slate-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger data-testid="select-color">
                    <SelectValue placeholder="Seleccionar color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Azul">Azul</SelectItem>
                    <SelectItem value="Negro">Negro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                data-testid="submit-tela-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingTela ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Telas;