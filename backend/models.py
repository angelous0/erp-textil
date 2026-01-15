from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Text, Enum, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class RolEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    editor = "editor"
    viewer = "viewer"

class Usuario(Base):
    __tablename__ = 'x_usuario'
    
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(255), nullable=False)
    rol = Column(Enum(RolEnum), default=RolEnum.viewer)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    permisos = relationship('PermisoUsuario', back_populates='usuario', cascade='all, delete-orphan')

class PermisoUsuario(Base):
    __tablename__ = 'x_permiso_usuario'
    
    id_permiso = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('x_usuario.id_usuario'), nullable=False)
    
    # Permisos por módulo - CRUD
    marcas_ver = Column(Boolean, default=True)
    marcas_crear = Column(Boolean, default=False)
    marcas_editar = Column(Boolean, default=False)
    marcas_eliminar = Column(Boolean, default=False)
    
    tipos_ver = Column(Boolean, default=True)
    tipos_crear = Column(Boolean, default=False)
    tipos_editar = Column(Boolean, default=False)
    tipos_eliminar = Column(Boolean, default=False)
    
    entalles_ver = Column(Boolean, default=True)
    entalles_crear = Column(Boolean, default=False)
    entalles_editar = Column(Boolean, default=False)
    entalles_eliminar = Column(Boolean, default=False)
    
    telas_ver = Column(Boolean, default=True)
    telas_crear = Column(Boolean, default=False)
    telas_editar = Column(Boolean, default=False)
    telas_eliminar = Column(Boolean, default=False)
    
    muestras_ver = Column(Boolean, default=True)
    muestras_crear = Column(Boolean, default=False)
    muestras_editar = Column(Boolean, default=False)
    muestras_eliminar = Column(Boolean, default=False)
    
    bases_ver = Column(Boolean, default=True)
    bases_crear = Column(Boolean, default=False)
    bases_editar = Column(Boolean, default=False)
    bases_eliminar = Column(Boolean, default=False)
    
    tizados_ver = Column(Boolean, default=True)
    tizados_crear = Column(Boolean, default=False)
    tizados_editar = Column(Boolean, default=False)
    tizados_eliminar = Column(Boolean, default=False)
    
    # Permisos de descarga de archivos
    descargar_patrones = Column(Boolean, default=False)
    descargar_tizados = Column(Boolean, default=False)
    descargar_fichas = Column(Boolean, default=False)
    descargar_imagenes = Column(Boolean, default=True)
    descargar_costos = Column(Boolean, default=False)
    
    # Permisos de subida de archivos (separado de descarga)
    subir_patrones = Column(Boolean, default=True)
    subir_tizados = Column(Boolean, default=True)
    subir_fichas = Column(Boolean, default=True)
    subir_imagenes = Column(Boolean, default=True)
    subir_costos = Column(Boolean, default=True)
    
    usuario = relationship('Usuario', back_populates='permisos')

class ColorEnum(str, enum.Enum):
    Azul = "Azul"
    Negro = "Negro"

class Tela(Base):
    __tablename__ = 'x_tela_desarrollo'
    
    id_tela = Column(Integer, primary_key=True, autoincrement=True)
    nombre_tela = Column(String(255), nullable=False)
    gramaje = Column(Numeric(10, 2))
    elasticidad = Column(String(100))
    proveedor = Column(String(255))
    ancho_estandar = Column(Numeric(10, 2))
    color = Column(Enum(ColorEnum), nullable=True)
    clasificacion = Column(String(255))
    precio = Column(Numeric(10, 2))
    
    muestras_base = relationship('MuestraBase', back_populates='tela')

class Marca(Base):
    __tablename__ = 'x_marca'
    
    id_marca = Column(Integer, primary_key=True, autoincrement=True)
    nombre_marca = Column(String(255), nullable=False)
    
    muestras_base = relationship('MuestraBase', back_populates='marca')

class Entalle(Base):
    __tablename__ = 'x_entalle_desarrollo'
    
    id_entalle = Column(Integer, primary_key=True, autoincrement=True)
    nombre_entalle = Column(String(255), nullable=False)
    
    muestras_base = relationship('MuestraBase', back_populates='entalle')

class TipoProducto(Base):
    __tablename__ = 'tipo_producto'
    
    id_tipo = Column(Integer, primary_key=True, autoincrement=True)
    nombre_tipo = Column(String(255), nullable=False)
    
    muestras_base = relationship('MuestraBase', back_populates='tipo_producto')

class MuestraBase(Base):
    __tablename__ = 'x_muestra_base'
    
    id_muestra_base = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo = Column(Integer, ForeignKey('tipo_producto.id_tipo'), nullable=False)
    id_entalle = Column(Integer, ForeignKey('x_entalle_desarrollo.id_entalle'), nullable=False)
    id_tela = Column(Integer, ForeignKey('x_tela_desarrollo.id_tela'), nullable=False)
    id_marca = Column(Integer, ForeignKey('x_marca.id_marca'))
    consumo_estimado = Column(Numeric(10, 2))
    costo_estimado = Column(Numeric(10, 2))
    precio_estimado = Column(Numeric(10, 2))
    archivo_costo = Column(String(500))
    aprobado = Column(Boolean, default=False)
    
    tipo_producto = relationship('TipoProducto', back_populates='muestras_base')
    entalle = relationship('Entalle', back_populates='muestras_base')
    tela = relationship('Tela', back_populates='muestras_base')
    marca = relationship('Marca', back_populates='muestras_base')
    bases = relationship('BaseModel', back_populates='muestra_base', cascade='all, delete-orphan')

class BaseModel(Base):
    __tablename__ = 'x_base'
    
    id_base = Column(Integer, primary_key=True, autoincrement=True)
    id_muestra_base = Column(Integer, ForeignKey('x_muestra_base.id_muestra_base'), nullable=False)
    modelo = Column(String(255))
    patron = Column(String(500))
    imagen = Column(String(500))
    aprobado = Column(Boolean, default=False)
    
    muestra_base = relationship('MuestraBase', back_populates='bases')
    tizados = relationship('Tizado', back_populates='base', cascade='all, delete-orphan')
    fichas = relationship('Ficha', back_populates='base', cascade='all, delete-orphan')

class Ficha(Base):
    __tablename__ = 'x_ficha'
    
    id_ficha = Column(Integer, primary_key=True, autoincrement=True)
    id_base = Column(Integer, ForeignKey('x_base.id_base'), nullable=False)
    nombre_ficha = Column(String(255))
    archivo = Column(String(500))
    
    base = relationship('BaseModel', back_populates='fichas')

class Tizado(Base):
    __tablename__ = 'x_tizado'
    
    id_tizado = Column(Integer, primary_key=True, autoincrement=True)
    id_base = Column(Integer, ForeignKey('x_base.id_base'), nullable=False)
    ancho = Column(Numeric(10, 2))
    archivo_tizado = Column(String(500))
    curva = Column(Text)
    
    base = relationship('BaseModel', back_populates='tizados')