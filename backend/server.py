from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import logging
from pathlib import Path
import aiofiles
import uuid

from database import get_db, engine, Base
from models import Tela as TelaModel, Entalle as EntalleModel, TipoProducto as TipoProductoModel
from models import MuestraBase as MuestraBaseModel, Base as BaseModel, Tizado as TizadoModel
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
async def root():
    return {"message": "ERP Textil API"}

# TELA Endpoints
@api_router.get("/telas", response_model=List[Tela])
async def get_telas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TelaModel))
    telas = result.scalars().all()
    return telas

@api_router.get("/telas/{id_tela}", response_model=Tela)
async def get_tela(id_tela: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TelaModel).where(TelaModel.id_tela == id_tela))
    tela = result.scalar_one_or_none()
    if not tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    return tela

@api_router.post("/telas", response_model=Tela)
async def create_tela(tela: TelaCreate, db: AsyncSession = Depends(get_db)):
    db_tela = TelaModel(**tela.model_dump())
    db.add(db_tela)
    await db.commit()
    await db.refresh(db_tela)
    return db_tela

@api_router.put("/telas/{id_tela}", response_model=Tela)
async def update_tela(id_tela: int, tela: TelaUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TelaModel).where(TelaModel.id_tela == id_tela))
    db_tela = result.scalar_one_or_none()
    if not db_tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    
    for key, value in tela.model_dump(exclude_unset=True).items():
        setattr(db_tela, key, value)
    
    await db.commit()
    await db.refresh(db_tela)
    return db_tela

@api_router.delete("/telas/{id_tela}")
async def delete_tela(id_tela: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TelaModel).where(TelaModel.id_tela == id_tela))
    db_tela = result.scalar_one_or_none()
    if not db_tela:
        raise HTTPException(status_code=404, detail="Tela no encontrada")
    
    await db.delete(db_tela)
    await db.commit()
    return {"message": "Tela eliminada"}

# ENTALLE Endpoints
@api_router.get("/entalles", response_model=List[Entalle])
async def get_entalles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EntalleModel))
    entalles = result.scalars().all()
    return entalles

@api_router.get("/entalles/{id_entalle}", response_model=Entalle)
async def get_entalle(id_entalle: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EntalleModel).where(EntalleModel.id_entalle == id_entalle))
    entalle = result.scalar_one_or_none()
    if not entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    return entalle

@api_router.post("/entalles", response_model=Entalle)
async def create_entalle(entalle: EntalleCreate, db: AsyncSession = Depends(get_db)):
    db_entalle = EntalleModel(**entalle.model_dump())
    db.add(db_entalle)
    await db.commit()
    await db.refresh(db_entalle)
    return db_entalle

@api_router.put("/entalles/{id_entalle}", response_model=Entalle)
async def update_entalle(id_entalle: int, entalle: EntalleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EntalleModel).where(EntalleModel.id_entalle == id_entalle))
    db_entalle = result.scalar_one_or_none()
    if not db_entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    
    for key, value in entalle.model_dump(exclude_unset=True).items():
        setattr(db_entalle, key, value)
    
    await db.commit()
    await db.refresh(db_entalle)
    return db_entalle

@api_router.delete("/entalles/{id_entalle}")
async def delete_entalle(id_entalle: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EntalleModel).where(EntalleModel.id_entalle == id_entalle))
    db_entalle = result.scalar_one_or_none()
    if not db_entalle:
        raise HTTPException(status_code=404, detail="Entalle no encontrado")
    
    await db.delete(db_entalle)
    await db.commit()
    return {"message": "Entalle eliminado"}

# TIPO_PRODUCTO Endpoints
@api_router.get("/tipos-producto", response_model=List[TipoProducto])
async def get_tipos_producto(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TipoProductoModel))
    tipos = result.scalars().all()
    return tipos

@api_router.get("/tipos-producto/{id_tipo}", response_model=TipoProducto)
async def get_tipo_producto(id_tipo: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TipoProductoModel).where(TipoProductoModel.id_tipo == id_tipo))
    tipo = result.scalar_one_or_none()
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    return tipo

