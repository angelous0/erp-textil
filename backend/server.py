from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List
import os
import logging
from pathlib import Path
import shutil
import uuid

from database import get_db, engine, Base
from models import Tela as TelaModel, Entalle as EntalleModel, TipoProducto as TipoProductoModel
from models import MuestraBase as MuestraBaseModel, BaseModel as BaseDBModel, Tizado as TizadoModel
from schemas import (
    Tela, TelaCreate, TelaUpdate,
    Entalle, EntalleCreate, EntalleUpdate,
    TipoProducto, TipoProductoCreate, TipoProductoUpdate,
    MuestraBase, MuestraBaseCreate, MuestraBaseUpdate,
    BaseSchema, BaseCreate, BaseUpdate,
    Tizado, TizadoCreate, TizadoUpdate
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', '/app/backend/uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@api_router.get("/")
def root():
    return {"message": "ERP Textil API"}

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
def create_tela(tela: TelaCreate, db: Session = Depends(get_db)):
    db_tela = TelaModel(**tela.model_dump())
    db.add(db_tela)
    db.commit()
    db.refresh(db_tela)
    return db_tela

@api_router.put("/telas/{id_tela}", response_model=Tela)
def update_tela(id_tela: int, tela: TelaUpdate, db: Session = Depends(get_db)):
    db_tela = db.query(TelaModel).filter(TelaModel.id_tela == id_tela).first()
    if not db_tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    
    for key, value in tela.model_dump(exclude_unset=True).items():
        setattr(db_tela, key, value)
    
    db.commit()
    db.refresh(db_tela)
    return db_tela

@api_router.delete("/telas/{id_tela}")
def delete_tela(id_tela: int, db: Session = Depends(get_db)):
    db_tela = db.query(TelaModel).filter(TelaModel.id_tela == id_tela).first()
    if not db_tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    
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
def create_entalle(entalle: EntalleCreate, db: Session = Depends(get_db)):
    db_entalle = EntalleModel(**entalle.model_dump())
    db.add(db_entalle)
    db.commit()
    db.refresh(db_entalle)
    return db_entalle

@api_router.put("/entalles/{id_entalle}", response_model=Entalle)
def update_entalle(id_entalle: int, entalle: EntalleUpdate, db: Session = Depends(get_db)):
    db_entalle = db.query(EntalleModel).filter(EntalleModel.id_entalle == id_entalle).first()
    if not db_entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    
    for key, value in entalle.model_dump(exclude_unset=True).items():
        setattr(db_entalle, key, value)
    
    db.commit()
    db.refresh(db_entalle)
    return db_entalle

@api_router.delete("/entalles/{id_entalle}")
def delete_entalle(id_entalle: int, db: Session = Depends(get_db)):
    db_entalle = db.query(EntalleModel).filter(EntalleModel.id_entalle == id_entalle).first()
    if not db_entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    
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
def create_tipo_producto(tipo: TipoProductoCreate, db: Session = Depends(get_db)):
    db_tipo = TipoProductoModel(**tipo.model_dump())
    db.add(db_tipo)
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

@api_router.put("/tipos-producto/{id_tipo}", response_model=TipoProducto)
def update_tipo_producto(id_tipo: int, tipo: TipoProductoUpdate, db: Session = Depends(get_db)):
    db_tipo = db.query(TipoProductoModel).filter(TipoProductoModel.id_tipo == id_tipo).first()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    
    for key, value in tipo.model_dump(exclude_unset=True).items():
        setattr(db_tipo, key, value)
    
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

@api_router.delete("/tipos-producto/{id_tipo}")
def delete_tipo_producto(id_tipo: int, db: Session = Depends(get_db)):
    db_tipo = db.query(TipoProductoModel).filter(TipoProductoModel.id_tipo == id_tipo).first()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    
    db.delete(db_tipo)
    db.commit()
    return {"message": "Tipo de producto eliminado"}

# MUESTRA_BASE Endpoints
@api_router.get("/muestras-base", response_model=List[MuestraBase])
def get_muestras_base(db: Session = Depends(get_db)):
    muestras = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.bases).joinedload(BaseDBModel.tizados)
    ).all()
    return muestras

@api_router.get("/muestras-base/{id_muestra_base}", response_model=MuestraBase)
def get_muestra_base(id_muestra_base: int, db: Session = Depends(get_db)):
    muestra = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.bases).joinedload(BaseDBModel.tizados)
    ).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    if not muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    return muestra

