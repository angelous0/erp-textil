# PROMPT PARA REPLICAR SISTEMA ERP TEXTIL EN EMERGENT

Copia y pega este prompt completo en un nuevo agente de Emergent:

---

## INSTRUCCIONES PARA E1

Necesito que construyas un **Sistema ERP Textil** completo para gestión de desarrollo de muestras, producción y materia prima.

### STACK TECNOLÓGICO
- **Backend**: FastAPI + MariaDB (NO PostgreSQL, NO MongoDB)
- **Frontend**: React + TanStack Table + Shadcn UI
- **Base de Datos**: MariaDB existente con credenciales que proporcionaré

### CREDENCIALES DE BASE DE DATOS
```
Host: [TU_HOST]
Port: [TU_PORT]
User: [TU_USER]
Password: [TU_PASSWORD]
Database: [TU_DB_NAME]
```

### MÓDULO 1: DESARROLLO DE MUESTRAS (PRIORIDAD)

#### MODELO DE DATOS

**1. TELA (tela_desarrollo)**
- id_tela (PK, autoincrement)
- nombre_tela (varchar 255, NOT NULL)
- gramaje (decimal 10,2)
- elasticidad (varchar 100)
- proveedor (varchar 255)
- ancho_estandar (decimal 10,2)
- color (ENUM: 'Azul', 'Negro')

**2. ENTALLE (entalle_desarrollo)**
- id_entalle (PK, autoincrement)
- nombre_entalle (varchar 255, NOT NULL)

**3. TIPO_PRODUCTO (tipo_producto)**
- id_tipo (PK, autoincrement)
- nombre_tipo (varchar 255, NOT NULL)

**4. MUESTRA_BASE (muestra_base)**
- id_muestra_base (PK, autoincrement)
- id_tipo (FK → tipo_producto.id_tipo, NOT NULL)
- id_entalle (FK → entalle_desarrollo.id_entalle, NOT NULL)
- id_tela (FK → tela_desarrollo.id_tela, NOT NULL)
- consumo_estimado (decimal 10,2)
- costo_estimado (decimal 10,2)
- archivo_costo (varchar 500)
- aprobado (boolean, default FALSE)

**5. BASE (base)**
- id_base (PK, autoincrement)
- id_muestra_base (FK → muestra_base.id_muestra_base, NOT NULL, ON DELETE CASCADE)
- patron (varchar 500)
- aprobado (boolean, default FALSE)

**6. FICHA (ficha)** - Relación Many-to-One con Base
- id_ficha (PK, autoincrement)
- id_base (FK → base.id_base, NOT NULL, ON DELETE CASCADE)
- nombre_ficha (varchar 255)
- archivo (varchar 500)

**7. TIZADO (tizado)**
- id_tizado (PK, autoincrement)
- id_base (FK → base.id_base, NOT NULL, ON DELETE CASCADE)
- archivo_tizado (varchar 500)
- curva (TEXT)

#### RELACIONES
- MUESTRA_BASE → BASE (One-to-Many)
- BASE → FICHA (One-to-Many)
- BASE → TIZADO (One-to-Many)

### REQUISITOS FUNCIONALES

#### BACKEND (FastAPI)
1. Usar **MariaDB con pymysql** (NO asyncpg, NO PostgreSQL)
2. SQLAlchemy ORM con modelos síncronos
3. Endpoints CRUD completos para todas las entidades
4. Sistema de upload/download de archivos:
   - POST /api/upload (multipart/form-data)
   - GET /api/files/{filename} (FileResponse)
   - Guardar archivos en /app/backend/uploads/
5. Todos los endpoints deben tener prefijo `/api`
6. Relaciones con `joinedload` para optimizar queries
7. Manejo correcto de campos opcionales (null cuando están vacíos)

#### FRONTEND (React)
1. **Diseño minimalista profesional** con:
   - Fuente: Chivo (headings), Inter (body), JetBrains Mono (datos)
   - Colores: Slate 50 background, Slate 900 primary, Blue 600 accent
   - Sidebar oscuro con textura sutil
   
2. **Vista Grid Tipo Excel** para cada entidad:
   - Usar @tanstack/react-table
   - Búsqueda global con Input
   - Botón "Agregar" en la esquina superior derecha
   - Columnas con datos formateados (font-mono para números/IDs)
   - Botones de acción: Editar (lápiz azul) y Eliminar (basurero rojo)
   - NO usar window.confirm para eliminar (eliminar directo con toast)

3. **Vista Formulario (Dialog Modal)** para CRUD:
   - Usar Dialog de Shadcn UI
   - Campos con Labels claros
   - Select para relaciones FK
   - Switch para campos boolean (aprobado)
   - FileUpload para archivos con react-dropzone
   - Validación de campos requeridos

4. **Funcionalidad de Descarga de Archivos**:
   ```javascript
   const handleDownloadFile = async (filename) => {
     const response = await fetch(`${API}/files/${filename}`);
     const blob = await response.blob();
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     window.URL.revokeObjectURL(url);
     document.body.removeChild(a);
     toast.success('Archivo descargado');
   };
   ```

