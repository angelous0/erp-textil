from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Request, Query
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
import os
import logging
from pathlib import Path
import shutil
import uuid
import boto3
from botocore.config import Config as BotoConfig
import io
from datetime import timedelta, datetime, timezone

from database import get_db, engine, Base
from models import Tela as TelaModel, Entalle as EntalleModel, TipoProducto as TipoProductoModel, Marca as MarcaModel
from models import MuestraBase as MuestraBaseModel, BaseModel as BaseDBModel, Tizado as TizadoModel, Ficha as FichaModel
from models import Usuario as UsuarioModel, PermisoUsuario as PermisoModel, RolEnum, HistorialMovimiento, AccionEnum
from schemas import (
    Tela, TelaCreate, TelaUpdate,
    Entalle, EntalleCreate, EntalleUpdate,
    TipoProducto, TipoProductoCreate, TipoProductoUpdate,
    Marca, MarcaCreate, MarcaUpdate,
    MuestraBase, MuestraBaseCreate, MuestraBaseUpdate,
    BaseSchema, BaseCreate, BaseUpdate,
    Tizado, TizadoCreate, TizadoUpdate,
    Ficha, FichaCreate, FichaUpdate,
    UsuarioSchema, UsuarioCreate, UsuarioUpdate, UsuarioLogin, Token, PermisoBase,
    HistorialSchema, AccionEnum as AccionEnumSchema
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_user_optional, require_admin, require_super_admin,
    get_user_permissions, create_default_permissions, ACCESS_TOKEN_EXPIRE_MINUTES
)
from audit import audit_create, audit_update, audit_delete, audit_file_action, audit_login, model_to_dict
from mini_erp_sync import (
    get_modelos_mini_erp, get_modelo_by_id, get_registros_mini_erp, 
    get_registro_by_id, sync_base_to_registro, unlink_base_from_registro,
    get_registros_sin_vincular, get_registros_vinculados_a_base, count_registros_vinculados,
    test_connection as test_mini_erp_connection
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', '/app/backend/uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Configuración R2
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")

USE_R2 = R2_ACCOUNT_ID is not None and R2_ACCESS_KEY_ID is not None

# Cliente S3 para R2
s3_client = None
if USE_R2:
    s3_client = boto3.client(
        's3',
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version='s3v4'),
        region_name='auto'
    )
    print("✅ Almacenamiento configurado: CLOUDFLARE R2")
else:
    print("⚠️  Almacenamiento configurado: LOCAL (uploads/)")

@api_router.get("/")
def root():
    return {"message": "ERP Textil API"}

# Helper para obtener IP del cliente
def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    return request.headers.get("User-Agent", "unknown")[:500]

# TELA Endpoints
@api_router.get("/telas", response_model=List[Tela])
def get_telas(db: Session = Depends(get_db)):
    telas = db.query(TelaModel).all()
    return telas

@api_router.get("/telas/{id_tela}", response_model=Tela)
def get_tela(id_tela: int, db: Session = Depends(get_db)):
    tela = db.query(TelaModel).filter(TelaModel.id_tela == id_tela).first()
    if not tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    return tela

