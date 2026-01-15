import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Users, Plus, Edit, Trash2, Shield, ShieldCheck, ShieldAlert, Eye, Settings, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ROLES = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-800 border-red-200', icon: ShieldAlert },
  admin: { label: 'Admin', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: ShieldCheck },
  editor: { label: 'Editor', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Shield },
  viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Eye },
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermisosDialogOpen, setIsPermisosDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserForPermisos, setSelectedUserForPermisos] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre: '',
    password: '',
    rol: 'viewer',
    activo: true
  });

  const [permisos, setPermisos] = useState({});

  const currentUser = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${API}/usuarios`);
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        nombre: user.nombre,
        password: '',
        rol: user.rol,
        activo: user.activo
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        nombre: '',
        password: '',
        rol: 'viewer',
        activo: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenPermisos = async (user) => {
    setSelectedUserForPermisos(user);
    try {
      const response = await axios.get(`${API}/usuarios/${user.id_usuario}/permisos`);
      setPermisos(response.data);
      setIsPermisosDialogOpen(true);
    } catch (error) {
      toast.error('Error al cargar permisos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await axios.put(`${API}/usuarios/${editingUser.id_usuario}`, updateData);
        toast.success('Usuario actualizado');
      } else {
        if (!formData.password) {
          toast.error('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await axios.post(`${API}/usuarios`, formData);
        toast.success('Usuario creado');
      }
      setIsDialogOpen(false);
      fetchUsuarios();
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al guardar usuario';
      toast.error(message);
    }
  };

  const handleSavePermisos = async () => {
    try {
      await axios.put(`${API}/usuarios/${selectedUserForPermisos.id_usuario}/permisos`, permisos);
      toast.success('Permisos actualizados');
      setIsPermisosDialogOpen(false);
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al guardar permisos';
      toast.error(message);
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/usuarios/${userToDelete.id_usuario}`);
      toast.success('Usuario eliminado');
      fetchUsuarios();
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al eliminar usuario';
      toast.error(message);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const togglePermisoGroup = (modulo, value) => {
    setPermisos(prev => ({
      ...prev,
      [`${modulo}_ver`]: value,
      [`${modulo}_crear`]: value,
      [`${modulo}_editar`]: value,
      [`${modulo}_eliminar`]: value,
    }));
  };

  const RolBadge = ({ rol }) => {
    const config = ROLES[rol];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
            <p className="text-slate-500">Administra usuarios y sus permisos</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase">Usuario</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase">Nombre</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase">Email</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase">Rol</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase">Estado</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((user) => (
              <tr key={user.id_usuario} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <span className="font-mono font-medium text-slate-900">{user.username}</span>
                </td>
                <td className="py-4 px-6 text-slate-700">{user.nombre}</td>
                <td className="py-4 px-6 text-slate-600 text-sm">{user.email}</td>
                <td className="py-4 px-6"><RolBadge rol={user.rol} /></td>
                <td className="py-4 px-6">
                  {user.activo ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(user)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit size={16} />
                    </Button>
                    {user.rol !== 'super_admin' && user.rol !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPermisos(user)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Settings size={16} />
                      </Button>
                    )}
                    {user.id_usuario !== currentUser.id_usuario && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog Crear/Editar Usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="nombre_usuario"
                disabled={editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUser.rol === 'super_admin' && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo}
                onCheckedChange={(v) => setFormData({ ...formData, activo: v })}
              />
              <Label>Usuario Activo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Permisos */}
      <Dialog open={isPermisosDialogOpen} onOpenChange={setIsPermisosDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings size={20} />
              Permisos de {selectedUserForPermisos?.nombre}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Módulos CRUD */}
            {['marcas', 'tipos', 'entalles', 'telas', 'muestras', 'bases', 'tizados'].map((modulo) => (
              <div key={modulo} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 capitalize">{modulo}</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => togglePermisoGroup(modulo, true)}
                      className="text-xs"
                    >
                      Todo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => togglePermisoGroup(modulo, false)}
                      className="text-xs"
                    >
                      Nada
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {['ver', 'crear', 'editar', 'eliminar'].map((accion) => (
                    <div key={accion} className="flex items-center gap-2">
                      <Switch
                        checked={permisos[`${modulo}_${accion}`] || false}
                        onCheckedChange={(v) => setPermisos({ ...permisos, [`${modulo}_${accion}`]: v })}
                      />
                      <Label className="text-sm capitalize">{accion}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Separator />

            {/* Permisos de Descarga */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Descargas de Archivos</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'descargar_patrones', label: 'Patrones' },
                  { key: 'descargar_tizados', label: 'Tizados' },
                  { key: 'descargar_fichas', label: 'Fichas' },
                  { key: 'descargar_imagenes', label: 'Imágenes' },
                  { key: 'descargar_costos', label: 'Archivos de Costos' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      checked={permisos[key] || false}
                      onCheckedChange={(v) => setPermisos({ ...permisos, [key]: v })}
                    />
                    <Label className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermisosDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermisos} className="bg-purple-600 hover:bg-purple-700">
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.username}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Usuarios;
