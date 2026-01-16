import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ExcelGrid from '../components/ExcelGrid';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Edit, Trash2, CheckCircle, XCircle, Plus, X, Search, AlertTriangle, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente para la celda de imagen con subida directa
const ImageCell = ({ base, onViewImage, onUploadImage, canUpload }) => {
  const inputRef = useRef(null);
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUploadImage(base.id_base, file);
    }
  };
  
  if (base.imagen) {
    return (
      <button
        onClick={() => onViewImage(base.imagen)}
        className="inline-block"
      >
        <img 
          src={`${API}/files/${base.imagen}`} 
          alt="Base"
          className="w-16 h-16 object-cover rounded border border-slate-200 hover:border-blue-500 transition-all cursor-pointer hover:scale-105"
        />
      </button>
    );
  }
  
  return (
    <div>
      {canUpload ? (
        <>
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer border border-dashed border-slate-300 hover:border-blue-400"
          >
            <Upload size={12} className="mr-1" />
            Subir
          </button>
        </>
      ) : (
        <span className="text-slate-400 text-xs">-</span>
      )}
    </div>
  );
};

const Bases = () => {
  const { canCreate, canEdit, canDelete, canDownload, canUpload } = useAuth();
  const [bases, setBases] = useState([]);
  const [basesFiltradas, setBasesFiltradas] = useState([]);
  const [filtroAprobacion, setFiltroAprobacion] = useState('aprobados'); // 'todos', 'aprobados', 'pendientes'
  const [muestras, setMuestras] = useState([]);
  const [tizados, setTizados] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState(null);
  const [formData, setFormData] = useState({
    id_muestra_base: '',
    modelo: '',
    patron: '',
    imagen: '',
    aprobado: false,
    id_modelo: null,
    id_registro: null,
  });
  const [fichas, setFichas] = useState([]);
  const [fichasDialogOpen, setFichasDialogOpen] = useState(false);
  const [fichasViewing, setFichasViewing] = useState([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [tizadosBusqueda, setTizadosBusqueda] = useState('');
  
  // Estados para mini-ERP sync
  const [modelosMiniERP, setModelosMiniERP] = useState([]);
  const [registrosMiniERP, setRegistrosMiniERP] = useState([]);
  const [miniERPConnected, setMiniERPConnected] = useState(false);
  const [searchModelo, setSearchModelo] = useState('');
  const [searchRegistro, setSearchRegistro] = useState('');
  
  // Estados para modal de tizados
  const [tizadosDialogOpen, setTizadosDialogOpen] = useState(false);
  const [currentBaseForTizados, setCurrentBaseForTizados] = useState(null);
  const [tizadosSearchModal, setTizadosSearchModal] = useState('');
  const [newTizado, setNewTizado] = useState({ ancho: '', curva: '', archivo_tizado: '' });
  const [isCreatingTizado, setIsCreatingTizado] = useState(false);
  const [tizadosOrdenados, setTizadosOrdenados] = useState([]);
  const [ordenColumna, setOrdenColumna] = useState({ columna: null, direccion: 'asc' });

  // Estados para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Estados para confirmación de eliminación de fichas y tizados en modales
  const [deleteFichaDialogOpen, setDeleteFichaDialogOpen] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState(null);
  const [deleteTizadoDialogOpen, setDeleteTizadoDialogOpen] = useState(false);
  const [tizadoToDelete, setTizadoToDelete] = useState(null);

  // Estados para modal de fichas con funcionalidad de crear
  const [currentBaseForFichas, setCurrentBaseForFichas] = useState(null);
  const [fichasSearchModal, setFichasSearchModal] = useState('');
  const [newFicha, setNewFicha] = useState({ nombre_ficha: '', archivo: '' });
  const [isCreatingFicha, setIsCreatingFicha] = useState(false);

  // Estados para modal de registros ERP
  const [registrosERPDialogOpen, setRegistrosERPDialogOpen] = useState(false);
  const [currentBaseForRegistros, setCurrentBaseForRegistros] = useState(null);
  const [registrosVinculados, setRegistrosVinculados] = useState([]);
  const [registrosDisponibles, setRegistrosDisponibles] = useState([]);
  const [registrosSearchModal, setRegistrosSearchModal] = useState('');
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  const handleViewTizados = (base) => {
    setCurrentBaseForTizados(base);
    const tizadosDeBase = tizados.filter(t => t.id_base === base.id_base);
    setTizadosOrdenados(tizadosDeBase);
    setTizadosDialogOpen(true);
    setTizadosSearchModal('');
    setNewTizado({ ancho: '', curva: '', archivo_tizado: '' });
    setIsCreatingTizado(false);
    setOrdenColumna({ columna: null, direccion: 'asc' });
  };

  // Funciones para Mini-ERP
  const fetchMiniERPStatus = async () => {
    try {
      const response = await axios.get(`${API}/mini-erp/status`);
      setMiniERPConnected(response.data.connected);
    } catch (error) {
      setMiniERPConnected(false);
    }
  };

  const fetchModelosMiniERP = async (search = '') => {
    try {
      const response = await axios.get(`${API}/mini-erp/modelos`, {
        params: { search, limit: 50 }
      });
      setModelosMiniERP(response.data);
    } catch (error) {
      console.error('Error cargando modelos mini-ERP:', error);
    }
  };

  const fetchRegistrosMiniERP = async (search = '') => {
    try {
      const response = await axios.get(`${API}/mini-erp/registros/sin-vincular`, {
        params: { search, limit: 50 }
      });
      setRegistrosMiniERP(response.data);
    } catch (error) {
      console.error('Error cargando registros mini-ERP:', error);
    }
  };

  // Funciones para modal de Registros ERP
  const handleViewRegistrosERP = async (base) => {
    setCurrentBaseForRegistros(base);
    setRegistrosERPDialogOpen(true);
    setRegistrosSearchModal('');
    setLoadingRegistros(true);
    
    try {
      // Cargar registros vinculados a esta base
      const vinculadosRes = await axios.get(`${API}/mini-erp/registros/vinculados/${base.id_base}`);
      setRegistrosVinculados(vinculadosRes.data);
      
      // Cargar registros disponibles (sin vincular)
      const disponiblesRes = await axios.get(`${API}/mini-erp/registros/sin-vincular`, {
        params: { limit: 100 }
      });
      setRegistrosDisponibles(disponiblesRes.data);
    } catch (error) {
      console.error('Error cargando registros:', error);
      toast.error('Error al cargar registros del mini-ERP');
    } finally {
      setLoadingRegistros(false);
    }
  };

  const fetchRegistrosDisponibles = async (search = '') => {
    try {
      const response = await axios.get(`${API}/mini-erp/registros/sin-vincular`, {
        params: { search, limit: 100 }
      });
      setRegistrosDisponibles(response.data);
    } catch (error) {
      console.error('Error buscando registros:', error);
    }
  };

  const handleVincularRegistroModal = async (id_registro) => {
    if (!currentBaseForRegistros) return;
    
    try {
      await axios.post(`${API}/mini-erp/sync/vincular`, null, {
        params: { id_base: currentBaseForRegistros.id_base, id_registro }
      });
      toast.success('Registro vinculado exitosamente');
      
      // Recargar listas
      const vinculadosRes = await axios.get(`${API}/mini-erp/registros/vinculados/${currentBaseForRegistros.id_base}`);
      setRegistrosVinculados(vinculadosRes.data);
      
      // Recargar disponibles
      await fetchRegistrosDisponibles(registrosSearchModal);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al vincular registro';
      toast.error(msg);
    }
  };

  const handleDesvincularRegistroModal = async (id_registro) => {
    try {
      await axios.post(`${API}/mini-erp/sync/desvincular`, null, {
        params: { id_registro }
      });
      toast.success('Registro desvinculado');
      
      // Recargar listas
      if (currentBaseForRegistros) {
        const vinculadosRes = await axios.get(`${API}/mini-erp/registros/vinculados/${currentBaseForRegistros.id_base}`);
        setRegistrosVinculados(vinculadosRes.data);
      }
      
      // Recargar disponibles
      await fetchRegistrosDisponibles(registrosSearchModal);
    } catch (error) {
      toast.error('Error al desvincular registro');
    }
  };

  // Cargar conteo de registros se hace al abrir el modal

  const handleVincularRegistro = async (id_base, id_registro) => {
    try {
      await axios.post(`${API}/mini-erp/sync/vincular`, null, {
        params: { id_base, id_registro }
      });
      toast.success('Base vinculada con registro del mini-ERP');
      fetchBases();
    } catch (error) {
      toast.error('Error al vincular con mini-ERP');
    }
  };

  const handleDesvincularRegistro = async (id_base) => {
    try {
      await axios.post(`${API}/mini-erp/sync/desvincular/${id_base}`);
      toast.success('Base desvinculada del mini-ERP');
      fetchBases();
    } catch (error) {
      toast.error('Error al desvincular');
    }
  };

  const handleOrdenarColumna = (columna) => {
    let direccion = 'asc';
    if (ordenColumna.columna === columna && ordenColumna.direccion === 'asc') {
      direccion = 'desc';
    }
    
    const tizadosCopia = [...tizadosOrdenados];
    tizadosCopia.sort((a, b) => {
      let valorA = a[columna];
      let valorB = b[columna];
      
      if (columna === 'ancho') {
        valorA = parseFloat(valorA) || 0;
        valorB = parseFloat(valorB) || 0;
      } else if (columna === 'curva') {
        valorA = (valorA || '').toLowerCase();
        valorB = (valorB || '').toLowerCase();
      }
      
      if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
      return 0;
    });
    
    setTizadosOrdenados(tizadosCopia);
    setOrdenColumna({ columna, direccion });
  };

  const handleMoverFila = (index, direccion) => {
    const nuevaLista = [...tizadosOrdenados];
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    
    if (nuevoIndex < 0 || nuevoIndex >= nuevaLista.length) return;
    
    [nuevaLista[index], nuevaLista[nuevoIndex]] = [nuevaLista[nuevoIndex], nuevaLista[index]];
    setTizadosOrdenados(nuevaLista);
    setOrdenColumna({ columna: null, direccion: 'asc' }); // Reset ordenamiento
  };

  const getTizadosForModal = () => {
    if (!tizadosSearchModal) return tizadosOrdenados;
    
    const busqueda = tizadosSearchModal.toLowerCase();
    return tizadosOrdenados.filter(t => 
      (t.ancho?.toString().includes(busqueda)) ||
      (t.curva?.toLowerCase().includes(busqueda))
    );
  };

  const handleCreateTizado = async () => {
    if (!newTizado.ancho && !newTizado.curva) {
      toast.error('Por favor ingresa al menos el ancho o la curva');
      return;
    }

    try {
      const submitData = {
        id_base: currentBaseForTizados.id_base,
        ancho: newTizado.ancho ? parseFloat(newTizado.ancho) : null,
        curva: newTizado.curva || null,
        archivo_tizado: newTizado.archivo_tizado || null,
      };

      await axios.post(`${API}/tizados`, submitData);
      toast.success('Tizado creado');
      
      // Recargar tizados
      await fetchTizados();
      
      // Actualizar la lista del modal
      const response = await axios.get(`${API}/tizados`);
      const tizadosDeBase = response.data.filter(t => t.id_base === currentBaseForTizados.id_base);
      setTizadosOrdenados(tizadosDeBase);
      
      // Limpiar formulario
      setNewTizado({ ancho: '', curva: '', archivo_tizado: '' });
      setIsCreatingTizado(false);
    } catch (error) {
      toast.error('Error al crear tizado');
      console.error(error);
    }
  };

  const handleDeleteTizadoFromModal = (tizado) => {
    setTizadoToDelete(tizado);
    setDeleteTizadoDialogOpen(true);
  };

  const confirmDeleteTizado = async () => {
    if (!tizadoToDelete) return;
    
    try {
      // Eliminar archivo de R2 si existe
      if (tizadoToDelete.archivo_tizado) {
        try {
          await axios.delete(`${API}/files/${tizadoToDelete.archivo_tizado}`);
        } catch (e) {
          console.log('Archivo no encontrado');
        }
      }
      
      // Eliminar el tizado
      await axios.delete(`${API}/tizados/${tizadoToDelete.id_tizado}`);
      toast.success('Tizado eliminado');
      
      // Recargar tizados
      await fetchTizados();
      
      // Actualizar la lista del modal
      const response = await axios.get(`${API}/tizados`);
      const tizadosDeBase = response.data.filter(t => t.id_base === currentBaseForTizados.id_base);
      setTizadosOrdenados(tizadosDeBase);
    } catch (error) {
      toast.error('Error al eliminar tizado');
      console.error(error);
    } finally {
      setDeleteTizadoDialogOpen(false);
      setTizadoToDelete(null);
    }
  };

  const getTizadosFiltrados = () => {
    if (!editingBase) return [];
    const tizadosDeBase = tizados.filter(t => t.id_base === editingBase.id_base);
    if (!tizadosBusqueda) return tizadosDeBase;
    
    const busqueda = tizadosBusqueda.toLowerCase();
    return tizadosDeBase.filter(t => 
      (t.ancho?.toString().includes(busqueda)) ||
      (t.curva?.toLowerCase().includes(busqueda))
    );
  };

  const handleViewImage = (imageUrl) => {
    setViewingImage(imageUrl);
    setImageViewerOpen(true);
  };

  const handleViewFichas = (base) => {
    setCurrentBaseForFichas(base);
    setFichasViewing(base.fichas || []);
    setFichasDialogOpen(true);
    setFichasSearchModal('');
    setNewFicha({ nombre_ficha: '', archivo: '' });
    setIsCreatingFicha(false);
  };

  const getFichasForModal = () => {
    if (!fichasSearchModal) return fichasViewing;
    
    const busqueda = fichasSearchModal.toLowerCase();
    return fichasViewing.filter(f => 
      (f.nombre_ficha?.toLowerCase().includes(busqueda))
    );
  };

  const handleCreateFicha = async () => {
    if (!newFicha.nombre_ficha && !newFicha.archivo) {
      toast.error('Por favor ingresa al menos el nombre o un archivo');
      return;
    }

    try {
      const submitData = {
        id_base: currentBaseForFichas.id_base,
        nombre_ficha: newFicha.nombre_ficha || null,
        archivo: newFicha.archivo || null,
      };

      await axios.post(`${API}/fichas`, submitData);
      toast.success('Ficha creada');
      
      // Recargar fichas
      const response = await axios.get(`${API}/fichas/base/${currentBaseForFichas.id_base}`);
      setFichasViewing(response.data);
      
      // Recargar bases para actualizar el contador
      fetchBases();
      
      // Limpiar formulario
      setNewFicha({ nombre_ficha: '', archivo: '' });
      setIsCreatingFicha(false);
    } catch (error) {
      toast.error('Error al crear ficha');
      console.error(error);
    }
  };

  const handleDeleteFichaFromModal = (ficha) => {
    setFichaToDelete(ficha);
    setDeleteFichaDialogOpen(true);
  };

  const confirmDeleteFicha = async () => {
    if (!fichaToDelete) return;
    
    try {
      // Eliminar archivo de R2 si existe
      if (fichaToDelete.archivo) {
        try {
          await axios.delete(`${API}/files/${fichaToDelete.archivo}`);
        } catch (e) {
          console.log('Archivo no encontrado');
        }
      }
      
      // Eliminar la ficha
      await axios.delete(`${API}/fichas/${fichaToDelete.id_ficha}`);
      toast.success('Ficha eliminada');
      
      // Recargar fichas
      const response = await axios.get(`${API}/fichas/base/${currentBaseForFichas.id_base}`);
      setFichasViewing(response.data);
      
      // Recargar bases
      fetchBases();
    } catch (error) {
      toast.error('Error al eliminar ficha');
      console.error(error);
    } finally {
      setDeleteFichaDialogOpen(false);
      setFichaToDelete(null);
    }
  };

  // Extrae el nombre original del archivo (formato: uuid_nombreoriginal.ext)
  const extractOriginalName = (filename) => {
    if (!filename) return filename;
    const parts = filename.split('_');
    if (parts.length > 1) {
      // Remover el UUID (primer segmento) y unir el resto
      return parts.slice(1).join('_');
    }
    return filename;
  };

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
      a.download = extractOriginalName(filename);
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

  // Subir imagen directamente desde la tabla
  const handleUploadImageFromTable = async (baseId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const filename = uploadResponse.data.filename;
      
      // Actualizar la base con la nueva imagen
      await axios.put(`${API}/bases/${baseId}`, { imagen: filename });
      
      toast.success('Imagen subida');
      fetchBases();
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir imagen');
    }
  };

  useEffect(() => {
    fetchBases();
    fetchMuestras();
    fetchTizados();
    fetchMiniERPStatus();
    fetchModelosMiniERP();
  }, []);

  const fetchBases = async () => {
    try {
      const response = await axios.get(`${API}/bases`);
      setBases(response.data);
      aplicarFiltro(response.data, filtroAprobacion);
    } catch (error) {
      toast.error('Error al cargar bases');
    }
  };

  // Nota: Los conteos de registros ERP se cargan dinámicamente al abrir el modal

  const aplicarFiltro = (data, filtro) => {
    let filtradas = data;
    if (filtro === 'aprobados') {
      filtradas = data.filter(b => b.aprobado === true);
    } else if (filtro === 'pendientes') {
      filtradas = data.filter(b => b.aprobado === false);
    }
    setBasesFiltradas(filtradas);
  };

  useEffect(() => {
    aplicarFiltro(bases, filtroAprobacion);
  }, [filtroAprobacion, bases]);

  const fetchMuestras = async () => {
    try {
      const response = await axios.get(`${API}/muestras-base`);
      setMuestras(response.data);
    } catch (error) {
      console.error('Error al cargar muestras base');
    }
  };

  const fetchTizados = async () => {
    try {
      const response = await axios.get(`${API}/tizados`);
      setTizados(response.data);
    } catch (error) {
      console.error('Error al cargar tizados');
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
        modelo: formData.modelo || null,
        patron: formData.patron || null,
        imagen: formData.imagen || null,
        aprobado: formData.aprobado,
        id_modelo: formData.id_modelo || null,
        id_registro: formData.id_registro || null,
      };

      let baseId;
      if (editingBase) {
        await axios.put(`${API}/bases/${editingBase.id_base}`, submitData);
        baseId = editingBase.id_base;
        toast.success('Base actualizada');
      } else {
        const response = await axios.post(`${API}/bases`, submitData);
        baseId = response.data.id_base;
        toast.success('Base creada');
      }

      // Guardar fichas
      for (const ficha of fichas) {
        if (ficha.id_ficha) {
          // Actualizar ficha existente
          await axios.put(`${API}/fichas/${ficha.id_ficha}`, {
            nombre_ficha: ficha.nombre_ficha,
            archivo: ficha.archivo,
          });
        } else if (ficha.nombre_ficha || ficha.archivo) {
          // Crear nueva ficha
          await axios.post(`${API}/fichas`, {
            id_base: baseId,
            nombre_ficha: ficha.nombre_ficha,
            archivo: ficha.archivo,
          });
        }
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
    // Encontrar la base y mostrar confirmación
    const base = bases.find(b => b.id_base === id);
    setItemToDelete(base);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Eliminar archivos asociados de R2
      const filesToDelete = [];
      
      // Archivo de patrón
      if (itemToDelete.patron) {
        filesToDelete.push(itemToDelete.patron);
      }
      
      // Archivo de imagen
      if (itemToDelete.imagen) {
        filesToDelete.push(itemToDelete.imagen);
      }
      
      // Archivos de fichas
      if (itemToDelete.fichas) {
        itemToDelete.fichas.forEach(ficha => {
          if (ficha.archivo) {
            filesToDelete.push(ficha.archivo);
          }
        });
      }
      
      // Archivos de tizados
      const tizadosDeBase = tizados.filter(t => t.id_base === itemToDelete.id_base);
      tizadosDeBase.forEach(tizado => {
        if (tizado.archivo_tizado) {
          filesToDelete.push(tizado.archivo_tizado);
        }
      });
      
      // Eliminar todos los archivos de R2
      for (const filename of filesToDelete) {
        try {
          await axios.delete(`${API}/files/${filename}`);
        } catch (e) {
          console.log(`Archivo ${filename} no encontrado o ya eliminado`);
        }
      }
      
      // Eliminar la base (y sus fichas/tizados por cascada)
      await axios.delete(`${API}/bases/${itemToDelete.id_base}`);
      toast.success('Base y archivos eliminados');
      fetchBases();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar base';
      toast.error(errorMsg);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleOpenDialog = (base = null) => {
    if (base) {
      setEditingBase(base);
      setFormData({
        id_muestra_base: base.id_muestra_base.toString(),
        modelo: base.modelo || '',
        patron: base.patron || '',
        imagen: base.imagen || '',
        aprobado: base.aprobado,
        id_modelo: base.id_modelo || null,
        id_registro: base.id_registro || null,
      });
      setFichas(base.fichas || []);
    } else {
      setEditingBase(null);
      setFormData({
        id_muestra_base: '',
        modelo: '',
        patron: '',
        imagen: '',
        aprobado: false,
        id_modelo: null,
        id_registro: null,
      });
      setFichas([]);
    }
    fetchRegistrosMiniERP();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBase(null);
    setFichas([]);
  };

  const handleAddFicha = () => {
    setFichas([...fichas, { nombre_ficha: '', archivo: '' }]);
  };

  const handleRemoveFicha = async (index, fichaId) => {
    if (fichaId) {
      // Si tiene ID, eliminarla del backend
      try {
        await axios.delete(`${API}/fichas/${fichaId}`);
        toast.success('Ficha eliminada');
      } catch (error) {
        toast.error('Error al eliminar ficha');
      }
    }
    const newFichas = fichas.filter((_, i) => i !== index);
    setFichas(newFichas);
  };

  const handleFichaChange = (index, field, value) => {
    const newFichas = [...fichas];
    newFichas[index][field] = value;
    setFichas(newFichas);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id_muestra_base',
      header: 'Muestra Base',
      cell: ({ row }) => {
        const muestra = muestras.find(m => m.id_muestra_base === row.original.id_muestra_base);
        if (!muestra) return <span className="text-slate-400">-</span>;
        return (
          <span className="text-sm">
            {muestra.id_muestra_base} - {muestra.marca?.nombre_marca || 'Sin Marca'} - {muestra.tipo_producto?.nombre_tipo} - {muestra.entalle?.nombre_entalle} - {muestra.tela?.nombre_tela}
          </span>
        );
      },
    },
    {
      accessorKey: 'modelo',
      header: 'Modelo',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">
          {row.original.modelo || <span className="text-slate-400 font-normal">-</span>}
        </span>
      ),
    },
    {
      accessorKey: 'patron',
      header: 'Patrón',
      cell: ({ row }) => {
        const archivo = row.original.patron;
        if (!archivo) return <span className="text-slate-400 text-xs">Sin archivo</span>;
        
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
      accessorKey: 'imagen',
      header: 'Imagen',
      cell: ({ row }) => (
        <ImageCell 
          base={row.original} 
          onViewImage={handleViewImage} 
          onUploadImage={handleUploadImageFromTable}
          canUpload={canUpload('imagenes')}
        />
      ),
    },
    {
      id: 'registros_erp',
      header: 'Registros ERP',
      cell: ({ row }) => {
        // El conteo se calcula dinámicamente cuando se abre el modal
        // Por ahora mostramos un botón genérico que indica si hay conexión
        if (!miniERPConnected) {
          return <span className="text-slate-400 text-xs">No conectado</span>;
        }
        
        return (
          <button
            onClick={() => handleViewRegistrosERP(row.original)}
            data-testid={`registros-erp-${row.original.id_base}`}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Ver registros
          </button>
        );
      },
    },
    {
      accessorKey: 'fichas',
      header: 'Fichas',
      cell: ({ row }) => {
        const fichasCount = row.original.fichas?.length || 0;
        return (
          <button
            onClick={() => handleViewFichas(row.original)}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              fichasCount > 0 
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {fichasCount > 0 ? `${fichasCount} ficha${fichasCount > 1 ? 's' : ''}` : '+ Agregar'}
          </button>
        );
      },
    },
    {
      id: 'tizados',
      header: 'Tizados',
      cell: ({ row }) => {
        const tizadosCount = tizados.filter(t => t.id_base === row.original.id_base).length;
        return (
          <button
            onClick={() => handleViewTizados(row.original)}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              tizadosCount > 0 
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tizadosCount > 0 ? `${tizadosCount} tizado${tizadosCount > 1 ? 's' : ''}` : '+ Agregar'}
          </button>
        );
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
          {canEdit('bases') && (
            <Button
              data-testid={`edit-base-${row.original.id_base}`}
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog(row.original)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit size={16} />
            </Button>
          )}
          {canDelete('bases') && (
            <Button
              data-testid={`delete-base-${row.original.id_base}`}
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id_base)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ], [muestras, tizados, miniERPConnected, canCreate, canEdit, canDelete, canUpload, canDownload]);

  return (
    <div>
      {/* Filtros de Aprobación */}
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-sm font-medium text-slate-700">Filtrar por estado:</span>
        <Button
          variant={filtroAprobacion === 'aprobados' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAprobacion('aprobados')}
          className={filtroAprobacion === 'aprobados' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <CheckCircle size={14} className="mr-1" />
          Aprobados ({bases.filter(b => b.aprobado).length})
        </Button>
        <Button
          variant={filtroAprobacion === 'pendientes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAprobacion('pendientes')}
          className={filtroAprobacion === 'pendientes' ? 'bg-slate-600 hover:bg-slate-700' : ''}
        >
          <XCircle size={14} className="mr-1" />
          Pendientes ({bases.filter(b => !b.aprobado).length})
        </Button>
        <Button
          variant={filtroAprobacion === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAprobacion('todos')}
          className={filtroAprobacion === 'todos' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          Todos ({bases.length})
        </Button>
      </div>

      <ExcelGrid
        data={basesFiltradas}
        columns={columns}
        onAdd={canCreate('bases') ? () => handleOpenDialog() : null}
        searchPlaceholder="Buscar por marca, tipo, entalle, tela..."
        globalFilterFn={(row, columnId, filterValue) => {
          // Búsqueda personalizada en múltiples campos de la muestra base
          const searchValue = filterValue.toLowerCase();
          const muestra = muestras.find(m => m.id_muestra_base === row.original.id_muestra_base);
          if (!muestra) return false;
          
          const marca = muestra.marca?.nombre_marca?.toLowerCase() || '';
          const tipo = muestra.tipo_producto?.nombre_tipo?.toLowerCase() || '';
          const tela = muestra.tela?.nombre_tela?.toLowerCase() || '';
          const entalle = muestra.entalle?.nombre_entalle?.toLowerCase() || '';
          const id = row.original.id_base?.toString() || '';
          
          return marca.includes(searchValue) || 
                 tipo.includes(searchValue) || 
                 tela.includes(searchValue) || 
                 entalle.includes(searchValue) ||
                 id.includes(searchValue);
        }}
      />

      {/* Dialog para ver imagen ampliada */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Vista de Imagen</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            {viewingImage && (
              <img 
                src={`${API}/files/${viewingImage}`} 
                alt="Base completa"
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-slate-200"
              />
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="outline"
              onClick={() => handleDownloadFile(viewingImage)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              📥 Descargar
            </Button>
            <Button onClick={() => setImageViewerOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver y crear Fichas */}
      <Dialog open={fichasDialogOpen} onOpenChange={setFichasDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Fichas de Base #{currentBaseForFichas?.id_base}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Formulario para crear nueva ficha - ARRIBA */}
            {!isCreatingFicha ? (
              <Button
                onClick={() => setIsCreatingFicha(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus size={18} className="mr-2" />
                Crear Nueva Ficha
              </Button>
            ) : (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Nueva Ficha</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingFicha(false);
                      setNewFicha({ nombre_ficha: '', archivo: '' });
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-nombre-ficha">Nombre de Ficha</Label>
                  <Input
                    id="new-nombre-ficha"
                    value={newFicha.nombre_ficha}
                    onChange={(e) => setNewFicha({ ...newFicha, nombre_ficha: e.target.value })}
                    placeholder="Ej: Ficha de Medidas, Ficha Técnica"
                    className="border-slate-300 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Archivo</Label>
                  <FileUpload
                    value={newFicha.archivo}
                    onChange={(file) => setNewFicha({ ...newFicha, archivo: file })}
                    accept=".pdf,.xlsx,.doc,.docx"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateFicha}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Guardar Ficha
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingFicha(false);
                      setNewFicha({ nombre_ficha: '', archivo: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Buscador - ABAJO */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Buscar por nombre..."
                value={fichasSearchModal}
                onChange={(e) => setFichasSearchModal(e.target.value)}
                className="pl-9 bg-white border-slate-300"
              />
            </div>

            {/* Tabla de Fichas - ABAJO */}
            {getFichasForModal().length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Nombre de Ficha
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Archivo
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider w-20 whitespace-nowrap">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {getFichasForModal().map((ficha, index) => (
                      <tr key={ficha.id_ficha} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-mono text-slate-600">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {ficha.nombre_ficha || <span className="text-slate-400 italic">Sin nombre</span>}
                        </td>
                        <td className="py-3 px-4">
                          {ficha.archivo ? (
                            <button
                              onClick={() => handleDownloadFile(ficha.archivo)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all hover:shadow-md hover:scale-105 cursor-pointer bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {ficha.archivo.split('.').pop()?.toUpperCase() || 'FILE'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">Sin archivo</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFichaFromModal(ficha)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                {fichasSearchModal ? 'No se encontraron fichas con esa búsqueda' : 'No hay fichas para esta base'}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setFichasDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver y crear Tizados */}
      <Dialog open={tizadosDialogOpen} onOpenChange={setTizadosDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Tizados de Base #{currentBaseForTizados?.id_base}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Formulario para crear nuevo tizado - ARRIBA */}
            {!isCreatingTizado ? (
              <Button
                onClick={() => setIsCreatingTizado(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus size={18} className="mr-2" />
                Crear Nuevo Tizado
              </Button>
            ) : (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Nuevo Tizado</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingTizado(false);
                      setNewTizado({ ancho: '', curva: '', archivo_tizado: '' });
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-ancho">Ancho</Label>
                    <Input
                      id="new-ancho"
                      type="number"
                      step="0.01"
                      value={newTizado.ancho}
                      onChange={(e) => setNewTizado({ ...newTizado, ancho: e.target.value })}
                      placeholder="Ej: 150, 180"
                      className="border-slate-300 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-curva">Curva</Label>
                    <Input
                      id="new-curva"
                      value={newTizado.curva}
                      onChange={(e) => setNewTizado({ ...newTizado, curva: e.target.value })}
                      placeholder="Ej: S-M-L-XL, 2-4-6-8"
                      className="border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Archivo de Tizado</Label>
                  <FileUpload
                    value={newTizado.archivo_tizado}
                    onChange={(file) => setNewTizado({ ...newTizado, archivo_tizado: file })}
                    accept=".pdf,.dxf,.ai,.cdr"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateTizado}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Guardar Tizado
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingTizado(false);
                      setNewTizado({ ancho: '', curva: '', archivo_tizado: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Buscador - ABAJO */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Buscar por ancho o curva..."
                value={tizadosSearchModal}
                onChange={(e) => setTizadosSearchModal(e.target.value)}
                className="pl-9 bg-white border-slate-300"
              />
            </div>

            {/* Tabla de Tizados - ABAJO */}
            {getTizadosForModal().length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase w-16">Orden</th>
                        <th 
                          className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-200 transition-colors"
                          onClick={() => handleOrdenarColumna('id_tizado')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>ID</span>
                            {ordenColumna.columna === 'id_tizado' && (
                              <span>{ordenColumna.direccion === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-200 transition-colors"
                          onClick={() => handleOrdenarColumna('ancho')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Ancho</span>
                            {ordenColumna.columna === 'ancho' && (
                              <span>{ordenColumna.direccion === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-200 transition-colors"
                          onClick={() => handleOrdenarColumna('curva')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Curva</span>
                            {ordenColumna.columna === 'curva' && (
                              <span>{ordenColumna.direccion === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Archivo</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase w-20">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTizadosForModal().map((tizado, index) => (
                        <tr key={tizado.id_tizado} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => handleMoverFila(index, 'arriba')}
                                disabled={index === 0}
                                className={`text-xs ${index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-600 cursor-pointer'}`}
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => handleMoverFila(index, 'abajo')}
                                disabled={index === getTizadosForModal().length - 1}
                                className={`text-xs ${index === getTizadosForModal().length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-600 cursor-pointer'}`}
                              >
                                ▼
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{tizado.id_tizado}</td>
                          <td className="py-3 px-4 font-mono">{tizado.ancho || '-'}</td>
                          <td className="py-3 px-4 text-slate-700">{tizado.curva || '-'}</td>
                          <td className="py-3 px-4">
                            {tizado.archivo_tizado ? (
                              <button
                                onClick={() => handleDownloadFile(tizado.archivo_tizado)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all hover:shadow-md hover:scale-105 cursor-pointer bg-purple-100 text-purple-700 border-purple-200"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {tizado.archivo_tizado.split('.').pop()?.toUpperCase() || 'FILE'}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Sin archivo</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTizadoFromModal(tizado)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                {tizadosSearchModal ? 'No se encontraron tizados con esa búsqueda' : 'No hay tizados para esta base'}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setTizadosDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar Registros ERP vinculados */}
      <Dialog open={registrosERPDialogOpen} onOpenChange={setRegistrosERPDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Registros ERP - Base #{currentBaseForRegistros?.id_base}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {loadingRegistros ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-500">Cargando registros...</p>
              </div>
            ) : (
              <>
                {/* Sección: Registros Vinculados */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Registros Vinculados ({registrosVinculados.length})
                    </h3>
                  </div>
                  
                  {registrosVinculados.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="bg-green-50 border-b border-green-200">
                            <tr>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-green-800 uppercase">ID</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-green-800 uppercase">Modelo</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-green-800 uppercase">N° Corte</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-green-800 uppercase">Estado</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-green-800 uppercase w-20">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {registrosVinculados.map((registro) => (
                              <tr key={registro.id} className="hover:bg-green-50/50 transition-colors">
                                <td className="py-3 px-4 font-mono text-slate-600">#{registro.id}</td>
                                <td className="py-3 px-4 text-slate-900 font-medium">
                                  {registro.modelo_nombre || <span className="text-slate-400 italic">Sin modelo</span>}
                                </td>
                                <td className="py-3 px-4 text-slate-700">{registro.n_corte || '-'}</td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {registro.estado_nombre || 'Sin estado'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDesvincularRegistroModal(registro.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Desvincular registro"
                                  >
                                    <X size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                      No hay registros vinculados a esta base
                    </div>
                  )}
                </div>

                <Separator />

                {/* Sección: Agregar Nuevos Registros */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Plus size={16} className="text-blue-600" />
                      Agregar Registros
                    </h3>
                  </div>
                  
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Buscar por modelo, N° corte o ID..."
                      value={registrosSearchModal}
                      onChange={(e) => {
                        setRegistrosSearchModal(e.target.value);
                        fetchRegistrosDisponibles(e.target.value);
                      }}
                      className="pl-9 bg-white border-slate-300"
                    />
                  </div>

                  {/* Lista de registros disponibles */}
                  {registrosDisponibles.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-64 overflow-y-auto">
                      <table className="w-full min-w-[500px]">
                        <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-4 text-xs font-semibold text-slate-700 uppercase">ID</th>
                            <th className="text-left py-2 px-4 text-xs font-semibold text-slate-700 uppercase">Modelo</th>
                            <th className="text-left py-2 px-4 text-xs font-semibold text-slate-700 uppercase">N° Corte</th>
                            <th className="text-left py-2 px-4 text-xs font-semibold text-slate-700 uppercase w-20">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {registrosDisponibles.map((registro) => (
                            <tr key={registro.id} className="hover:bg-blue-50/50 transition-colors">
                              <td className="py-2 px-4 font-mono text-slate-600 text-sm">#{registro.id}</td>
                              <td className="py-2 px-4 text-slate-900 text-sm">
                                {registro.modelo_nombre || <span className="text-slate-400 italic">Sin modelo</span>}
                              </td>
                              <td className="py-2 px-4 text-slate-700 text-sm">{registro.n_corte || '-'}</td>
                              <td className="py-2 px-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVincularRegistroModal(registro.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                >
                                  <Plus size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                      {registrosSearchModal 
                        ? 'No se encontraron registros con esa búsqueda' 
                        : 'No hay registros disponibles para vincular'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setRegistrosERPDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog principal para crear/editar base */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                          {muestra.id_muestra_base} - {muestra.marca?.nombre_marca || 'Sin Marca'} - {muestra.tipo_producto?.nombre_tipo} - {muestra.tela?.nombre_tela} - {muestra.entalle?.nombre_entalle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo (texto)</Label>
                  <Input
                    id="modelo"
                    data-testid="input-modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ej: MOD-001, POLO-BASIC"
                    className="border-slate-300"
                  />
                </div>
              </div>

              {/* Conexión con Mini-ERP */}
              {miniERPConnected && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800">Conectado a Mini-ERP</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="id_modelo">Modelo (Mini-ERP)</Label>
                      <Select
                        value={formData.id_modelo?.toString() || ''}
                        onValueChange={(value) => {
                          const modelo = modelosMiniERP.find(m => m.id.toString() === value);
                          setFormData({ 
                            ...formData, 
                            id_modelo: value ? parseInt(value) : null,
                            modelo: modelo ? modelo.detalle : formData.modelo
                          });
                        }}
                      >
                        <SelectTrigger data-testid="select-modelo-erp">
                          <SelectValue placeholder="Seleccionar modelo..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <div className="p-2">
                            <Input
                              placeholder="Buscar modelo..."
                              value={searchModelo}
                              onChange={(e) => {
                                setSearchModelo(e.target.value);
                                fetchModelosMiniERP(e.target.value);
                              }}
                              className="mb-2"
                            />
                          </div>
                          {modelosMiniERP.map((modelo) => (
                            <SelectItem key={modelo.id} value={modelo.id.toString()}>
                              {modelo.detalle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="id_registro">Registro (Mini-ERP)</Label>
                      {formData.id_registro ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                            Vinculado: #{formData.id_registro}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, id_registro: null })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={formData.id_registro?.toString() || ''}
                          onValueChange={(value) => setFormData({ ...formData, id_registro: value ? parseInt(value) : null })}
                        >
                          <SelectTrigger data-testid="select-registro-erp">
                            <SelectValue placeholder="Vincular registro..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {registrosMiniERP.map((registro) => (
                              <SelectItem key={registro.id} value={registro.id.toString()}>
                                #{registro.id} - {registro.modelo_nombre || 'Sin modelo'} ({registro.n_corte || 'Sin corte'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="aprobado"
                  data-testid="switch-aprobado-base"
                  checked={formData.aprobado}
                  onCheckedChange={(checked) => setFormData({ ...formData, aprobado: checked })}
                />
                <Label htmlFor="aprobado">Aprobado</Label>
              </div>

              <Separator />

              {/* Tabla de Tizados relacionados */}
              {editingBase && (
                <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-slate-900">Tizados de esta Base</Label>
                    <span className="text-xs text-slate-500">
                      {getTizadosFiltrados().length} tizado(s)
                    </span>
                  </div>
                  
                  {/* Buscador de tizados */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Buscar por ancho o curva..."
                      value={tizadosBusqueda}
                      onChange={(e) => setTizadosBusqueda(e.target.value)}
                      className="pl-9 bg-white border-slate-300 text-sm"
                    />
                  </div>

                  {/* Tabla tipo Excel de Tizados */}
                  {getTizadosFiltrados().length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700 uppercase">ID</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700 uppercase">Ancho</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700 uppercase">Curva</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700 uppercase">Archivo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getTizadosFiltrados().map((tizado, index) => (
                              <tr key={tizado.id_tizado} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-slate-600">{tizado.id_tizado}</td>
                                <td className="py-2 px-3 font-mono">{tizado.ancho || '-'}</td>
                                <td className="py-2 px-3 text-slate-700">{tizado.curva || '-'}</td>
                                <td className="py-2 px-3">
                                  {tizado.archivo_tizado ? (
                                    <button
                                      onClick={() => handleDownloadFile(tizado.archivo_tizado)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-all hover:shadow cursor-pointer bg-purple-100 text-purple-700 border-purple-200"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {tizado.archivo_tizado.split('.').pop()?.toUpperCase() || 'FILE'}
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm bg-white border border-slate-200 rounded-lg">
                      {tizadosBusqueda ? 'No se encontraron tizados con esa búsqueda' : 'No hay tizados para esta base'}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Imagen de la Base</Label>
                <FileUpload
                  value={formData.imagen}
                  onChange={(file) => setFormData({ ...formData, imagen: file })}
                  accept="image/*"
                />
                {formData.imagen && (
                  <div className="mt-2">
                    <img 
                      src={`${API}/files/${formData.imagen}`} 
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Patrón (Archivo)</Label>
                <FileUpload
                  value={formData.patron}
                  onChange={(file) => setFormData({ ...formData, patron: file })}
                  accept=".pdf,.dxf,.ai,.cdr"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Fichas Técnicas (Múltiples archivos)</Label>
                  <Button
                    type="button"
                    onClick={handleAddFicha}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar Ficha
                  </Button>
                </div>

                {fichas.length > 0 ? (
                  <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
                    {fichas.map((ficha, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Ficha #{index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFicha(index, ficha.id_ficha)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre de Ficha</Label>
                          <Input
                            value={ficha.nombre_ficha || ''}
                            onChange={(e) => handleFichaChange(index, 'nombre_ficha', e.target.value)}
                            placeholder="Ej: Ficha de Medidas"
                            className="border-slate-200 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Archivo</Label>
                          {ficha.archivo ? (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(ficha.archivo)}
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                📄 {ficha.archivo.substring(0, 30)}...
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFichaChange(index, 'archivo', '')}
                                className="text-red-600"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <FileUpload
                              value={ficha.archivo}
                              onChange={(file) => handleFichaChange(index, 'archivo', file)}
                              accept=".pdf,.xlsx,.doc,.docx"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-300 rounded-lg">
                    No hay fichas técnicas. Haz clic en "Agregar Ficha" para añadir una.
                  </p>
                )}
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

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              ¿Estás seguro de que deseas eliminar esta base?
              {itemToDelete && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <p><strong>ID:</strong> {itemToDelete.id_base}</p>
                  {itemToDelete.patron && <p><strong>Patrón:</strong> Se eliminará el archivo</p>}
                  {itemToDelete.imagen && <p><strong>Imagen:</strong> Se eliminará el archivo</p>}
                  {itemToDelete.fichas?.length > 0 && (
                    <p><strong>Fichas:</strong> Se eliminarán {itemToDelete.fichas.length} ficha(s) y sus archivos</p>
                  )}
                  {tizados.filter(t => t.id_base === itemToDelete.id_base).length > 0 && (
                    <p><strong>Tizados:</strong> Se eliminarán {tizados.filter(t => t.id_base === itemToDelete.id_base).length} tizado(s) y sus archivos</p>
                  )}
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

      {/* AlertDialog para confirmar eliminación de Ficha */}
      <AlertDialog open={deleteFichaDialogOpen} onOpenChange={setDeleteFichaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Eliminación de Ficha
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              ¿Estás seguro de que deseas eliminar esta ficha?
              {fichaToDelete && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <p><strong>Nombre:</strong> {fichaToDelete.nombre_ficha || 'Sin nombre'}</p>
                  {fichaToDelete.archivo && <p><strong>Archivo:</strong> Se eliminará el archivo</p>}
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
              onClick={confirmDeleteFicha}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para confirmar eliminación de Tizado */}
      <AlertDialog open={deleteTizadoDialogOpen} onOpenChange={setDeleteTizadoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Eliminación de Tizado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              ¿Estás seguro de que deseas eliminar este tizado?
              {tizadoToDelete && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <p><strong>ID:</strong> {tizadoToDelete.id_tizado}</p>
                  {tizadoToDelete.ancho && <p><strong>Ancho:</strong> {tizadoToDelete.ancho}</p>}
                  {tizadoToDelete.curva && <p><strong>Curva:</strong> {tizadoToDelete.curva}</p>}
                  {tizadoToDelete.archivo_tizado && <p><strong>Archivo:</strong> Se eliminará el archivo</p>}
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
              onClick={confirmDeleteTizado}
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

export default Bases;
