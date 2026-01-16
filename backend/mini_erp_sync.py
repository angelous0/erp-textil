"""
Módulo de sincronización con Mini-ERP (proyecto_moda)
Maneja la conexión y sincronización bidireccional entre x_base y registro
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import List, Optional, Dict, Any
import os

# Conexión al Mini-ERP desde variable de entorno
MINI_ERP_URL = os.environ.get("MINI_ERP_URL", "mysql+pymysql://admin:Proyectomoda%4004072001@72.60.241.216:8000/proyecto_moda")
mini_erp_engine = create_engine(MINI_ERP_URL, pool_pre_ping=True)
MiniERPSession = sessionmaker(bind=mini_erp_engine)

def get_mini_erp_db():
    """Obtiene una sesión de la base de datos del Mini-ERP"""
    db = MiniERPSession()
    try:
        yield db
    finally:
        db.close()

# ==================== LECTURA DE DATOS DEL MINI-ERP ====================

def get_modelos_mini_erp(search: str = None, limit: int = 100) -> List[Dict]:
    """Obtiene la lista de modelos del mini-ERP"""
    with mini_erp_engine.connect() as conn:
        if search:
            query = text("""
                SELECT id, detalle 
                FROM modelo 
                WHERE detalle LIKE :search AND estado = 1
                ORDER BY detalle
                LIMIT :limit
            """)
            result = conn.execute(query, {"search": f"%{search}%", "limit": limit})
        else:
            query = text("""
                SELECT id, detalle 
                FROM modelo 
                WHERE estado = 1
                ORDER BY detalle
                LIMIT :limit
            """)
            result = conn.execute(query, {"limit": limit})
        
        return [{"id": row[0], "detalle": row[1]} for row in result]

def get_modelo_by_id(id_modelo: int) -> Optional[Dict]:
    """Obtiene un modelo específico por ID"""
    with mini_erp_engine.connect() as conn:
        query = text("SELECT id, detalle FROM modelo WHERE id = :id")
        result = conn.execute(query, {"id": id_modelo})
        row = result.fetchone()
        if row:
            return {"id": row[0], "detalle": row[1]}
        return None

def get_registros_mini_erp(search: str = None, limit: int = 100) -> List[Dict]:
    """Obtiene la lista de registros del mini-ERP con sus relaciones"""
    with mini_erp_engine.connect() as conn:
        query = text("""
            SELECT 
                r.id,
                r.n_corte,
                r.id_modelo,
                m.detalle as modelo_nombre,
                r.id_marca,
                ma.detalle as marca_nombre,
                r.id_tipo,
                t.detalle as tipo_nombre,
                r.id_entalle,
                e.detalle as entalle_nombre,
                r.id_tela,
                te.detalle as tela_nombre,
                r.aprobado,
                r.imagen,
                r.x_id_base
            FROM registro r
            LEFT JOIN modelo m ON r.id_modelo = m.id
            LEFT JOIN marca ma ON r.id_marca = ma.id
            LEFT JOIN tipo t ON r.id_tipo = t.id
            LEFT JOIN entalle e ON r.id_entalle = e.id
            LEFT JOIN tela te ON r.id_tela = te.id
            WHERE (:search IS NULL OR m.detalle LIKE :search OR r.n_corte LIKE :search)
            ORDER BY r.id DESC
            LIMIT :limit
        """)
        result = conn.execute(query, {"search": f"%{search}%" if search else None, "limit": limit})
        
        registros = []
        for row in result:
            registros.append({
                "id": row[0],
                "n_corte": row[1],
                "id_modelo": row[2],
                "modelo_nombre": row[3],
                "id_marca": row[4],
                "marca_nombre": row[5],
                "id_tipo": row[6],
                "tipo_nombre": row[7],
                "id_entalle": row[8],
                "entalle_nombre": row[9],
                "id_tela": row[10],
                "tela_nombre": row[11],
                "aprobado": row[12],
                "imagen": row[13],
                "x_id_base": row[14]
            })
        return registros

def get_registro_by_id(id_registro: int) -> Optional[Dict]:
    """Obtiene un registro específico por ID con sus relaciones"""
    with mini_erp_engine.connect() as conn:
        query = text("""
            SELECT 
                r.id,
                r.n_corte,
                r.id_modelo,
                m.detalle as modelo_nombre,
                r.aprobado,
                r.imagen,
                r.x_id_base
            FROM registro r
            LEFT JOIN modelo m ON r.id_modelo = m.id
            WHERE r.id = :id
        """)
        result = conn.execute(query, {"id": id_registro})
        row = result.fetchone()
        if row:
            return {
                "id": row[0],
                "n_corte": row[1],
                "id_modelo": row[2],
                "modelo_nombre": row[3],
                "aprobado": row[4],
                "imagen": row[5],
                "x_id_base": row[6]
            }
        return None

# ==================== SINCRONIZACIÓN ====================

def sync_base_to_registro(id_base: int, id_registro: int, aprobado: bool = None, imagen: str = None):
    """
    Sincroniza una base con un registro del mini-ERP
    - Actualiza x_id_base en registro
    - Actualiza campos si se proporcionan
    """
    with mini_erp_engine.connect() as conn:
        # Actualizar la vinculación
        query = text("""
            UPDATE registro 
            SET x_id_base = :id_base
            WHERE id = :id_registro
        """)
        conn.execute(query, {"id_base": id_base, "id_registro": id_registro})
        
        # Actualizar campos adicionales si se proporcionan
        if aprobado is not None:
            query = text("UPDATE registro SET aprobado = :aprobado WHERE id = :id_registro")
            conn.execute(query, {"aprobado": 1 if aprobado else 0, "id_registro": id_registro})
        
        conn.commit()
        return True

def unlink_base_from_registro(id_registro: int):
    """Desvincula una base de un registro"""
    with mini_erp_engine.connect() as conn:
        query = text("UPDATE registro SET x_id_base = NULL WHERE id = :id_registro")
        conn.execute(query, {"id_registro": id_registro})
        conn.commit()
        return True

def get_registros_sin_vincular(limit: int = 50, search: str = None) -> List[Dict]:
    """Obtiene registros que no están vinculados a ninguna base"""
    with mini_erp_engine.connect() as conn:
        if search:
            query = text("""
                SELECT 
                    r.id,
                    r.n_corte,
                    r.id_modelo,
                    m.detalle as modelo_nombre,
                    e.detalle as estado_nombre
                FROM registro r
                LEFT JOIN modelo m ON r.id_modelo = m.id
                LEFT JOIN estado e ON r.id_estado = e.id
                WHERE r.x_id_base IS NULL
                AND (m.detalle LIKE :search OR r.n_corte LIKE :search OR CAST(r.id AS CHAR) LIKE :search)
                ORDER BY r.id DESC
                LIMIT :limit
            """)
            result = conn.execute(query, {"limit": limit, "search": f"%{search}%"})
        else:
            query = text("""
                SELECT 
                    r.id,
                    r.n_corte,
                    r.id_modelo,
                    m.detalle as modelo_nombre,
                    e.detalle as estado_nombre
                FROM registro r
                LEFT JOIN modelo m ON r.id_modelo = m.id
                LEFT JOIN estado e ON r.id_estado = e.id
                WHERE r.x_id_base IS NULL
                ORDER BY r.id DESC
                LIMIT :limit
            """)
            result = conn.execute(query, {"limit": limit})
        return [{"id": row[0], "n_corte": row[1], "id_modelo": row[2], "modelo_nombre": row[3], "estado_nombre": row[4]} for row in result]

def get_registros_vinculados_a_base(id_base: int) -> List[Dict]:
    """Obtiene todos los registros vinculados a una base específica"""
    with mini_erp_engine.connect() as conn:
        query = text("""
            SELECT 
                r.id,
                r.n_corte,
                r.id_modelo,
                m.detalle as modelo_nombre,
                e.detalle as estado_nombre,
                r.imagen
            FROM registro r
            LEFT JOIN modelo m ON r.id_modelo = m.id
            LEFT JOIN estado e ON r.id_estado = e.id
            WHERE r.x_id_base = :id_base
            ORDER BY r.id DESC
        """)
        result = conn.execute(query, {"id_base": id_base})
        return [{"id": row[0], "n_corte": row[1], "id_modelo": row[2], "modelo_nombre": row[3], "estado_nombre": row[4], "imagen": row[5]} for row in result]

def count_registros_vinculados(id_base: int) -> int:
    """Cuenta cuántos registros están vinculados a una base"""
    with mini_erp_engine.connect() as conn:
        query = text("SELECT COUNT(*) FROM registro WHERE x_id_base = :id_base")
        result = conn.execute(query, {"id_base": id_base})
        return result.scalar() or 0

def test_connection() -> bool:
    """Prueba la conexión al mini-ERP"""
    try:
        with mini_erp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"Error conectando al mini-ERP: {e}")
        return False