@api_router.post("/muestras-base", response_model=MuestraBase)
def create_muestra_base(muestra: MuestraBaseCreate, db: Session = Depends(get_db)):
    db_muestra = MuestraBaseModel(**muestra.model_dump())
    db.add(db_muestra)
    db.commit()
    db.refresh(db_muestra)
    
    muestra_result = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.bases)
    ).filter(MuestraBaseModel.id_muestra_base == db_muestra.id_muestra_base).first()
    return muestra_result

@api_router.put("/muestras-base/{id_muestra_base}", response_model=MuestraBase)
def update_muestra_base(id_muestra_base: int, muestra: MuestraBaseUpdate, db: Session = Depends(get_db)):
    db_muestra = db.query(MuestraBaseModel).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    if not db_muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    
    for key, value in muestra.model_dump(exclude_unset=True).items():
        setattr(db_muestra, key, value)
    
    db.commit()
    
    muestra_result = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.bases)
    ).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    return muestra_result

@api_router.delete("/muestras-base/{id_muestra_base}")
def delete_muestra_base(id_muestra_base: int, db: Session = Depends(get_db)):
    db_muestra = db.query(MuestraBaseModel).filter(MuestraBaseModel.id_muestra_base == id_muestra_base).first()
    if not db_muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    
    db.delete(db_muestra)
    db.commit()
    return {"message": "Muestra base eliminada"}

# BASE Endpoints
@api_router.get("/bases", response_model=List[BaseSchema])
def get_bases(db: Session = Depends(get_db)):
    bases = db.query(BaseDBModel).options(joinedload(BaseDBModel.tizados)).all()
    return bases

@api_router.get("/bases/{id_base}", response_model=BaseSchema)
def get_base(id_base: int, db: Session = Depends(get_db)):
    base = db.query(BaseDBModel).options(joinedload(BaseDBModel.tizados)).filter(BaseDBModel.id_base == id_base).first()
    if not base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    return base

@api_router.post("/bases", response_model=BaseSchema)
def create_base(base: BaseCreate, db: Session = Depends(get_db)):
    db_base = BaseDBModel(**base.model_dump())
    db.add(db_base)
    db.commit()
    db.refresh(db_base)
    
    base_result = db.query(BaseDBModel).options(joinedload(BaseModel.tizados)).filter(BaseModel.id_base == db_base.id_base).first()
    return base_result

@api_router.put("/bases/{id_base}", response_model=BaseSchema)
def update_base(id_base: int, base: BaseUpdate, db: Session = Depends(get_db)):
    db_base = db.query(BaseDBModel).filter(BaseModel.id_base == id_base).first()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    for key, value in base.model_dump(exclude_unset=True).items():
        setattr(db_base, key, value)
    
    db.commit()
    
    base_result = db.query(BaseDBModel).options(joinedload(BaseModel.tizados)).filter(BaseModel.id_base == id_base).first()
    return base_result

@api_router.delete("/bases/{id_base}")
def delete_base(id_base: int, db: Session = Depends(get_db)):
    db_base = db.query(BaseDBModel).filter(BaseModel.id_base == id_base).first()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
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
def create_tizado(tizado: TizadoCreate, db: Session = Depends(get_db)):
    db_tizado = TizadoModel(**tizado.model_dump())
    db.add(db_tizado)
    db.commit()
    db.refresh(db_tizado)
    return db_tizado

@api_router.put("/tizados/{id_tizado}", response_model=Tizado)
def update_tizado(id_tizado: int, tizado: TizadoUpdate, db: Session = Depends(get_db)):
    db_tizado = db.query(TizadoModel).filter(TizadoModel.id_tizado == id_tizado).first()
    if not db_tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    
    for key, value in tizado.model_dump(exclude_unset=True).items():
        setattr(db_tizado, key, value)
    
    db.commit()
    db.refresh(db_tizado)
    return db_tizado

@api_router.delete("/tizados/{id_tizado}")
def delete_tizado(id_tizado: int, db: Session = Depends(get_db)):
    db_tizado = db.query(TizadoModel).filter(TizadoModel.id_tizado == id_tizado).first()
    if not db_tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    
    db.delete(db_tizado)
    db.commit()
    return {"message": "Tizado eliminado"}

# FILE UPLOAD Endpoint
@api_router.post("/upload")
def upload_file(file: UploadFile = File(...)):
    try:
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
        
        return {"filename": unique_filename, "url": f"/api/files/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FILE DOWNLOAD Endpoint
@api_router.get("/files/{filename}")
def get_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)

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
