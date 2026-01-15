from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List
import os
import logging
from pathlib import Path
import shutil
import uuid
import boto3
from botocore.config import Config as BotoConfig

from database import get_db, engine, Base
from models import Tela as TelaModel, Entalle as EntalleModel, TipoProducto as TipoProductoModel, Marca as MarcaModel
from models import MuestraBase as MuestraBaseModel, BaseModel as BaseDBModel, Tizado as TizadoModel, Ficha as FichaModel
from schemas import (
    Tela, TelaCreate, TelaUpdate,
    Entalle, EntalleCreate, EntalleUpdate,
    TipoProducto, TipoProductoCreate, TipoProductoUpdate,
    Marca, MarcaCreate, MarcaUpdate,
    MuestraBase, MuestraBaseCreate, MuestraBaseUpdate,
    BaseSchema, BaseCreate, BaseUpdate,
    Tizado, TizadoCreate, TizadoUpdate,
    Ficha, FichaCreate, FichaUpdate
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
def create_marca(marca: MarcaCreate, db: Session = Depends(get_db)):
    db_marca = MarcaModel(**marca.model_dump())
    db.add(db_marca)
    db.commit()
    db.refresh(db_marca)
    return db_marca

@api_router.put("/marcas/{id_marca}", response_model=Marca)
def update_marca(id_marca: int, marca: MarcaUpdate, db: Session = Depends(get_db)):
    db_marca = db.query(MarcaModel).filter(MarcaModel.id_marca == id_marca).first()
    if not db_marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    for key, value in marca.model_dump(exclude_unset=True).items():
        setattr(db_marca, key, value)
    
    db.commit()
    db.refresh(db_marca)
    return db_marca

@api_router.delete("/marcas/{id_marca}")
def delete_marca(id_marca: int, db: Session = Depends(get_db)):
    db_marca = db.query(MarcaModel).filter(MarcaModel.id_marca == id_marca).first()
    if not db_marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
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
def create_muestra_base(muestra: MuestraBaseCreate, db: Session = Depends(get_db)):
    db_muestra = MuestraBaseModel(**muestra.model_dump())
    db.add(db_muestra)
    db.commit()
    db.refresh(db_muestra)
    
    muestra_result = db.query(MuestraBaseModel).options(
        joinedload(MuestraBaseModel.tipo_producto),
        joinedload(MuestraBaseModel.entalle),
        joinedload(MuestraBaseModel.tela),
        joinedload(MuestraBaseModel.marca),
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
def create_base(base: BaseCreate, db: Session = Depends(get_db)):
    db_base = BaseDBModel(**base.model_dump())
    db.add(db_base)
    db.commit()
    db.refresh(db_base)
    
    base_result = db.query(BaseDBModel).options(
        joinedload(BaseDBModel.tizados),
        joinedload(BaseDBModel.fichas)
    ).filter(BaseDBModel.id_base == db_base.id_base).first()
    return base_result

@api_router.put("/bases/{id_base}", response_model=BaseSchema)
def update_base(id_base: int, base: BaseUpdate, db: Session = Depends(get_db)):
    db_base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
    if not db_base:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    for key, value in base.model_dump(exclude_unset=True).items():
        setattr(db_base, key, value)
    
    db.commit()
    
    base_result = db.query(BaseDBModel).options(
        joinedload(BaseDBModel.tizados),
        joinedload(BaseDBModel.fichas)
    ).filter(BaseDBModel.id_base == id_base).first()
    return base_result

@api_router.delete("/bases/{id_base}")
def delete_base(id_base: int, db: Session = Depends(get_db)):
    db_base = db.query(BaseDBModel).filter(BaseDBModel.id_base == id_base).first()
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
def create_ficha(ficha: FichaCreate, db: Session = Depends(get_db)):
    db_ficha = FichaModel(**ficha.model_dump())
    db.add(db_ficha)
    db.commit()
    db.refresh(db_ficha)
    return db_ficha

@api_router.put("/fichas/{id_ficha}", response_model=Ficha)
def update_ficha(id_ficha: int, ficha: FichaUpdate, db: Session = Depends(get_db)):
    db_ficha = db.query(FichaModel).filter(FichaModel.id_ficha == id_ficha).first()
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    
    for key, value in ficha.model_dump(exclude_unset=True).items():
        setattr(db_ficha, key, value)
    
    db.commit()
    db.refresh(db_ficha)
    return db_ficha

@api_router.delete("/fichas/{id_ficha}")
def delete_ficha(id_ficha: int, db: Session = Depends(get_db)):
    db_ficha = db.query(FichaModel).filter(FichaModel.id_ficha == id_ficha).first()
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    
    db.delete(db_ficha)
    db.commit()
    return {"message": "Ficha eliminada"}

# FILE UPLOAD Endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
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
        
        return {"filename": unique_filename, "url": f"/api/files/{unique_filename}"}
    except Exception as e:
        print(f"❌ Error en upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# FILE DOWNLOAD Endpoint
@api_router.get("/files/{filename}")
async def get_file(filename: str):
    if USE_R2:
        try:
            # Generar URL firmada de R2 usando boto3
            download_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': R2_BUCKET_NAME, 'Key': filename},
                ExpiresIn=3600  # 1 hora
            )
            return RedirectResponse(url=download_url)
        except Exception as e:
            print(f"⚠️ Error obteniendo de R2: {e}")
            # Fallback a archivo local
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                print(f"⚠️ R2 falló, sirviendo archivo local: {filename}")
                return FileResponse(file_path)
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
    else:
        # Servir archivo local
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        return FileResponse(file_path)

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
