# ERP Textil - Módulo de Muestras

## Descripción del Proyecto
Sistema ERP textil full-stack (FastAPI + React + MariaDB) para gestión de desarrollo de muestras, con sincronización bidireccional con mini-ERP existente.

## Stack Tecnológico
- **Backend**: FastAPI, SQLAlchemy, Pydantic, MariaDB
- **Frontend**: React, TanStack Table, Tailwind CSS, Shadcn/UI
- **Almacenamiento**: Cloudflare R2 (AWS S3 compatible via boto3)
- **Autenticación**: JWT (python-jose), bcrypt (passlib)
- **Base de Datos Externa**: Mini-ERP (proyecto_moda)
- **Despliegue**: EasyPanel + Docker

## Características Implementadas ✅

### Eliminación de Archivos en Cascada (16 Enero 2026)
- [x] Función `delete_file_from_r2()` para eliminar archivos de Cloudflare R2
- [x] Eliminación cascada: Al eliminar Base, se eliminan archivos de imagen, fichas y tizados
- [x] Eliminación individual: Al eliminar ficha/tizado, se elimina su archivo de R2
- [x] Actualización: Al cambiar/quitar archivo de un registro, se elimina el anterior de R2

### Sincronización con Mini-ERP (16 Enero 2026)
- [x] Conexión bidireccional con base de datos `proyecto_moda`
- [x] Endpoints para leer modelos y registros del mini-ERP
- [x] Modal de gestión de registros ERP por cada base
- [x] Vinculación múltiple: una base puede tener varios registros
- [x] Búsqueda y filtrado por modelo y N° corte
- [x] Columna Estado mostrando estado real del registro (Corte, Costura, etc.)
- [x] Vinculación/desvinculación desde la interfaz
- [x] Campo `x_id_base` en tabla `registro` del mini-ERP

### Dashboard con Métricas (15 Enero 2026)
- [x] Saludo personalizado al usuario
- [x] Estadísticas en tiempo real
- [x] Indicador de aprobados vs pendientes
- [x] Accesos rápidos a todos los módulos
- [x] Actividad reciente (solo admins)

### Sistema de Autenticación y Autorización
- [x] Login con username y contraseña (JWT)
- [x] Roles: Super Admin, Admin, Editor, Viewer
- [x] Permisos CRUD por módulo
- [x] Permisos de descarga/subida separados
- [x] Aplicación de permisos en Frontend

### Sistema de Auditoría
- [x] Registro automático de acciones CRUD
- [x] Registro de logins y archivos
- [x] Datos anteriores/nuevos en ediciones
- [x] Página `/historial` con filtros

### Credenciales
- **Super Admin**: `eduard` / `cardenas007`

## Despliegue en EasyPanel
- **Backend**: `api.bases.ambissionindustries.cloud`
- **Frontend**: `bases.ambissionindustries.cloud`
- **Base de datos**: MariaDB externa (72.60.241.216:3030)

## Arquitectura de Sincronización

### Base de datos principal (sistema_bd)
- `x_base`: Tiene campos `id_modelo`, `id_registro` (legacy, no se usan para múltiples)

### Mini-ERP (proyecto_moda)
- `registro.x_id_base`: Vincula cada registro a una base (relación N:1)
- `modelo`: Tabla de modelos con `id`, `detalle`

### Endpoints de Sincronización
- `GET /api/mini-erp/status` - Estado de conexión
- `GET /api/mini-erp/modelos` - Lista de modelos
- `GET /api/mini-erp/registros/sin-vincular` - Registros disponibles
- `GET /api/mini-erp/registros/vinculados/{id_base}` - Registros de una base
- `POST /api/mini-erp/sync/vincular` - Vincular registro a base
- `POST /api/mini-erp/sync/desvincular` - Desvincular registro

## Tareas Pendientes

### P1 - Verificación de Usuario
- [ ] Usuario debe probar la sincronización bidireccional
- [ ] Confirmar que funciona según sus expectativas

### P2 - Backlog
- [ ] Módulo 2: Producción y Materia Prima
- [ ] Edición en celda (in-cell editing)
- [ ] SKUs e inventario

### P3 - Refactorización
- [ ] Descomponer `Bases.js` en componentes más pequeños

## Archivos Clave
- `/app/backend/mini_erp_sync.py` - Lógica de sincronización
- `/app/frontend/src/pages/Bases.js` - UI con modal de registros ERP
- `/app/backend/server.py` - API endpoints
- `/app/frontend/src/pages/Dashboard.js` - Dashboard
