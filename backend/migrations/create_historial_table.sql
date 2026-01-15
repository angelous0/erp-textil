-- Script para crear la tabla de historial de movimientos
-- Ejecutar en la base de datos MariaDB/MySQL

CREATE TABLE IF NOT EXISTS x_historial_movimiento (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL,
    username VARCHAR(100) NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    tabla VARCHAR(100) NOT NULL,
    accion ENUM('crear', 'editar', 'eliminar', 'subir_archivo', 'descargar_archivo', 'eliminar_archivo', 'login', 'logout') NOT NULL,
    id_registro INT NULL,
    descripcion TEXT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    
    FOREIGN KEY (id_usuario) REFERENCES x_usuario(id_usuario) ON DELETE SET NULL,
    INDEX idx_usuario (username),
    INDEX idx_fecha (fecha_hora),
    INDEX idx_tabla (tabla),
    INDEX idx_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
