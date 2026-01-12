from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class ColorEnum(str, enum.Enum):
    AZUL = "Azul"
    NEGRO = "Negro"

class Tela(Base):
    __tablename__ = 'tela'
    
    id_tela = Column(Integer, primary_key=True, autoincrement=True)
    nombre_tela = Column(String(255), nullable=False)
    gramaje = Column(Numeric(10, 2))
    elasticidad = Column(String(100))
    proveedor = Column(String(255))
    ancho_estandar = Column(Numeric(10, 2))
    color = Column(Enum(ColorEnum), nullable=True)
    
    muestras_base = relationship('MuestraBase', back_populates='tela')

class Entalle(Base):
    __tablename__ = 'entalle'
    
    id_entalle = Column(Integer, primary_key=True, autoincrement=True)
    nombre_entalle = Column(String(255), nullable=False)
    
    muestras_base = relationship('MuestraBase', back_populates='entalle')

class TipoProducto(Base):
    __tablename__ = 'tipo_producto'
    
    id_tipo = Column(Integer, primary_key=True, autoincrement=True)
    nombre_tipo = Column(String(255), nullable=False)
    
    muestras_base = relationship('MuestraBase', back_populates='tipo_producto')

class MuestraBase(Base):
    __tablename__ = 'muestra_base'
    
    id_muestra_base = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo = Column(Integer, ForeignKey('tipo_producto.id_tipo'), nullable=False)
    id_entalle = Column(Integer, ForeignKey('entalle.id_entalle'), nullable=False)
    id_tela = Column(Integer, ForeignKey('tela.id_tela'), nullable=False)
    consumo_estimado = Column(Numeric(10, 2))
    costo_estimado = Column(Numeric(10, 2))
    archivo_costo = Column(String(500))
    aprobado = Column(Boolean, default=False)
    
    tipo_producto = relationship('TipoProducto', back_populates='muestras_base')
    entalle = relationship('Entalle', back_populates='muestras_base')
    tela = relationship('Tela', back_populates='muestras_base')
    bases = relationship('Base', back_populates='muestra_base', cascade='all, delete-orphan')

class BaseModel(Base):
    __tablename__ = 'base'
    
    id_base = Column(Integer, primary_key=True, autoincrement=True)
    id_muestra_base = Column(Integer, ForeignKey('muestra_base.id_muestra_base'), nullable=False)
    patron = Column(String(500))
    fichas = Column(Text)
    aprobado = Column(Boolean, default=False)
    
    muestra_base = relationship('MuestraBase', back_populates='bases')
    tizados = relationship('Tizado', back_populates='base', cascade='all, delete-orphan')

class Tizado(Base):
    __tablename__ = 'tizado'
    
    id_tizado = Column(Integer, primary_key=True, autoincrement=True)
    id_base = Column(Integer, ForeignKey('base.id_base'), nullable=False)
    archivo_tizado = Column(String(500))
    curva = Column(Text)
    
    base = relationship('Base', back_populates='tizados')