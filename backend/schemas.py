from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime
from enum import Enum

# ==================== AUTH SCHEMAS ====================

class RolEnum(str, Enum):
    super_admin = "super_admin"
    admin = "admin"
    editor = "editor"
    viewer = "viewer"

class AccionEnum(str, Enum):
    crear = "crear"
    editar = "editar"
    eliminar = "eliminar"
    subir_archivo = "subir_archivo"
    descargar_archivo = "descargar_archivo"
    eliminar_archivo = "eliminar_archivo"
    login = "login"
    logout = "logout"

# ==================== HISTORIAL SCHEMAS ====================

class HistorialBase(BaseModel):
    tabla: str
    accion: AccionEnum
    id_registro: Optional[int] = None
    descripcion: Optional[str] = None
    datos_anteriores: Optional[dict] = None
    datos_nuevos: Optional[dict] = None

class HistorialSchema(HistorialBase):
    model_config = ConfigDict(from_attributes=True)
    id_movimiento: int
    id_usuario: Optional[int] = None
    username: str
    fecha_hora: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class HistorialFilter(BaseModel):
    usuario: Optional[str] = None
    tabla: Optional[str] = None
    accion: Optional[AccionEnum] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None
    page: int = 1
    page_size: int = 50

class PermisoBase(BaseModel):
    marcas_ver: bool = True
    marcas_crear: bool = False
    marcas_editar: bool = False
    marcas_eliminar: bool = False
    
    tipos_ver: bool = True
    tipos_crear: bool = False
    tipos_editar: bool = False
    tipos_eliminar: bool = False
    
    entalles_ver: bool = True
    entalles_crear: bool = False
    entalles_editar: bool = False
    entalles_eliminar: bool = False
    
    telas_ver: bool = True
    telas_crear: bool = False
    telas_editar: bool = False
    telas_eliminar: bool = False
    
    muestras_ver: bool = True
    muestras_crear: bool = False
    muestras_editar: bool = False
    muestras_eliminar: bool = False
    
    bases_ver: bool = True
    bases_crear: bool = False
    bases_editar: bool = False
    bases_eliminar: bool = False
    
    tizados_ver: bool = True
    tizados_crear: bool = False
    tizados_editar: bool = False
    tizados_eliminar: bool = False
    
    descargar_patrones: bool = False
    descargar_tizados: bool = False
    descargar_fichas: bool = False
    descargar_imagenes: bool = True
    descargar_costos: bool = False
    
    # Permisos de subida (separado de descarga)
    subir_patrones: bool = True
    subir_tizados: bool = True
    subir_fichas: bool = True
    subir_imagenes: bool = True
    subir_costos: bool = True

class PermisoSchema(PermisoBase):
    model_config = ConfigDict(from_attributes=True)
    id_permiso: int
    id_usuario: int

class UsuarioBase(BaseModel):
    username: str
    email: str
    nombre: str
    rol: RolEnum = RolEnum.viewer

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    email: Optional[str] = None
    nombre: Optional[str] = None
    rol: Optional[RolEnum] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UsuarioSchema(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)
    id_usuario: int
    activo: bool
    created_at: datetime
    permisos: List[PermisoSchema] = []

class UsuarioLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioSchema

class TokenData(BaseModel):
    username: Optional[str] = None

# ==================== EXISTING SCHEMAS ====================

class TelaBase(BaseModel):
    nombre_tela: str
    gramaje: Optional[Decimal] = None
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho_estandar: Optional[Decimal] = None
    color: Optional[str] = None
    clasificacion: Optional[str] = None
    precio: Optional[Decimal] = None

class TelaCreate(TelaBase):
    pass

class TelaUpdate(BaseModel):
    nombre_tela: Optional[str] = None
    gramaje: Optional[Decimal] = None
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho_estandar: Optional[Decimal] = None
    color: Optional[str] = None
    clasificacion: Optional[str] = None
    precio: Optional[Decimal] = None

