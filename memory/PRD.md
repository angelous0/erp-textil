# ERP Textil - Módulo de Muestras

## Descripción del Proyecto
Sistema ERP textil full-stack (FastAPI + React + MariaDB) para gestión de desarrollo de muestras.

## Stack Tecnológico
- **Backend**: FastAPI, SQLAlchemy, Pydantic, MariaDB
- **Frontend**: React, TanStack Table, Tailwind CSS, Shadcn/UI
- **Almacenamiento**: Cloudflare R2 (AWS S3 compatible via boto3)
- **Autenticación**: JWT (python-jose), bcrypt (passlib)
- **Base de datos**: MariaDB (conexión externa)

## Características Implementadas

### Sistema de Autenticación y Autorización ✅
- [x] Login con username y contraseña (JWT)
- [x] Roles: Super Admin, Admin, Editor, Viewer
- [x] Permisos personalizables por usuario
- [x] Permisos CRUD por módulo (ver, crear, editar, eliminar)
- [x] Permisos de descarga separados por tipo
- [x] Permisos de subida separados por tipo
- [x] Panel de gestión de usuarios (solo admins)
- [x] **APLICACIÓN DE PERMISOS EN FRONTEND** (15 Enero 2026)
  - Botones Crear/Editar/Eliminar condicionados según permisos
  - Botones de descarga condicionados según permisos
  - Botón de subida de imagen condicionado según permisos

### Sistema de Auditoría ✅ (15 Enero 2026)
- [x] Registro automático de todas las acciones CRUD
- [x] Registro de logins/logouts
- [x] Registro de subida/eliminación de archivos
- [x] Almacenamiento de datos anteriores y nuevos en ediciones
- [x] Captura de IP y User-Agent del usuario
- [x] Página `/historial` con filtros y estadísticas (solo admins)

### Responsive / Scroll Horizontal ✅ (15 Enero 2026)
- [x] Todas las tablas ahora tienen scroll horizontal
- [x] `min-width` establecido para evitar columnas ocultas
- [x] ExcelGrid component actualizado
- [x] Páginas actualizadas: Usuarios, Historial, MuestrasBase, Bases

### Super Admin
- **Username**: `eduard`
- **Password**: `cardenas007`

## Entidades del Sistema

### Módulo 1: Desarrollo de Muestras
- `x_marca`, `tipo_producto`, `x_entalle_desarrollo`, `x_tela_desarrollo`
- `x_muestra_base`, `x_base`, `x_tizado`, `x_ficha`

### Módulo de Usuarios y Permisos
- `x_usuario`, `x_permiso_usuario`

### Módulo de Auditoría
- `x_historial_movimiento`

## Tareas Pendientes

### P1 - Prioridad Alta
- [ ] Sincronización con mini-ERP existente (pendiente credenciales)

### P2 - Prioridad Media
- [ ] Implementar Módulo 2: Producción y Materia Prima
- [ ] Dashboard con métricas

### P3 - Backlog
- [ ] Edición en celda (In-cell editing)
- [ ] SKUs e inventario

## Archivos Clave
- `/app/backend/server.py` - Endpoints API con auditoría
- `/app/backend/auth.py` - Lógica de autenticación
- `/app/backend/audit.py` - Sistema de auditoría
- `/app/frontend/src/context/AuthContext.js` - Contexto con funciones de permisos
- `/app/frontend/src/pages/*.js` - Páginas con permisos aplicados
- `/app/frontend/src/components/ExcelGrid.js` - Grid con scroll horizontal

## Convenciones
- Todas las tablas nuevas usan prefijo `x_`
- Los archivos se almacenan con UUID como nombre
- Auditoría automática en todas las operaciones CUD
- Permisos verificados en frontend Y backend
