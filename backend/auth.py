from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os

from database import get_db
from models import Usuario, PermisoUsuario, RolEnum

# Configuración
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "erp-textil-secret-key-2024-muy-segura")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )
    
    return user

# Security opcional para endpoints que pueden funcionar sin auth
optional_security = HTTPBearer(auto_error=False)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[Usuario]:
    """Obtiene el usuario actual si hay token, None si no hay"""
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        return None
    
    username: str = payload.get("sub")
    if username is None:
        return None
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None or not user.activo:
        return None
    
    return user

def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if not current_user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in [RolEnum.super_admin, RolEnum.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user

def require_super_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol != RolEnum.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de super administrador"
        )
    return current_user

def get_user_permissions(user: Usuario, db: Session) -> dict:
    """Obtiene los permisos del usuario como diccionario"""
    if user.rol == RolEnum.super_admin:
        # Super admin tiene todos los permisos
        return {
            "marcas_ver": True, "marcas_crear": True, "marcas_editar": True, "marcas_eliminar": True,
            "tipos_ver": True, "tipos_crear": True, "tipos_editar": True, "tipos_eliminar": True,
            "entalles_ver": True, "entalles_crear": True, "entalles_editar": True, "entalles_eliminar": True,
            "telas_ver": True, "telas_crear": True, "telas_editar": True, "telas_eliminar": True,
            "muestras_ver": True, "muestras_crear": True, "muestras_editar": True, "muestras_eliminar": True,
            "bases_ver": True, "bases_crear": True, "bases_editar": True, "bases_eliminar": True,
            "tizados_ver": True, "tizados_crear": True, "tizados_editar": True, "tizados_eliminar": True,
            "descargar_patrones": True, "descargar_tizados": True, "descargar_fichas": True,
            "descargar_imagenes": True, "descargar_costos": True,
            "subir_patrones": True, "subir_tizados": True, "subir_fichas": True,
            "subir_imagenes": True, "subir_costos": True,
            "gestionar_usuarios": True
        }
    
    if user.rol == RolEnum.admin:
        # Admin tiene casi todos los permisos excepto crear super admins
        return {
            "marcas_ver": True, "marcas_crear": True, "marcas_editar": True, "marcas_eliminar": True,
            "tipos_ver": True, "tipos_crear": True, "tipos_editar": True, "tipos_eliminar": True,
            "entalles_ver": True, "entalles_crear": True, "entalles_editar": True, "entalles_eliminar": True,
            "telas_ver": True, "telas_crear": True, "telas_editar": True, "telas_eliminar": True,
            "muestras_ver": True, "muestras_crear": True, "muestras_editar": True, "muestras_eliminar": True,
            "bases_ver": True, "bases_crear": True, "bases_editar": True, "bases_eliminar": True,
            "tizados_ver": True, "tizados_crear": True, "tizados_editar": True, "tizados_eliminar": True,
            "descargar_patrones": True, "descargar_tizados": True, "descargar_fichas": True,
            "descargar_imagenes": True, "descargar_costos": True,
            "subir_patrones": True, "subir_tizados": True, "subir_fichas": True,
            "subir_imagenes": True, "subir_costos": True,
            "gestionar_usuarios": True
        }
    
    # Para editor y viewer, usar permisos personalizados
    permiso = db.query(PermisoUsuario).filter(PermisoUsuario.id_usuario == user.id_usuario).first()
    
    if not permiso:
        # Permisos por defecto según rol
        if user.rol == RolEnum.editor:
            return {
                "marcas_ver": True, "marcas_crear": True, "marcas_editar": True, "marcas_eliminar": False,
                "tipos_ver": True, "tipos_crear": True, "tipos_editar": True, "tipos_eliminar": False,
                "entalles_ver": True, "entalles_crear": True, "entalles_editar": True, "entalles_eliminar": False,
                "telas_ver": True, "telas_crear": True, "telas_editar": True, "telas_eliminar": False,
                "muestras_ver": True, "muestras_crear": True, "muestras_editar": True, "muestras_eliminar": False,
                "bases_ver": True, "bases_crear": True, "bases_editar": True, "bases_eliminar": False,
                "tizados_ver": True, "tizados_crear": True, "tizados_editar": True, "tizados_eliminar": False,
                "descargar_patrones": True, "descargar_tizados": True, "descargar_fichas": True,
                "descargar_imagenes": True, "descargar_costos": False,
                "subir_patrones": True, "subir_tizados": True, "subir_fichas": True,
                "subir_imagenes": True, "subir_costos": True,
                "gestionar_usuarios": False
            }
        else:  # viewer
            return {
                "marcas_ver": True, "marcas_crear": False, "marcas_editar": False, "marcas_eliminar": False,
                "tipos_ver": True, "tipos_crear": False, "tipos_editar": False, "tipos_eliminar": False,
                "entalles_ver": True, "entalles_crear": False, "entalles_editar": False, "entalles_eliminar": False,
                "telas_ver": True, "telas_crear": False, "telas_editar": False, "telas_eliminar": False,
                "muestras_ver": True, "muestras_crear": False, "muestras_editar": False, "muestras_eliminar": False,
                "bases_ver": True, "bases_crear": False, "bases_editar": False, "bases_eliminar": False,
                "tizados_ver": True, "tizados_crear": False, "tizados_editar": False, "tizados_eliminar": False,
                "descargar_patrones": False, "descargar_tizados": False, "descargar_fichas": False,
                "descargar_imagenes": True, "descargar_costos": False,
                "subir_patrones": False, "subir_tizados": False, "subir_fichas": False,
                "subir_imagenes": False, "subir_costos": False,
                "gestionar_usuarios": False
            }
    
    # Usar permisos personalizados
    return {
        "marcas_ver": permiso.marcas_ver, "marcas_crear": permiso.marcas_crear,
        "marcas_editar": permiso.marcas_editar, "marcas_eliminar": permiso.marcas_eliminar,
        "tipos_ver": permiso.tipos_ver, "tipos_crear": permiso.tipos_crear,
        "tipos_editar": permiso.tipos_editar, "tipos_eliminar": permiso.tipos_eliminar,
        "entalles_ver": permiso.entalles_ver, "entalles_crear": permiso.entalles_crear,
        "entalles_editar": permiso.entalles_editar, "entalles_eliminar": permiso.entalles_eliminar,
        "telas_ver": permiso.telas_ver, "telas_crear": permiso.telas_crear,
        "telas_editar": permiso.telas_editar, "telas_eliminar": permiso.telas_eliminar,
        "muestras_ver": permiso.muestras_ver, "muestras_crear": permiso.muestras_crear,
        "muestras_editar": permiso.muestras_editar, "muestras_eliminar": permiso.muestras_eliminar,
        "bases_ver": permiso.bases_ver, "bases_crear": permiso.bases_crear,
        "bases_editar": permiso.bases_editar, "bases_eliminar": permiso.bases_eliminar,
        "tizados_ver": permiso.tizados_ver, "tizados_crear": permiso.tizados_crear,
        "tizados_editar": permiso.tizados_editar, "tizados_eliminar": permiso.tizados_eliminar,
        "descargar_patrones": permiso.descargar_patrones, "descargar_tizados": permiso.descargar_tizados,
        "descargar_fichas": permiso.descargar_fichas, "descargar_imagenes": permiso.descargar_imagenes,
        "descargar_costos": permiso.descargar_costos,
        "subir_patrones": permiso.subir_patrones, "subir_tizados": permiso.subir_tizados,
        "subir_fichas": permiso.subir_fichas, "subir_imagenes": permiso.subir_imagenes,
        "subir_costos": permiso.subir_costos,
        "gestionar_usuarios": False
    }

