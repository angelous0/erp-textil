"""
Sistema de Auditoría - Historial de Movimientos
Registra todas las acciones de los usuarios en el sistema.
"""
from sqlalchemy.orm import Session
from models import HistorialMovimiento, AccionEnum
from datetime import datetime, timezone
from typing import Optional, Any
import json
from decimal import Decimal

def decimal_default(obj):
    """Convertir Decimal a float para JSON"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def model_to_dict(obj) -> dict:
    """Convierte un modelo SQLAlchemy a diccionario, excluyendo relaciones"""
    if obj is None:
        return None
    
    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        if isinstance(value, Decimal):
            value = float(value)
        elif isinstance(value, datetime):
            value = value.isoformat()
        elif hasattr(value, 'value'):  # Enum
            value = value.value
        result[column.name] = value
    return result

def registrar_movimiento(
    db: Session,
    usuario_id: Optional[int],
    username: str,
    tabla: str,
    accion: AccionEnum,
    id_registro: Optional[int] = None,
    descripcion: Optional[str] = None,
    datos_anteriores: Optional[dict] = None,
    datos_nuevos: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Registra un movimiento en el historial de auditoría.
    
    Args:
        db: Sesión de base de datos
        usuario_id: ID del usuario que realiza la acción
        username: Nombre de usuario (se guarda por si se elimina el usuario)
        tabla: Nombre de la tabla afectada
        accion: Tipo de acción (crear, editar, eliminar, etc.)
        id_registro: ID del registro afectado
        descripcion: Descripción legible de la acción
        datos_anteriores: Estado del registro antes del cambio
        datos_nuevos: Estado del registro después del cambio
        ip_address: Dirección IP del cliente
        user_agent: User-Agent del navegador
    """
    try:
        movimiento = HistorialMovimiento(
            id_usuario=usuario_id,
            username=username,
            fecha_hora=datetime.now(timezone.utc),
            tabla=tabla,
            accion=accion,
            id_registro=id_registro,
            descripcion=descripcion,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(movimiento)
        db.commit()
        return movimiento
    except Exception as e:
        print(f"Error registrando movimiento de auditoría: {e}")
        db.rollback()
        return None

def audit_create(
    db: Session,
    usuario,
    tabla: str,
    registro_nuevo,
    id_registro: int,
    descripcion: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Registra una acción de creación"""
    datos_nuevos = model_to_dict(registro_nuevo) if hasattr(registro_nuevo, '__table__') else registro_nuevo
    
    return registrar_movimiento(
        db=db,
        usuario_id=usuario.id_usuario if usuario else None,
        username=usuario.username if usuario else "sistema",
        tabla=tabla,
        accion=AccionEnum.crear,
        id_registro=id_registro,
        descripcion=descripcion,
        datos_nuevos=datos_nuevos,
        ip_address=ip_address,
        user_agent=user_agent
    )

def audit_update(
    db: Session,
    usuario,
    tabla: str,
    registro_anterior,
    registro_nuevo,
    id_registro: int,
    descripcion: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Registra una acción de edición"""
    datos_anteriores = model_to_dict(registro_anterior) if hasattr(registro_anterior, '__table__') else registro_anterior
    datos_nuevos = model_to_dict(registro_nuevo) if hasattr(registro_nuevo, '__table__') else registro_nuevo
    
    return registrar_movimiento(
        db=db,
        usuario_id=usuario.id_usuario if usuario else None,
        username=usuario.username if usuario else "sistema",
        tabla=tabla,
        accion=AccionEnum.editar,
        id_registro=id_registro,
        descripcion=descripcion,
        datos_anteriores=datos_anteriores,
        datos_nuevos=datos_nuevos,
        ip_address=ip_address,
        user_agent=user_agent
    )

def audit_delete(
    db: Session,
    usuario,
    tabla: str,
    registro_eliminado,
    id_registro: int,
    descripcion: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Registra una acción de eliminación"""
    datos_anteriores = model_to_dict(registro_eliminado) if hasattr(registro_eliminado, '__table__') else registro_eliminado
    
    return registrar_movimiento(
        db=db,
        usuario_id=usuario.id_usuario if usuario else None,
        username=usuario.username if usuario else "sistema",
        tabla=tabla,
        accion=AccionEnum.eliminar,
        id_registro=id_registro,
        descripcion=descripcion,
        datos_anteriores=datos_anteriores,
        ip_address=ip_address,
        user_agent=user_agent
    )

def audit_file_action(
    db: Session,
    usuario,
    accion: AccionEnum,
    filename: str,
    tabla_relacionada: Optional[str] = None,
    id_registro: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Registra una acción de archivo (subir, descargar, eliminar)"""
    accion_texto = {
        AccionEnum.subir_archivo: "subió",
        AccionEnum.descargar_archivo: "descargó", 
        AccionEnum.eliminar_archivo: "eliminó"
    }
    
    descripcion = f"{accion_texto.get(accion, 'procesó')} archivo: {filename}"
    if tabla_relacionada:
        descripcion += f" (relacionado con {tabla_relacionada})"
    
    return registrar_movimiento(
        db=db,
        usuario_id=usuario.id_usuario if usuario else None,
        username=usuario.username if usuario else "sistema",
        tabla="archivos",
        accion=accion,
        id_registro=id_registro,
        descripcion=descripcion,
        datos_nuevos={"filename": filename, "tabla_relacionada": tabla_relacionada},
        ip_address=ip_address,
        user_agent=user_agent
    )

def audit_login(
    db: Session,
    usuario,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    exitoso: bool = True
):
    """Registra un intento de login"""
    return registrar_movimiento(
        db=db,
        usuario_id=usuario.id_usuario if usuario else None,
        username=usuario.username if usuario else "desconocido",
        tabla="sesiones",
        accion=AccionEnum.login,
        descripcion=f"Inicio de sesión {'exitoso' if exitoso else 'fallido'}",
        datos_nuevos={"exitoso": exitoso},
        ip_address=ip_address,
        user_agent=user_agent
    )