@api_router.post("/telas", response_model=Tela)
def create_tela(
    tela: TelaCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tela = TelaModel(**tela.model_dump())
    db.add(db_tela)
    db.commit()
    db.refresh(db_tela)
    
    audit_create(db, current_user, "telas", db_tela, db_tela.id_tela,
                 f"Creó tela: {db_tela.nombre_tela}",
                 get_client_ip(request), get_user_agent(request))
    return db_tela

@api_router.put("/telas/{id_tela}", response_model=Tela)
def update_tela(
    id_tela: int,
    tela: TelaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tela = db.query(TelaModel).filter(TelaModel.id_tela == id_tela).first()
    if not db_tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    
    datos_anteriores = model_to_dict(db_tela)
    
    for key, value in tela.model_dump(exclude_unset=True).items():
        setattr(db_tela, key, value)
    
    db.commit()
    db.refresh(db_tela)
    
    audit_update(db, current_user, "telas", datos_anteriores, db_tela, id_tela,
                 f"Editó tela: {db_tela.nombre_tela}",
                 get_client_ip(request), get_user_agent(request))
    return db_tela

@api_router.delete("/telas/{id_tela}")
def delete_tela(
    id_tela: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tela = db.query(TelaModel).filter(TelaModel.id_tela == id_tela).first()
    if not db_tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    
    nombre_tela = db_tela.nombre_tela
    audit_delete(db, current_user, "telas", db_tela, id_tela,
                 f"Eliminó tela: {nombre_tela}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_tela)
    db.commit()
    return {"message": "Tela eliminada"}

# ENTALLE Endpoints
@api_router.get("/entalles", response_model=List[Entalle])
def get_entalles(db: Session = Depends(get_db)):
    entalles = db.query(EntalleModel).all()
    return entalles

@api_router.get("/entalles/{id_entalle}", response_model=Entalle)
def get_entalle(id_entalle: int, db: Session = Depends(get_db)):
    entalle = db.query(EntalleModel).filter(EntalleModel.id_entalle == id_entalle).first()
    if not entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    return entalle

@api_router.post("/entalles", response_model=Entalle)
def create_entalle(
    entalle: EntalleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_entalle = EntalleModel(**entalle.model_dump())
    db.add(db_entalle)
    db.commit()
    db.refresh(db_entalle)
    
    audit_create(db, current_user, "entalles", db_entalle, db_entalle.id_entalle,
                 f"Creó entalle: {db_entalle.nombre_entalle}",
                 get_client_ip(request), get_user_agent(request))
    return db_entalle

@api_router.put("/entalles/{id_entalle}", response_model=Entalle)
def update_entalle(
    id_entalle: int,
    entalle: EntalleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_entalle = db.query(EntalleModel).filter(EntalleModel.id_entalle == id_entalle).first()
    if not db_entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    
    datos_anteriores = model_to_dict(db_entalle)
    
    for key, value in entalle.model_dump(exclude_unset=True).items():
        setattr(db_entalle, key, value)
    
    db.commit()
    db.refresh(db_entalle)
    
    audit_update(db, current_user, "entalles", datos_anteriores, db_entalle, id_entalle,
                 f"Editó entalle: {db_entalle.nombre_entalle}",
                 get_client_ip(request), get_user_agent(request))
    return db_entalle

@api_router.delete("/entalles/{id_entalle}")
def delete_entalle(
    id_entalle: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_entalle = db.query(EntalleModel).filter(EntalleModel.id_entalle == id_entalle).first()
    if not db_entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    
    nombre = db_entalle.nombre_entalle
    audit_delete(db, current_user, "entalles", db_entalle, id_entalle,
                 f"Eliminó entalle: {nombre}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_entalle)
    db.commit()
    return {"message": "Entalle eliminado"}

# TIPO_PRODUCTO Endpoints
@api_router.get("/tipos-producto", response_model=List[TipoProducto])
def get_tipos_producto(db: Session = Depends(get_db)):
    tipos = db.query(TipoProductoModel).all()
    return tipos

@api_router.get("/tipos-producto/{id_tipo}", response_model=TipoProducto)
def get_tipo_producto(id_tipo: int, db: Session = Depends(get_db)):
    tipo = db.query(TipoProductoModel).filter(TipoProductoModel.id_tipo == id_tipo).first()
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    return tipo

@api_router.post("/tipos-producto", response_model=TipoProducto)
def create_tipo_producto(
    tipo: TipoProductoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tipo = TipoProductoModel(**tipo.model_dump())
    db.add(db_tipo)
    db.commit()
    db.refresh(db_tipo)
    
    audit_create(db, current_user, "tipos_producto", db_tipo, db_tipo.id_tipo,
                 f"Creó tipo de producto: {db_tipo.nombre_tipo}",
                 get_client_ip(request), get_user_agent(request))
    return db_tipo

@api_router.put("/tipos-producto/{id_tipo}", response_model=TipoProducto)
def update_tipo_producto(
    id_tipo: int,
    tipo: TipoProductoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tipo = db.query(TipoProductoModel).filter(TipoProductoModel.id_tipo == id_tipo).first()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    
    datos_anteriores = model_to_dict(db_tipo)
    
    for key, value in tipo.model_dump(exclude_unset=True).items():
        setattr(db_tipo, key, value)
    
    db.commit()
    db.refresh(db_tipo)
    
    audit_update(db, current_user, "tipos_producto", datos_anteriores, db_tipo, id_tipo,
                 f"Editó tipo de producto: {db_tipo.nombre_tipo}",
                 get_client_ip(request), get_user_agent(request))
    return db_tipo

@api_router.delete("/tipos-producto/{id_tipo}")
def delete_tipo_producto(
    id_tipo: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tipo = db.query(TipoProductoModel).filter(TipoProductoModel.id_tipo == id_tipo).first()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    
    nombre = db_tipo.nombre_tipo
    audit_delete(db, current_user, "tipos_producto", db_tipo, id_tipo,
                 f"Eliminó tipo de producto: {nombre}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_tipo)
    db.commit()
    return {"message": "Tipo de producto eliminado"}

# MARCA Endpoints
@api_router.get("/marcas", response_model=List[Marca])
def get_marcas(db: Session = Depends(get_db)):
    marcas = db.query(MarcaModel).all()
    return marcas

@api_router.get("/marcas/{id_marca}", response_model=Marca)
def get_marca(id_marca: int, db: Session = Depends(get_db)):
    marca = db.query(MarcaModel).filter(MarcaModel.id_marca == id_marca).first()
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return marca

@api_router.post("/marcas", response_model=Marca)
def create_marca(
    marca: MarcaCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_marca = MarcaModel(**marca.model_dump())
    db.add(db_marca)
    db.commit()
    db.refresh(db_marca)
    
    audit_create(db, current_user, "marcas", db_marca, db_marca.id_marca,
                 f"Creó marca: {db_marca.nombre_marca}",
                 get_client_ip(request), get_user_agent(request))
    return db_marca

@api_router.put("/marcas/{id_marca}", response_model=Marca)
def update_marca(
    id_marca: int,
    marca: MarcaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_marca = db.query(MarcaModel).filter(MarcaModel.id_marca == id_marca).first()
    if not db_marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    datos_anteriores = model_to_dict(db_marca)
    
    for key, value in marca.model_dump(exclude_unset=True).items():
        setattr(db_marca, key, value)
    
    db.commit()
    db.refresh(db_marca)
    
    audit_update(db, current_user, "marcas", datos_anteriores, db_marca, id_marca,
                 f"Editó marca: {db_marca.nombre_marca}",
                 get_client_ip(request), get_user_agent(request))
    return db_marca

@api_router.delete("/marcas/{id_marca}")
def delete_marca(
    id_marca: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_marca = db.query(MarcaModel).filter(MarcaModel.id_marca == id_marca).first()
    if not db_marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    nombre = db_marca.nombre_marca
    audit_delete(db, current_user, "marcas", db_marca, id_marca,
                 f"Eliminó marca: {nombre}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_marca)
    db.commit()
    return {"message": "Marca eliminada"}


# MUESTRA_BASE Endpoints
@api_router.get("/muestras-base", response_model=List[MuestraBase])
def get_muestras_base(db: Session = Depends(get_db)):
    muestras = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.marca),
        joinedload(MuestraBaseModel.bases).joinedload(BaseDBModel.tizados)
    ).all()
    return muestras

@api_router.get("/muestras-base/{id_muestra_base}", response_model=MuestraBase)
def get_muestra_base(id_muestra_base: int, db: Session = Depends(get_db)):
    muestra = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.marca),
        joinedload(MuestraBaseModel.bases).joinedload(BaseDBModel.tizados)
    ).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    if not muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    return muestra

@api_router.post("/muestras-base", response_model=MuestraBase)
def create_muestra_base(
    muestra: MuestraBaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_muestra = MuestraBaseModel(**muestra.model_dump())
    db.add(db_muestra)
    db.commit()
    db.refresh(db_muestra)
    
    audit_create(db, current_user, "muestras_base", db_muestra, db_muestra.id_muestra_base,
                 f"Creó muestra base ID: {db_muestra.id_muestra_base}",
                 get_client_ip(request), get_user_agent(request))
    
    muestra_result = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.marca),
        joinedload(MuestraBaseModel.bases)
    ).filter(MuestraBaseModel.id_muestra_base == db_muestra.id_muestra_base).first()
    return muestra_result

@api_router.put("/muestras-base/{id_muestra_base}", response_model=MuestraBase)
def update_muestra_base(
    id_muestra_base: int,
    muestra: MuestraBaseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_muestra = db.query(MuestraBaseModel).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    if not db_muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    
    datos_anteriores = model_to_dict(db_muestra)
    
    for key, value in muestra.model_dump(exclude_unset=True).items():
        setattr(db_muestra, key, value)
    
    db.commit()
    
    audit_update(db, current_user, "muestras_base", datos_anteriores, db_muestra, id_muestra_base,
                 f"Editó muestra base ID: {id_muestra_base}",
                 get_client_ip(request), get_user_agent(request))
    
    muestra_result = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.bases)
    ).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    return muestra_result

@api_router.delete("/muestras-base/{id_muestra_base}")
def delete_muestra_base(
    id_muestra_base: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_muestra = db.query(MuestraBaseModel).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    if not db_muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    
    audit_delete(db, current_user, "muestras_base", db_muestra, id_muestra_base,
                 f"Eliminó muestra base ID: {id_muestra_base}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_muestra)
    db.commit()
    return {"message": "Muestra base eliminada"}

# BASE Endpoints
@api_router.get("/bases", response_model=List[BaseSchema])
def get_bases(db: Session = Depends(get_db)):
    bases = db.query(BaseDBModel).options(
        joinedload(BaseDBModel.tizados),
        joinedload(BaseDBModel.fichas)
    ).all()
    return bases

@api_router.get("/bases/{id_base}", response_model=BaseSchema)
def get_base(id_base: int, db: Session = Depends(get_db)):
    base = db.query(BaseDBModel).options(
        joinedload(BaseDBModel.tizados),
        joinedload(BaseDBModel.fichas)
    ).filter(BaseDBModel.id_base == id_base).first()
    if not base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    return base

@api_router.post("/bases", response_model=BaseSchema)
def create_base(
    base: BaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_base = BaseDBModel(**base.model_dump())
    db.add(db_base)
    db.commit()
    db.refresh(db_base)
    
    audit_create(db, current_user, "bases", db_base, db_base.id_base,
                 f"Creó base modelo: {db_base.modelo or 'Sin modelo'}",
                 get_client_ip(request), get_user_agent(request))
    
    base_result = db.query(BaseDBModel).options(
        joinedload(BaseDBModel.tizados),
        joinedload(BaseDBModel.fichas)
    ).filter(BaseDBModel.id_base == db_base.id_base).first()
    return base_result

@api_router.put("/bases/{id_base}", response_model=BaseSchema)
def update_base(
    id_base: int,
    base: BaseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    datos_anteriores = model_to_dict(db_base)
    
    for key, value in base.model_dump(exclude_unset=True).items():
        setattr(db_base, key, value)
    
    db.commit()
    
    audit_update(db, current_user, "bases", datos_anteriores, db_base, id_base,
                 f"Editó base modelo: {db_base.modelo or 'Sin modelo'}",
                 get_client_ip(request), get_user_agent(request))
    
    base_result = db.query(BaseDBModel).options(
        joinedload(BaseDBModel.tizados),
        joinedload(BaseDBModel.fichas)
    ).filter(BaseDBModel.id_base == id_base).first()
    return base_result

@api_router.delete("/bases/{id_base}")
def delete_base(
    id_base: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    modelo = db_base.modelo or 'Sin modelo'
    audit_delete(db, current_user, "bases", db_base, id_base,
                 f"Eliminó base modelo: {modelo}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_base)
    db.commit()
    return {"message": "Base eliminada"}

# TIZADO Endpoints
@api_router.get("/tizados", response_model=List[Tizado])
def get_tizados(db: Session = Depends(get_db)):
    tizados = db.query(TizadoModel).all()
    return tizados

@api_router.get("/tizados/{id_tizado}", response_model=Tizado)
def get_tizado(id_tizado: int, db: Session = Depends(get_db)):
    tizado = db.query(TizadoModel).filter(TizadoModel.id_tizado == id_tizado).first()
    if not tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    return tizado

@api_router.post("/tizados", response_model=Tizado)
def create_tizado(
    tizado: TizadoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tizado = TizadoModel(**tizado.model_dump())
    db.add(db_tizado)
    db.commit()
    db.refresh(db_tizado)
    
    audit_create(db, current_user, "tizados", db_tizado, db_tizado.id_tizado,
                 f"Creó tizado ID: {db_tizado.id_tizado} (ancho: {db_tizado.ancho})",
                 get_client_ip(request), get_user_agent(request))
    return db_tizado

@api_router.put("/tizados/{id_tizado}", response_model=Tizado)
def update_tizado(
    id_tizado: int,
    tizado: TizadoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tizado = db.query(TizadoModel).filter(TizadoModel.id_tizado == id_tizado).first()
    if not db_tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    
    datos_anteriores = model_to_dict(db_tizado)
    
    for key, value in tizado.model_dump(exclude_unset=True).items():
        setattr(db_tizado, key, value)
    
    db.commit()
    db.refresh(db_tizado)
    
    audit_update(db, current_user, "tizados", datos_anteriores, db_tizado, id_tizado,
                 f"Editó tizado ID: {id_tizado}",
                 get_client_ip(request), get_user_agent(request))
    return db_tizado

@api_router.delete("/tizados/{id_tizado}")
def delete_tizado(
    id_tizado: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_tizado = db.query(TizadoModel).filter(TizadoModel.id_tizado == id_tizado).first()
    if not db_tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    
    audit_delete(db, current_user, "tizados", db_tizado, id_tizado,
                 f"Eliminó tizado ID: {id_tizado}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_tizado)
    db.commit()
    return {"message": "Tizado eliminado"}

# FICHA Endpoints
@api_router.get("/fichas", response_model=List[Ficha])
def get_fichas(db: Session = Depends(get_db)):
    fichas = db.query(FichaModel).all()
    return fichas

@api_router.get("/fichas/base/{id_base}", response_model=List[Ficha])
def get_fichas_by_base(id_base: int, db: Session = Depends(get_db)):
    fichas = db.query(FichaModel).filter(FichaModel.id_base == id_base).all()
    return fichas

@api_router.post("/fichas", response_model=Ficha)
def create_ficha(
    ficha: FichaCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_ficha = FichaModel(**ficha.model_dump())
    db.add(db_ficha)
    db.commit()
    db.refresh(db_ficha)
    
    audit_create(db, current_user, "fichas", db_ficha, db_ficha.id_ficha,
                 f"Creó ficha: {db_ficha.nombre_ficha or 'Sin nombre'}",
                 get_client_ip(request), get_user_agent(request))
    return db_ficha

@api_router.put("/fichas/{id_ficha}", response_model=Ficha)
def update_ficha(
    id_ficha: int,
    ficha: FichaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_ficha = db.query(FichaModel).filter(FichaModel.id_ficha == id_ficha).first()
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    
    datos_anteriores = model_to_dict(db_ficha)
    
    for key, value in ficha.model_dump(exclude_unset=True).items():
        setattr(db_ficha, key, value)
    
    db.commit()
    db.refresh(db_ficha)
    
    audit_update(db, current_user, "fichas", datos_anteriores, db_ficha, id_ficha,
                 f"Editó ficha: {db_ficha.nombre_ficha or 'Sin nombre'}",
                 get_client_ip(request), get_user_agent(request))
    return db_ficha

@api_router.delete("/fichas/{id_ficha}")
def delete_ficha(
    id_ficha: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    db_ficha = db.query(FichaModel).filter(FichaModel.id_ficha == id_ficha).first()
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    
    nombre = db_ficha.nombre_ficha or 'Sin nombre'
    audit_delete(db, current_user, "fichas", db_ficha, id_ficha,
                 f"Eliminó ficha: {nombre}",
                 get_client_ip(request), get_user_agent(request))
    
    db.delete(db_ficha)
    db.commit()
    return {"message": "Ficha eliminada"}

# FILE UPLOAD Endpoint
import re
import urllib.parse

def sanitize_filename(filename: str) -> str:
    """Limpia el nombre de archivo para evitar problemas"""
    # Remover caracteres problemáticos pero mantener el nombre legible
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    return filename

def extract_original_name(stored_filename: str) -> str:
    """Extrae el nombre original de un archivo almacenado con formato uuid_nombre.ext"""
    # Formato: uuid_nombreoriginal.ext
    parts = stored_filename.split('_', 1)
    if len(parts) == 2:
        return parts[1]  # Retorna nombreoriginal.ext
    return stored_filename  # Si no tiene el formato esperado, retorna el nombre tal cual

@api_router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    try:
        # Limpiar y preservar el nombre original
        original_name = sanitize_filename(file.filename)
        unique_id = str(uuid.uuid4())[:8]  # Solo 8 caracteres del UUID
        unique_filename = f"{unique_id}_{original_name}"
        
        # Leer contenido del archivo
        file_content = await file.read()
        
        if USE_R2:
            # Subir a Cloudflare R2 usando boto3
            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=unique_filename,
                Body=file_content,
                ContentType=file.content_type or "application/octet-stream"
            )
            print(f"✅ Archivo subido a R2: {unique_filename}")
        else:
            # Guardar localmente
            file_path = UPLOAD_DIR / unique_filename
            with open(file_path, 'wb') as f:
                f.write(file_content)
            print(f"✅ Archivo guardado localmente: {unique_filename}")
        
        # Auditar subida de archivo
        audit_file_action(db, current_user, AccionEnum.subir_archivo, unique_filename,
                         ip_address=get_client_ip(request), user_agent=get_user_agent(request))
        
        return {"filename": unique_filename, "url": f"/api/files/{unique_filename}"}
    except Exception as e:
        print(f"❌ Error en upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# FILE DOWNLOAD Endpoint
@api_router.get("/files/{filename:path}")
async def get_file(filename: str):
    # Extraer nombre original para la descarga
    original_name = extract_original_name(filename)
    # Codificar para el header (soporta caracteres especiales)
    encoded_name = urllib.parse.quote(original_name)
    
    if USE_R2:
        try:
            # Obtener el archivo directamente de R2 y servirlo
            response = s3_client.get_object(
                Bucket=R2_BUCKET_NAME,
                Key=filename
            )
            
            # Obtener el contenido y tipo
            file_content = response['Body'].read()
            content_type = response.get('ContentType', 'application/octet-stream')
            
            # Determinar el content-disposition basado en la extensión
            extension = Path(filename).suffix.lower()
            if extension in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                disposition = 'inline'
            else:
                disposition = 'attachment'
            
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type=content_type,
                headers={
                    'Content-Disposition': f"{disposition}; filename=\"{original_name}\"; filename*=UTF-8''{encoded_name}",
                    'Content-Length': str(len(file_content))
                }
            )
        except s3_client.exceptions.NoSuchKey:
            print(f"⚠️ Archivo no encontrado en R2: {filename}")
            # Fallback a archivo local
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                return FileResponse(file_path, filename=original_name)
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        except Exception as e:
            print(f"⚠️ Error obteniendo de R2: {e}")
            # Fallback a archivo local
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                print(f"⚠️ R2 falló, sirviendo archivo local: {filename}")
                return FileResponse(file_path, filename=original_name)
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
    else:
        # Servir archivo local
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        return FileResponse(file_path, filename=original_name)

# FILE DELETE Endpoint
@api_router.delete("/files/{filename}")
async def delete_file(filename: str):
    try:
        if USE_R2:
            # Eliminar de Cloudflare R2
            s3_client.delete_object(
                Bucket=R2_BUCKET_NAME,
                Key=filename
            )
            print(f"✅ Archivo eliminado de R2: {filename}")
        
        # También eliminar de local si existe (por si hay copia)
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()
            print(f"✅ Archivo local eliminado: {filename}")
        
        return {"message": "Archivo eliminado", "filename": filename}
    except Exception as e:
        print(f"❌ Error eliminando archivo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=Token)
def login(credentials: UsuarioLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(UsuarioModel).filter(UsuarioModel.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos"
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=403,
            detail="Usuario desactivado. Contacta al administrador."
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Registrar login exitoso
    audit_login(db, user, get_client_ip(request), get_user_agent(request), exitoso=True)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": user
    }

@api_router.get("/auth/me", response_model=UsuarioSchema)
def get_me(current_user: UsuarioModel = Depends(get_current_user)):
    return current_user

@api_router.get("/auth/me/permisos")
def get_my_permissions(
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_permissions(current_user, db)

@api_router.put("/auth/me/password")
def change_password(
    old_password: str,
    new_password: str,
    current_user: UsuarioModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"message": "Contraseña actualizada"}

# ==================== USER MANAGEMENT ENDPOINTS ====================

@api_router.get("/usuarios", response_model=List[UsuarioSchema])
def get_usuarios(
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    return db.query(UsuarioModel).options(joinedload(UsuarioModel.permisos)).all()

@api_router.post("/usuarios", response_model=UsuarioSchema)
def create_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    # Verificar username único
    if db.query(UsuarioModel).filter(UsuarioModel.username == usuario.username).first():
        raise HTTPException(status_code=400, detail="El username ya existe")
    
    # Solo super_admin puede crear otros super_admin
    if usuario.rol == RolEnum.super_admin and current_user.rol != RolEnum.super_admin:
        raise HTTPException(status_code=403, detail="Solo un super admin puede crear otros super admins")
    
    db_usuario = UsuarioModel(
        username=usuario.username,
        email=usuario.email,
        password_hash=get_password_hash(usuario.password),
        nombre=usuario.nombre,
        rol=usuario.rol
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    
    # Crear permisos por defecto si es editor o viewer
    if usuario.rol in [RolEnum.editor, RolEnum.viewer]:
        create_default_permissions(db_usuario.id_usuario, usuario.rol, db)
    
    db.refresh(db_usuario)
    return db_usuario

@api_router.get("/usuarios/{id_usuario}", response_model=UsuarioSchema)
def get_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    usuario = db.query(UsuarioModel).options(joinedload(UsuarioModel.permisos)).filter(
        UsuarioModel.id_usuario == id_usuario
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@api_router.put("/usuarios/{id_usuario}", response_model=UsuarioSchema)
def update_usuario(
    id_usuario: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Solo super_admin puede modificar otros super_admin
    if usuario.rol == RolEnum.super_admin and current_user.rol != RolEnum.super_admin:
        raise HTTPException(status_code=403, detail="Solo un super admin puede modificar otros super admins")
    
    # Solo super_admin puede promover a super_admin
    if usuario_update.rol == RolEnum.super_admin and current_user.rol != RolEnum.super_admin:
        raise HTTPException(status_code=403, detail="Solo un super admin puede promover a super admin")
    
    update_data = usuario_update.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        del update_data["password"]
    
    for key, value in update_data.items():
        setattr(usuario, key, value)
    
    db.commit()
    db.refresh(usuario)
    return usuario

@api_router.delete("/usuarios/{id_usuario}")
def delete_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No se puede eliminar a sí mismo
    if usuario.id_usuario == current_user.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    
    # Solo super_admin puede eliminar otros super_admin
    if usuario.rol == RolEnum.super_admin and current_user.rol != RolEnum.super_admin:
        raise HTTPException(status_code=403, detail="Solo un super admin puede eliminar otros super admins")
    
    db.delete(usuario)
    db.commit()
    return {"message": "Usuario eliminado"}

@api_router.put("/usuarios/{id_usuario}/permisos")
def update_usuario_permisos(
    id_usuario: int,
    permisos: PermisoBase,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No se pueden modificar permisos de admins
    if usuario.rol in [RolEnum.super_admin, RolEnum.admin]:
        raise HTTPException(status_code=400, detail="Los administradores tienen todos los permisos")
    
    # Buscar o crear permisos
    permiso = db.query(PermisoModel).filter(PermisoModel.id_usuario == id_usuario).first()
    
    if not permiso:
        permiso = PermisoModel(id_usuario=id_usuario)
        db.add(permiso)
    
    # Actualizar permisos
    for key, value in permisos.model_dump().items():
        setattr(permiso, key, value)
    
    db.commit()
    db.refresh(permiso)
    return {"message": "Permisos actualizados", "permisos": permisos}

@api_router.get("/usuarios/{id_usuario}/permisos")
def get_usuario_permisos(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return get_user_permissions(usuario, db)

# ==================== HISTORIAL / AUDITORÍA ENDPOINTS ====================

@api_router.get("/historial", response_model=List[HistorialSchema])
def get_historial(
    usuario: Optional[str] = Query(None, description="Filtrar por username"),
    tabla: Optional[str] = Query(None, description="Filtrar por tabla"),
    accion: Optional[str] = Query(None, description="Filtrar por acción"),
    fecha_desde: Optional[str] = Query(None, description="Fecha desde (ISO format)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha hasta (ISO format)"),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(50, ge=1, le=200, description="Tamaño de página"),
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    """Obtiene el historial de movimientos con filtros opcionales"""
    query = db.query(HistorialMovimiento)
    
    # Aplicar filtros
    if usuario:
        query = query.filter(HistorialMovimiento.username.ilike(f"%{usuario}%"))
    if tabla:
        query = query.filter(HistorialMovimiento.tabla == tabla)
    if accion:
        query = query.filter(HistorialMovimiento.accion == accion)
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
            query = query.filter(HistorialMovimiento.fecha_hora >= fecha_desde_dt)
        except ValueError:
            pass
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
            query = query.filter(HistorialMovimiento.fecha_hora <= fecha_hasta_dt)
        except ValueError:
            pass
    
    # Ordenar por fecha descendente y paginar
    total = query.count()
    movimientos = query.order_by(desc(HistorialMovimiento.fecha_hora))\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return movimientos

@api_router.get("/historial/stats")
def get_historial_stats(
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    """Obtiene estadísticas del historial"""
    from sqlalchemy import func
    
    # Total de movimientos
    total = db.query(HistorialMovimiento).count()
    
    # Movimientos por tabla
    por_tabla = db.query(
        HistorialMovimiento.tabla,
        func.count(HistorialMovimiento.id_movimiento).label('count')
    ).group_by(HistorialMovimiento.tabla).all()
    
    # Movimientos por acción
    por_accion = db.query(
        HistorialMovimiento.accion,
        func.count(HistorialMovimiento.id_movimiento).label('count')
    ).group_by(HistorialMovimiento.accion).all()
    
    # Movimientos por usuario (top 10)
    por_usuario = db.query(
        HistorialMovimiento.username,
        func.count(HistorialMovimiento.id_movimiento).label('count')
    ).group_by(HistorialMovimiento.username)\
     .order_by(desc('count'))\
     .limit(10).all()
    
    # Últimos 7 días
    hace_7_dias = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    hace_7_dias = hace_7_dias.replace(day=hace_7_dias.day - 7)
    ultimos_7_dias = db.query(HistorialMovimiento)\
        .filter(HistorialMovimiento.fecha_hora >= hace_7_dias)\
        .count()
    
    return {
        "total": total,
        "ultimos_7_dias": ultimos_7_dias,
        "por_tabla": {t: c for t, c in por_tabla},
        "por_accion": {str(a.value) if hasattr(a, 'value') else str(a): c for a, c in por_accion},
        "por_usuario": {u: c for u, c in por_usuario}
    }

@api_router.get("/historial/tablas")
def get_historial_tablas(
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    """Obtiene las tablas disponibles en el historial"""
    tablas = db.query(HistorialMovimiento.tabla)\
        .distinct()\
        .all()
    return [t[0] for t in tablas]

@api_router.get("/historial/{id_movimiento}", response_model=HistorialSchema)
def get_movimiento(
    id_movimiento: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(require_admin)
):
    """Obtiene un movimiento específico con todos sus detalles"""
    movimiento = db.query(HistorialMovimiento)\
        .filter(HistorialMovimiento.id_movimiento == id_movimiento)\
        .first()
    
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    return movimiento

# ==================== MINI-ERP SYNC ENDPOINTS ====================

@api_router.get("/mini-erp/status")
def mini_erp_status(current_user: UsuarioModel = Depends(get_current_user)):
    """Verifica el estado de conexión con el mini-ERP"""
    connected = test_mini_erp_connection()
    return {"connected": connected, "message": "Conexión exitosa" if connected else "No se puede conectar"}

@api_router.get("/mini-erp/modelos")
def get_modelos(
    search: Optional[str] = Query(None, description="Buscar por nombre"),
    limit: int = Query(100, le=500),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Obtiene la lista de modelos del mini-ERP"""
    try:
        modelos = get_modelos_mini_erp(search=search, limit=limit)
        return modelos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conectando al mini-ERP: {str(e)}")

@api_router.get("/mini-erp/modelos/{id_modelo}")
def get_modelo(
    id_modelo: int,
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Obtiene un modelo específico del mini-ERP"""
    modelo = get_modelo_by_id(id_modelo)
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    return modelo

@api_router.get("/mini-erp/registros")
def get_registros(
    search: Optional[str] = Query(None, description="Buscar por modelo o n_corte"),
    limit: int = Query(100, le=500),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Obtiene la lista de registros del mini-ERP"""
    try:
        registros = get_registros_mini_erp(search=search, limit=limit)
        return registros
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conectando al mini-ERP: {str(e)}")

@api_router.get("/mini-erp/registros/sin-vincular")
def get_registros_disponibles(
    search: Optional[str] = Query(None, description="Buscar por modelo, n_corte o ID"),
    limit: int = Query(50, le=200),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Obtiene registros del mini-ERP que no están vinculados a ninguna base"""
    try:
        registros = get_registros_sin_vincular(limit=limit, search=search)
        return registros
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conectando al mini-ERP: {str(e)}")

@api_router.get("/mini-erp/registros/vinculados/{id_base}")
def get_registros_de_base(
    id_base: int,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Obtiene todos los registros del mini-ERP vinculados a una base específica"""
    # Verificar que la base existe
    base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
    if not base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    try:
        registros = get_registros_vinculados_a_base(id_base)
        return registros
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conectando al mini-ERP: {str(e)}")

@api_router.get("/mini-erp/registros/{id_registro}")
def get_registro(
    id_registro: int,
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Obtiene un registro específico del mini-ERP"""
    registro = get_registro_by_id(id_registro)
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return registro

@api_router.post("/mini-erp/sync/vincular")
def vincular_base_registro(
    id_base: int,
    id_registro: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Vincula una base del ERP Muestras con un registro del mini-ERP"""
    # Verificar que la base existe
    base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
    if not base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    # Verificar que el registro existe en mini-ERP
    registro = get_registro_by_id(id_registro)
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado en mini-ERP")
    
    # Actualizar x_base con id_registro e id_modelo
    datos_anteriores = model_to_dict(base)
    base.id_registro = id_registro
    base.id_modelo = registro.get('id_modelo')
    
    # Sincronizar al mini-ERP (actualizar x_id_base en registro)
    sync_base_to_registro(id_base, id_registro, aprobado=base.aprobado)
    
    db.commit()
    db.refresh(base)
    
    # Auditar la vinculación
    audit_update(db, current_user, "bases", datos_anteriores, base, id_base,
                 f"Vinculó base {id_base} con registro {id_registro} del mini-ERP",
                 get_client_ip(request), get_user_agent(request))
    
    return {"message": "Vinculación exitosa", "id_base": id_base, "id_registro": id_registro}

@api_router.post("/mini-erp/sync/desvincular/{id_base}")
def desvincular_base(
    id_base: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UsuarioModel = Depends(get_current_user)
):
    """Desvincula una base del mini-ERP"""
    base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
    if not base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    if not base.id_registro:
        raise HTTPException(status_code=400, detail="Esta base no está vinculada a ningún registro")
    
    # Desvincular en mini-ERP
    id_registro_anterior = base.id_registro
    unlink_base_from_registro(base.id_registro)
    
    # Actualizar base
    datos_anteriores = model_to_dict(base)
    base.id_registro = None
    base.id_modelo = None
    
    db.commit()
    
    # Auditar
    audit_update(db, current_user, "bases", datos_anteriores, base, id_base,
                 f"Desvinculó base {id_base} del registro {id_registro_anterior}",
                 get_client_ip(request), get_user_agent(request))
    
    return {"message": "Desvinculación exitosa"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
def startup():
    # Las tablas son creadas manualmente por el usuario
    # Base.metadata.create_all(bind=engine)
    logger.info("Sistema iniciado - conexión a base de datos establecida")

@app.on_event("shutdown")
def shutdown():
    engine.dispose()
    logger.info("Database connection closed")