@api_router.post("/tipos-producto", response_model=TipoProducto)
async def create_tipo_producto(tipo: TipoProductoCreate, db: AsyncSession = Depends(get_db)):
    db_tipo = TipoProductoModel(**tipo.model_dump())
    db.add(db_tipo)
    await db.commit()
    await db.refresh(db_tipo)
    return db_tipo

@api_router.put("/tipos-producto/{id_tipo}", response_model=TipoProducto)
async def update_tipo_producto(id_tipo: int, tipo: TipoProductoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TipoProductoModel).where(TipoProductoModel.id_tipo == id_tipo))
    db_tipo = result.scalar_one_or_none()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    
    for key, value in tipo.model_dump(exclude_unset=True).items():
        setattr(db_tipo, key, value)
    
    await db.commit()
    await db.refresh(db_tipo)
    return db_tipo

@api_router.delete("/tipos-producto/{id_tipo}")
async def delete_tipo_producto(id_tipo: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TipoProductoModel).where(TipoProductoModel.id_tipo == id_tipo))
    db_tipo = result.scalar_one_or_none()
    if not db_tipo:
        raise HTTPException(status_code=404, detail="Tipo de producto no encontrado")
    
    await db.delete(db_tipo)
    await db.commit()
    return {"message": "Tipo de producto eliminado"}

# MUESTRA_BASE Endpoints
@api_router.get("/muestras-base", response_model=List[MuestraBase])
async def get_muestras_base(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MuestraBaseModel)
        .options(
            selectinload(MuestraBaseModel.tipo_producto),
            selectinload(MuestraBaseModel.entalle),
            selectinload(MuestraBaseModel.tela),
            selectinload(MuestraBaseModel.bases).selectinload(BaseModel.tizados)
        )
    )
    muestras = result.scalars().all()
    return muestras

@api_router.get("/muestras-base/{id_muestra_base}", response_model=MuestraBase)
async def get_muestra_base(id_muestra_base: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MuestraBaseModel)
        .where(MuestraBaseModel.id_muestra_base == id_muestra_base)
        .options(
            selectinload(MuestraBaseModel.tipo_producto),
            selectinload(MuestraBaseModel.entalle),
            selectinload(MuestraBaseModel.tela),
            selectinload(MuestraBaseModel.bases).selectinload(BaseModel.tizados)
        )
    )
    muestra = result.scalar_one_or_none()
    if not muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    return muestra

@api_router.post("/muestras-base", response_model=MuestraBase)
async def create_muestra_base(muestra: MuestraBaseCreate, db: AsyncSession = Depends(get_db)):
    db_muestra = MuestraBaseModel(**muestra.model_dump())
    db.add(db_muestra)
    await db.commit()
    await db.refresh(db_muestra)
    
    result = await db.execute(
        select(MuestraBaseModel)
        .where(MuestraBaseModel.id_muestra_base == db_muestra.id_muestra_base)
        .options(
            selectinload(MuestraBaseModel.tipo_producto),
            selectinload(MuestraBaseModel.entalle),
            selectinload(MuestraBaseModel.tela),
            selectinload(MuestraBaseModel.bases)
        )
    )
    return result.scalar_one()

@api_router.put("/muestras-base/{id_muestra_base}", response_model=MuestraBase)
async def update_muestra_base(id_muestra_base: int, muestra: MuestraBaseUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MuestraBaseModel).where(MuestraBaseModel.id_muestra_base == id_muestra_base))
    db_muestra = result.scalar_one_or_none()
    if not db_muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    
    for key, value in muestra.model_dump(exclude_unset=True).items():
        setattr(db_muestra, key, value)
    
    await db.commit()
    
    result = await db.execute(
        select(MuestraBaseModel)
        .where(MuestraBaseModel.id_muestra_base == id_muestra_base)
        .options(
            selectinload(MuestraBaseModel.tipo_producto),
            selectinload(MuestraBaseModel.entalle),
            selectinload(MuestraBaseModel.tela),
            selectinload(MuestraBaseModel.bases)
        )
    )
    return result.scalar_one()