class Tela(TelaBase):
    model_config = ConfigDict(from_attributes=True)
    id_tela: int

class MarcaBase(BaseModel):
    nombre_marca: str

class MarcaCreate(MarcaBase):
    pass

class MarcaUpdate(BaseModel):
    nombre_marca: Optional[str] = None

class Marca(MarcaBase):
    model_config = ConfigDict(from_attributes=True)
    id_marca: int

class EntalleBase(BaseModel):
    nombre_entalle: str

class EntalleCreate(EntalleBase):
    pass

class EntalleUpdate(BaseModel):
    nombre_entalle: Optional[str] = None

class Entalle(EntalleBase):
    model_config = ConfigDict(from_attributes=True)
    id_entalle: int

class TipoProductoBase(BaseModel):
    nombre_tipo: str

class TipoProductoCreate(TipoProductoBase):
    pass

class TipoProductoUpdate(BaseModel):
    nombre_tipo: Optional[str] = None

class TipoProducto(TipoProductoBase):
    model_config = ConfigDict(from_attributes=True)
    id_tipo: int

class TizadoBase(BaseModel):
    ancho: Optional[Decimal] = None
    archivo_tizado: Optional[str] = None
    curva: Optional[str] = None

class TizadoCreate(TizadoBase):
    id_base: int

class TizadoUpdate(BaseModel):
    ancho: Optional[Decimal] = None
    archivo_tizado: Optional[str] = None
    curva: Optional[str] = None

class Tizado(TizadoBase):
    model_config = ConfigDict(from_attributes=True)
    id_tizado: int
    id_base: int

class FichaBase(BaseModel):
    nombre_ficha: Optional[str] = None
    archivo: Optional[str] = None

class FichaCreate(FichaBase):
    id_base: int

class FichaUpdate(BaseModel):
    nombre_ficha: Optional[str] = None
    archivo: Optional[str] = None

class Ficha(FichaBase):
    model_config = ConfigDict(from_attributes=True)
    id_ficha: int
    id_base: int

class BaseBase(BaseModel):
    modelo: Optional[str] = None
    patron: Optional[str] = None
    imagen: Optional[str] = None
    aprobado: Optional[bool] = False

class BaseCreate(BaseBase):
    id_muestra_base: int

class BaseUpdate(BaseModel):
    modelo: Optional[str] = None
    patron: Optional[str] = None
    imagen: Optional[str] = None
    aprobado: Optional[bool] = None

class BaseSchema(BaseBase):
    model_config = ConfigDict(from_attributes=True)
    id_base: int
    id_muestra_base: int
    tizados: List[Tizado] = []
    fichas: List[Ficha] = []

class MuestraBaseBase(BaseModel):
    id_tipo: int
    id_entalle: int
    id_tela: int
    id_marca: Optional[int] = None
    consumo_estimado: Optional[Decimal] = None
    costo_estimado: Optional[Decimal] = None
    precio_estimado: Optional[Decimal] = None
    archivo_costo: Optional[str] = None
    aprobado: Optional[bool] = False

class MuestraBaseCreate(MuestraBaseBase):
    pass

class MuestraBaseUpdate(BaseModel):
    id_tipo: Optional[int] = None
    id_entalle: Optional[int] = None
    id_tela: Optional[int] = None
    id_marca: Optional[int] = None
    consumo_estimado: Optional[Decimal] = None
    costo_estimado: Optional[Decimal] = None
    precio_estimado: Optional[Decimal] = None
    archivo_costo: Optional[str] = None
    aprobado: Optional[bool] = None

class MuestraBase(MuestraBaseBase):
    model_config = ConfigDict(from_attributes=True)
    id_muestra_base: int
    tipo_producto: Optional[TipoProducto] = None
    entalle: Optional[Entalle] = None
    tela: Optional[Tela] = None
    marca: Optional[Marca] = None
    bases: List[BaseSchema] = []