def create_default_permissions(user_id: int, rol: RolEnum, db: Session):
    """Crea permisos por defecto según el rol"""
    if rol == RolEnum.editor:
        permiso = PermisoUsuario(
            id_usuario=user_id,
            marcas_ver=True, marcas_crear=True, marcas_editar=True, marcas_eliminar=False,
            tipos_ver=True, tipos_crear=True, tipos_editar=True, tipos_eliminar=False,
            entalles_ver=True, entalles_crear=True, entalles_editar=True, entalles_eliminar=False,
            telas_ver=True, telas_crear=True, telas_editar=True, telas_eliminar=False,
            muestras_ver=True, muestras_crear=True, muestras_editar=True, muestras_eliminar=False,
            bases_ver=True, bases_crear=True, bases_editar=True, bases_eliminar=False,
            tizados_ver=True, tizados_crear=True, tizados_editar=True, tizados_eliminar=False,
            descargar_patrones=True, descargar_tizados=True, descargar_fichas=True,
            descargar_imagenes=True, descargar_costos=False
        )
    else:  # viewer o cualquier otro
        permiso = PermisoUsuario(
            id_usuario=user_id,
            marcas_ver=True, marcas_crear=False, marcas_editar=False, marcas_eliminar=False,
            tipos_ver=True, tipos_crear=False, tipos_editar=False, tipos_eliminar=False,
            entalles_ver=True, entalles_crear=False, entalles_editar=False, entalles_eliminar=False,
            telas_ver=True, telas_crear=False, telas_editar=False, telas_eliminar=False,
            muestras_ver=True, muestras_crear=False, muestras_editar=False, muestras_eliminar=False,
            bases_ver=True, bases_crear=False, bases_editar=False, bases_eliminar=False,
            tizados_ver=True, tizados_crear=False, tizados_editar=False, tizados_eliminar=False,
            descargar_patrones=False, descargar_tizados=False, descargar_fichas=False,
            descargar_imagenes=True, descargar_costos=False
        )
    
    db.add(permiso)
    db.commit()
    return permiso
