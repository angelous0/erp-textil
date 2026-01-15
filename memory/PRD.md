# ERP Textil - Módulo de Muestras

## Descripción del Proyecto
Sistema ERP textil full-stack (FastAPI + React + MariaDB) para gestión de desarrollo de muestras.

## Stack Tecnológico
- **Backend**: FastAPI, SQLAlchemy, Pydantic, MariaDB
- **Frontend**: React, TanStack Table, Tailwind CSS, Shadcn/UI
- **Almacenamiento**: Cloudflare R2 (AWS S3 compatible)
- **Base de datos**: MariaDB (conexión externa)

## Entidades del Sistema

### Módulo 1: Desarrollo de Muestras (Implementado)
- `x_marca`: {id_marca, nombre_marca}
- `x_tipo_producto`: {id_tipo, nombre_tipo}
- `x_entalle`: {id_entalle, nombre_entalle}
- `x_tela_desarrollo`: {id_tela, nombre_tela, clasificacion, precio}
- `x_muestra_base`: {id_muestra_base, id_tipo, id_entalle, id_tela, id_marca, consumo_estimado, costo_estimado, precio_estimado, archivo_costo, aprobado, rentabilidad}
- `x_base`: {id_base, id_muestra_base, patron, imagen, aprobado}
- `x_tizado`: {id_tizado, id_base, ancho, archivo_tizado, curva}
- `x_ficha`: {id_ficha, id_base, nombre_ficha, archivo}

## Características Implementadas

### Backend
- [x] CRUD completo para todas las entidades
- [x] Subida de archivos a Cloudflare R2
- [x] Descarga de archivos desde R2 (URLs firmadas)
- [x] Eliminación de archivos de R2
- [x] API RESTful con prefijo /api

### Frontend
- [x] Páginas CRUD para: Marcas, Tipos Producto, Entalles, Telas, Muestras Base, Bases, Tizados
- [x] Filtros de estado (Aprobado/Pendiente) en Muestras Base y Bases
- [x] Búsqueda avanzada multi-campo
- [x] Modal de Tizados anidado en Bases (con ordenamiento y reordenamiento manual)
- [x] Modal de Fichas en Bases
- [x] **Modal de confirmación de eliminación** con detalle de archivos afectados
- [x] Descarga de archivos desde R2
- [x] Visor de imágenes ampliadas

### Integración Cloudflare R2
- [x] Subida de archivos (usando boto3)
- [x] Descarga de archivos (URLs firmadas pre-signed)
- [x] Eliminación de archivos
- [x] Migración de archivos existentes completada (18 archivos)

## Credenciales y Configuración

### Backend (.env)
- MONGO_URL, DB_NAME (no usados actualmente)
- PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DB (MariaDB)
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
- UPLOAD_DIR=/app/backend/uploads

### Cloudflare R2
- Bucket: `erp-textil-archivos`
- Región: auto

## Estado Actual
✅ **Completado hoy (15 Enero 2026)**:
- Migración de 18 archivos existentes a Cloudflare R2
- Implementación de descarga de archivos desde R2 (usando StreamingResponse)
- Implementación de eliminación de archivos en R2
- Modal de confirmación de eliminación en: Bases, Tizados, Muestras Base
- **Modal de Fichas mejorado**: Ahora incluye búsqueda, creación y eliminación (igual que Tizados)
- **Botones "+ Agregar"**: Los badges de Fichas y Tizados ahora muestran "+ Agregar" cuando están vacíos y permiten crear

**Nota técnica**: La descarga usa StreamingResponse en lugar de RedirectResponse porque fetch() del frontend no puede seguir redirects cross-origin (CORS).

## Tareas Pendientes

### P1 - Prioridad Alta
- [ ] Verificar que el preview de imágenes funciona correctamente

### P2 - Prioridad Media
- [ ] Separar las tablas a base de datos independiente (`erp_desarrollo_muestras`)
- [ ] Implementar modales de confirmación en otras páginas (Telas, Entalles, etc.)

### P3 - Backlog
- [ ] Implementar Módulo 2: Producción y Materia Prima
- [ ] Edición en celda (In-cell editing)
- [ ] Dashboard con métricas

## Convenciones
- Todas las tablas y columnas nuevas usan prefijo `x_`
- Los archivos se almacenan con UUID como nombre
