# ERP Textil - Módulo de Muestras

## Descripción del Proyecto
Sistema ERP textil full-stack (FastAPI + React + MariaDB) para gestión de desarrollo de muestras.

## Stack Tecnológico
- **Backend**: FastAPI, SQLAlchemy, Pydantic, MariaDB
- **Frontend**: React, TanStack Table, Tailwind CSS, Shadcn/UI
- **Almacenamiento**: Cloudflare R2 (AWS S3 compatible via boto3)
- **Autenticación**: JWT (python-jose), bcrypt (passlib)

## Características Implementadas ✅

### Dashboard con Métricas (15 Enero 2026)
- [x] Saludo personalizado al usuario
- [x] Estadísticas en tiempo real (muestras, bases, tizados, telas)
- [x] Indicador de aprobados vs pendientes
- [x] Barras de progreso de aprobación
- [x] Accesos rápidos a todos los módulos con contadores
- [x] Actividad reciente (solo admins) con historial de acciones
- [x] Alertas de items pendientes de aprobar

### Sistema de Autenticación y Autorización
- [x] Login con username y contraseña (JWT)
- [x] Roles: Super Admin, Admin, Editor, Viewer
- [x] Permisos personalizables por usuario
- [x] Permisos CRUD por módulo
- [x] Permisos de descarga/subida separados
- [x] **Aplicación de permisos en Frontend** (botones condicionados)

### Sistema de Auditoría
- [x] Registro automático de todas las acciones CRUD
- [x] Registro de logins y archivos
- [x] Datos anteriores/nuevos en ediciones
- [x] IP y User-Agent capturados
- [x] Página `/historial` con filtros

### UI/UX
- [x] Scroll horizontal en todas las tablas
- [x] Título personalizado "ERP Textil | Módulo Muestras"
- [x] Badge "Made with Emergent" eliminado

### Credenciales
- **Super Admin**: `eduard` / `cardenas007`

## Tareas Pendientes

### P1 - Prioridad Alta
- [ ] Sincronización con mini-ERP existente (pendiente credenciales)

### P2 - Backlog
- [ ] Módulo 2: Producción y Materia Prima
- [ ] Edición en celda
- [ ] SKUs e inventario

## Archivos Clave
- `/app/frontend/src/pages/Dashboard.js` - Dashboard con métricas
- `/app/frontend/public/index.html` - HTML personalizado
- `/app/backend/server.py` - API endpoints
- `/app/frontend/src/context/AuthContext.js` - Permisos frontend
