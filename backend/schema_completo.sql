-- Script SQL para crear todas las tablas del ERP Textil
-- MariaDB/MySQL
-- Ejecutar en orden

-- 1. TELA para desarrollo de muestras
CREATE TABLE IF NOT EXISTS tela_desarrollo (
    id_tela INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tela VARCHAR(255) NOT NULL,
    gramaje DECIMAL(10, 2),
    elasticidad VARCHAR(100),
    proveedor VARCHAR(255),
    ancho_estandar DECIMAL(10, 2),
    color ENUM('Azul', 'Negro')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ENTALLE para desarrollo
CREATE TABLE IF NOT EXISTS entalle_desarrollo (
    id_entalle INT AUTO_INCREMENT PRIMARY KEY,
    nombre_entalle VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TIPO_PRODUCTO (si ya existe, skip este)
CREATE TABLE IF NOT EXISTS tipo_producto (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. MUESTRA_BASE
CREATE TABLE IF NOT EXISTS muestra_base (
    id_muestra_base INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo INT NOT NULL,
    id_entalle INT NOT NULL,
    id_tela INT NOT NULL,
    consumo_estimado DECIMAL(10, 2),
    costo_estimado DECIMAL(10, 2),
    archivo_costo VARCHAR(500),
    aprobado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_tipo) REFERENCES tipo_producto(id_tipo),
    FOREIGN KEY (id_entalle) REFERENCES entalle_desarrollo(id_entalle),
    FOREIGN KEY (id_tela) REFERENCES tela_desarrollo(id_tela)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BASE
CREATE TABLE IF NOT EXISTS base (
    id_base INT AUTO_INCREMENT PRIMARY KEY,
    id_muestra_base INT NOT NULL,
    patron VARCHAR(500),
    aprobado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_muestra_base) REFERENCES muestra_base(id_muestra_base) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. FICHA (Many-to-One con Base)
CREATE TABLE IF NOT EXISTS ficha (
    id_ficha INT AUTO_INCREMENT PRIMARY KEY,
    id_base INT NOT NULL,
    nombre_ficha VARCHAR(255),
    archivo VARCHAR(500),
    FOREIGN KEY (id_base) REFERENCES base(id_base) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TIZADO
CREATE TABLE IF NOT EXISTS tizado (
    id_tizado INT AUTO_INCREMENT PRIMARY KEY,
    id_base INT NOT NULL,
    archivo_tizado VARCHAR(500),
    curva TEXT,
    FOREIGN KEY (id_base) REFERENCES base(id_base) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos de ejemplo (opcional)
INSERT INTO tipo_producto (nombre_tipo) VALUES 
    ('Polo'), ('Pantalón'), ('Jean'), ('Short');

INSERT INTO entalle_desarrollo (nombre_entalle) VALUES 
    ('Regular'), ('Slim'), ('Oversize');

INSERT INTO tela_desarrollo (nombre_tela, gramaje, color) VALUES 
    ('Algodón Premium', 180, 'Azul'),
    ('Jersey Suave', 160, 'Negro');

-- Verificar
SELECT 'Tablas creadas exitosamente' AS resultado;
