# ERP Textil - Módulo de Muestras

## Descripción del Proyecto
Sistema ERP textil full-stack (FastAPI + React + MariaDB) para gestión de desarrollo de muestras.

## Stack Tecnológico
- **Backend**: FastAPI, SQLAlchemy, Pydantic, MariaDB
- **Frontend**: React, TanStack Table, Tailwind CSS, Shadcn/UI
- **Almacenamiento**: Cloudflare R2 (AWS S3 compatible via boto3)
- **Autenticación**: JWT (python-jose), bcrypt (passlib)
- **Base de datos**: MariaDB (conexión externa)

## Entidades del Sistema

### Módulo 1: Desarrollo de Muestras (Implementado)
- `x_marca`: {id_marca, nombre_marca}
- `tipo_producto`: {id_tipo, nombre_tipo}
- `x_entalle_desarrollo`: {id_entalle, nombre_entalle}
- `x_tela_desarrollo`: {id_tela, nombre_tela, clasificacion, precio, gramaje, elasticidad, proveedor, ancho_estandar, color}
- `x_muestra_base`: {id_muestra_base, id_tipo, id_entalle, id_tela, id_marca, consumo_estimado, costo_estimado, precio_estimado, archivo_costo, aprobado}
- `x_base`: {id_base, id_muestra_base, modelo, patron, imagen, aprobado}
- `x_tizado`: {id_tizado, id_base, ancho, archivo_tizado, curva}
- `x_ficha`: {id_ficha, id_base, nombre_ficha, archivo}

### Módulo de Usuarios y Permisos
- `x_usuario`: {id_usuario, username, email, password_hash, nombre, rol, activo, created_at}
- `x_permiso_usuario`: {id_permiso, id_usuario, [permisos CRUD por módulo], [permisos de descarga], [permisos de subida]}

### Módulo de Auditoría (NUEVO)
- `x_historial_movimiento`: {id_movimiento, id_usuario, username, fecha_hora, tabla, accion, id_registro, descripcion, datos_anteriores, datos_nuevos, ip_address, user_agent}

## Características Implementadas

### Sistema de Autenticación y Autorización
- [x] Login con username y contraseña (JWT)
- [x] Roles: Super Admin, Admin, Editor, Viewer
- [x] Permisos personalizables por usuario
- [x] Permisos CRUD por módulo (ver, crear, editar, eliminar)
- [x] Permisos de descarga separados por tipo (patrones, tizados, fichas, imágenes, costos)
- [x] Permisos de subida separados por tipo
- [x] Panel de gestión de usuarios (solo admins)
- **Super Admin**: eduard / cardenas007

### Sistema de Auditoría (NUEVO - 15 Enero 2026)
- [x] Registro automático de todas las acciones CRUD
- [x] Registro de logins/logouts
- [x] Registro de subida/eliminación de archivos
- [x] Almacenamiento de datos anteriores y nuevos en ediciones
- [x] Captura de IP y User-Agent del usuario
- [x] Página `/historial` con filtros y estadísticas (solo admins)
- [x] Búsqueda por usuario, tabla, acción, rango de fechas
- [x] Detalle de movimientos con visualización JSON

### Backend
- [x] CRUD completo para todas las entidades
- [x] Subida de archivos a Cloudflare R2 (boto3)
- [x] Descarga de archivos desde R2 (StreamingResponse)
- [x] Eliminación de archivos de R2
- [x] API RESTful con prefijo /api
- [x] Auditoría automática en todos los endpoints CUD

### Frontend
- [x] Páginas CRUD para: Marcas, Tipos Producto, Entalles, Telas, Muestras Base, Bases, Tizados
- [x] Filtros de estado (Aprobado/Pendiente)
- [x] Búsqueda avanzada multi-campo
- [x] Modal de Tizados y Fichas anidado en Bases
- [x] Modales de confirmación de eliminación
- [x] Descarga de archivos desde R2
- [x] Visor de imágenes ampliadas con descarga
- [x] Badges estilizados para archivos (color según tipo)
- [x] Página de gestión de usuarios
- [x] Página de historial de movimientos

## Endpoints API

### Autenticación
- `POST /api/auth/login` - Login (devuelve JWT)
- `GET /api/auth/me` - Usuario actual
- `GET /api/auth/me/permisos` - Permisos del usuario actual

### Usuarios (requiere admin)
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `GET/PUT/DELETE /api/usuarios/{id}` - CRUD usuario específico
- `GET/PUT /api/usuarios/{id}/permisos` - Permisos de usuario

### Historial (requiere admin)
- `GET /api/historial` - Listar movimientos (con filtros y paginación)
- `GET /api/historial/stats` - Estadísticas
- `GET /api/historial/tablas` - Tablas disponibles
- `GET /api/historial/{id}` - Detalle de movimiento

### Archivos
- `POST /api/upload` - Subir archivo
- `GET /api/files/{filename}` - Descargar archivo
- `DELETE /api/files/{filename}` - Eliminar archivo

### CRUD (todas las entidades)
- `GET/POST /api/{entidad}` - Listar/Crear
- `GET/PUT/DELETE /api/{entidad}/{id}` - CRUD específico

## Tareas Pendientes

### P0 - Verificación Usuario
- [x] Sistema de permisos granulares implementado

### P1 - Prioridad Alta
- [ ] Aplicar permisos en el Frontend (ocultar botones según permisos)
- [ ] Sincronización con mini-ERP existente (pendiente credenciales)

### P2 - Prioridad Media
- [ ] Implementar Módulo 2: Producción y Materia Prima
- [ ] Dashboard con métricas

### P3 - Backlog
- [ ] Edición en celda (In-cell editing)
- [ ] SKUs e inventario

## Archivos Clave
- `/app/backend/server.py` - Endpoints API
- `/app/backend/auth.py` - Lógica de autenticación
- `/app/backend/audit.py` - Sistema de auditoría
- `/app/backend/models.py` - Modelos SQLAlchemy
- `/app/backend/schemas.py` - Schemas Pydantic
- `/app/frontend/src/pages/Historial.js` - Página de historial
- `/app/frontend/src/pages/Usuarios.js` - Gestión de usuarios
- `/app/frontend/src/context/AuthContext.js` - Contexto de autenticación

## Convenciones
- Todas las tablas nuevas usan prefijo `x_`
- Los archivos se almacenan con UUID como nombre
- Auditoría automática en todas las operaciones CUD
