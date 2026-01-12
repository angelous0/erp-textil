-- Script SQL para crear las tablas del ERP Textil
-- MariaDB/MySQL

-- Tabla TELA (para el módulo de muestras)
CREATE TABLE IF NOT EXISTS tela_muestra (
    id_tela INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tela VARCHAR(255) NOT NULL,
    gramaje DECIMAL(10, 2),
    elasticidad VARCHAR(100),
    proveedor VARCHAR(255),
    ancho_estandar DECIMAL(10, 2),
    color ENUM('Azul', 'Negro')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla ENTALLE (ya existe, verificar estructura)
-- Si la estructura no coincide, crear entalle_muestra

-- Tabla TIPO_PRODUCTO (ya existe, verificar estructura)
-- Si la estructura no coincide, crear tipo_producto_muestra

-- Tabla MUESTRA_BASE
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
    FOREIGN KEY (id_entalle) REFERENCES entalle(id_entalle),
    FOREIGN KEY (id_tela) REFERENCES tela_muestra(id_tela)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla BASE
CREATE TABLE IF NOT EXISTS base (
    id_base INT AUTO_INCREMENT PRIMARY KEY,
    id_muestra_base INT NOT NULL,
    patron VARCHAR(500),
    fichas TEXT,
    aprobado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_muestra_base) REFERENCES muestra_base(id_muestra_base) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla TIZADO
CREATE TABLE IF NOT EXISTS tizado (
    id_tizado INT AUTO_INCREMENT PRIMARY KEY,
    id_base INT NOT NULL,
    archivo_tizado VARCHAR(500),
    curva TEXT,
    FOREIGN KEY (id_base) REFERENCES base(id_base) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
