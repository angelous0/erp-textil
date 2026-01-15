from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal

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
    patron: Optional[str] = None
    aprobado: Optional[bool] = False

class BaseCreate(BaseBase):
    id_muestra_base: int

class BaseUpdate(BaseModel):
    patron: Optional[str] = None
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