@api_router.delete("/muestras-base/{id_muestra_base}")
async def delete_muestra_base(id_muestra_base: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MuestraBaseModel).where(MuestraBaseModel.id_muestra_base == id_muestra_base))
    db_muestra = result.scalar_one_or_none()
    if not db_muestra:
        raise HTTPException(status_code=404, detail="Muestra base no encontrada")
    
    await db.delete(db_muestra)
    await db.commit()
    return {"message": "Muestra base eliminada"}

# BASE Endpoints
@api_router.get("/bases", response_model=List[BaseSchema])
async def get_bases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BaseModel).options(selectinload(BaseModel.tizados))
    )
    bases = result.scalars().all()
    return bases

@api_router.get("/bases/{id_base}", response_model=BaseSchema)
async def get_base(id_base: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BaseModel)
        .where(BaseModel.id_base == id_base)
        .options(selectinload(BaseModel.tizados))
    )
    base = result.scalar_one_or_none()
    if not base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    return base

@api_router.post("/bases", response_model=BaseSchema)
async def create_base(base: BaseCreate, db: AsyncSession = Depends(get_db)):
    db_base = BaseModel(**base.model_dump())
    db.add(db_base)
    await db.commit()
    await db.refresh(db_base)
    
    result = await db.execute(
        select(BaseModel)
        .where(BaseModel.id_base == db_base.id_base)
        .options(selectinload(BaseModel.tizados))
    )
    return result.scalar_one()

@api_router.put("/bases/{id_base}", response_model=BaseSchema)
async def update_base(id_base: int, base: BaseUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BaseModel).where(BaseModel.id_base == id_base))
    db_base = result.scalar_one_or_none()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    for key, value in base.model_dump(exclude_unset=True).items():
        setattr(db_base, key, value)
    
    await db.commit()
    
    result = await db.execute(
        select(BaseModel)
        .where(BaseModel.id_base == id_base)
        .options(selectinload(BaseModel.tizados))
    )
    return result.scalar_one()

@api_router.delete("/bases/{id_base}")
async def delete_base(id_base: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BaseModel).where(BaseModel.id_base == id_base))
    db_base = result.scalar_one_or_none()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    await db.delete(db_base)
    await db.commit()
    return {"message": "Base eliminada"}

# TIZADO Endpoints
@api_router.get("/tizados", response_model=List[Tizado])
async def get_tizados(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TizadoModel))
    tizados = result.scalars().all()
    return tizados

@api_router.get("/tizados/{id_tizado}", response_model=Tizado)
async def get_tizado(id_tizado: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TizadoModel).where(TizadoModel.id_tizado == id_tizado))
    tizado = result.scalar_one_or_none()
    if not tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    return tizado

@api_router.post("/tizados", response_model=Tizado)
async def create_tizado(tizado: TizadoCreate, db: AsyncSession = Depends(get_db)):
    db_tizado = TizadoModel(**tizado.model_dump())
    db.add(db_tizado)
    await db.commit()
    await db.refresh(db_tizado)
    return db_tizado

@api_router.put("/tizados/{id_tizado}", response_model=Tizado)
async def update_tizado(id_tizado: int, tizado: TizadoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TizadoModel).where(TizadoModel.id_tizado == id_tizado))
    db_tizado = result.scalar_one_or_none()
    if not db_tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    
    for key, value in tizado.model_dump(exclude_unset=True).items():
        setattr(db_tizado, key, value)
    
    await db.commit()
    await db.refresh(db_tizado)
    return db_tizado

@api_router.delete("/tizados/{id_tizado}")
async def delete_tizado(id_tizado: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TizadoModel).where(TizadoModel.id_tizado == id_tizado))
    db_tizado = result.scalar_one_or_none()
    if not db_tizado:
        raise HTTPException(status_code=404, detail="Tizado no encontrado")
    
    await db.delete(db_tizado)
    await db.commit()
    return {"message": "Tizado eliminado"}

# FILE UPLOAD Endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return {"filename": unique_filename, "url": f"/api/files/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FILE DOWNLOAD Endpoint
@api_router.get("/files/{filename}")
async def get_file(filename: str):
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
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
    logger.info("Database connection closed")