5. **Página de BASES con Fichas Many-to-One**:
   - Columna "FICHAS" en grid con contador clickeable (ej: "3 fichas")
   - Al hacer clic, abrir modal con tabla mostrando:
     * #, Nombre de Ficha, Archivo (botón descargar)
   - En formulario de edición/creación:
     * Botón "+ Agregar Ficha" 
     * Lista de fichas con inputs para nombre y upload de archivo individual
     * Botón X para eliminar cada ficha
     * Guardar fichas usando endpoint /api/fichas

6. **Página de MUESTRAS BASE con Bases Embebidas**:
   - En el formulario de edición, mostrar tabla embebida "Bases Relacionadas"
   - Tabla tipo Excel con columnas:
     * ID Base, Patrón, Fichas (contador), Tizados (contador), Estado, Acciones
   - Botón "Ver" para cada base que abre modal con:
     * Detalles generales de la base
     * Tabla de Fichas Técnicas
     * Tabla de Tizados
     * Todos con opciones de descarga

7. **Badges para Estados**:
   - Aprobado: verde con CheckCircle icon
   - Pendiente: gris con XCircle icon
   - Fichas/Tizados: azul/púrpura con contador

### PÁGINAS A IMPLEMENTAR
1. Dashboard (estadísticas básicas + acceso a módulos)
2. Telas
3. Entalles
4. Tipos de Producto
5. Muestras Base (con tabla de bases embebida en formulario)
6. Bases (con fichas Many-to-One y modal de visualización)
7. Tizados

### LAYOUT
- Sidebar izquierdo oscuro (bg-slate-900) con:
  * Logo "ERP Textil"
  * Menú de navegación con iconos (lucide-react)
  * Footer con versión
- Header superior con título de página actual
- Área principal con padding para contenido

### CONFIGURACIÓN IMPORTANTE

**Backend .env:**
```
PG_HOST=TU_HOST
PG_PORT=TU_PORT
PG_USER=TU_USER
PG_PASSWORD=TU_PASSWORD
PG_DB=TU_DB_NAME
UPLOAD_DIR=/app/backend/uploads
CORS_ORIGINS=*
```

**Frontend .env:**
```
REACT_APP_BACKEND_URL=https://TU-DOMINIO.preview.emergentagent.com
```

**Backend database.py:**
```python
DATABASE_URL = f"mysql+pymysql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True, pool_recycle=3600)
```

### INSTALACIÓN DE DEPENDENCIAS

**Backend:**
```bash
pip install pymysql sqlalchemy aiofiles python-multipart
```

**Frontend:**
```bash
yarn add @tanstack/react-table react-dropzone
```

### ORDEN DE IMPLEMENTACIÓN
1. Crear tablas en MariaDB (tela_desarrollo, entalle_desarrollo, tipo_producto, muestra_base, base, ficha, tizado)
2. Backend: models.py, schemas.py, database.py, server.py
3. Frontend: Layout, ExcelGrid component, FileUpload component
4. Páginas básicas: Telas, Entalles, Tipos Producto
5. Páginas avanzadas: Muestras Base (con bases embebidas), Bases (con fichas), Tizados
6. Testing completo

### VALIDACIONES IMPORTANTES
- Campos opcionales se envían como `null` cuando están vacíos (no strings vacíos)
- Parsear correctamente integers y floats antes de enviar al backend
- Manejo de errores con try/catch y mostrar mensajes con toast

### PUNTOS CRÍTICOS A NO OLVIDAR
1. ✅ Usar **MariaDB** (mysql+pymysql), NO PostgreSQL
2. ✅ Prefijo `/api` en todos los endpoints del backend
3. ✅ Las tablas "tela" y "entalle" YA EXISTEN con estructura diferente, usar "tela_desarrollo" y "entalle_desarrollo"
4. ✅ Descarga de archivos con fetch + blob (NO usar <a> con href directo)
5. ✅ Eliminar sin window.confirm (directo con toast)
6. ✅ Fichas es Many-to-One (tabla separada, no columna TEXT)
7. ✅ Mostrar bases relacionadas dentro del formulario de Muestra Base
8. ✅ Modal clickeable en contador de fichas para ver tabla
9. ✅ Diseño minimalista profesional (NO colores vibrantes ni gradientes oscuros)

### TESTING
Después de implementar, usa el testing agent para verificar:
- CRUD de todas las entidades
- Upload y descarga de archivos
- Relaciones One-to-Many funcionando
- Formularios embebidos de Muestras Base
- Modal de fichas clickeable

---

## NOTAS ADICIONALES
- Este es el Módulo 1 solamente (Desarrollo de Muestras)
- Módulo 2 (Producción y Materia Prima) se implementará después
- El sistema debe ser rápido, funcional y con diseño profesional
- Priorizar funcionalidad sobre animaciones complejas
