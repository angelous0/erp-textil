# GUÍA DE REPLICACIÓN - SISTEMA ERP TEXTIL

## 📋 RESUMEN
Este documento contiene toda la información necesaria para replicar el Sistema ERP Textil en otra cuenta de Emergent.

---

## 🎯 OPCIÓN 1: USAR EL PROMPT COMPLETO

### Paso 1: Preparar Credenciales
Antes de comenzar, ten a la mano las credenciales de tu base de datos MariaDB:
- Host
- Puerto
- Usuario
- Contraseña
- Nombre de la base de datos

### Paso 2: Copiar el Prompt
1. Abre el archivo `/app/PROMPT_PARA_REPLICAR.md`
2. Copia TODO el contenido
3. Reemplaza los marcadores de posición:
   - `[TU_HOST]` → tu host real
   - `[TU_PORT]` → tu puerto real
   - `[TU_USER]` → tu usuario real
   - `[TU_PASSWORD]` → tu contraseña real
   - `[TU_DB_NAME]` → nombre de tu base de datos
   - `https://textilauthplus.preview.emergentagent.com` → tu dominio de Emergent

### Paso 3: Crear Tablas en MariaDB
Ejecuta el script SQL `/app/backend/schema_completo.sql` en tu base de datos MariaDB:
```bash
mysql -h [HOST] -P [PORT] -u [USER] -p [DB_NAME] < schema_completo.sql
```

### Paso 4: Iniciar Proyecto en Emergent
1. Abre tu nueva cuenta de Emergent
2. Inicia un nuevo proyecto (React + FastAPI + MongoDB como base)
3. Pega el prompt completo que preparaste
4. El agente E1 construirá todo el sistema automáticamente

### Paso 5: Verificación
Después de que E1 termine:
1. Verifica que todas las páginas carguen
2. Prueba crear una Tela
3. Prueba crear una Muestra Base
4. Prueba crear una Base con Fichas
5. Verifica que la descarga de archivos funcione

---

## 🎯 OPCIÓN 2: REPLICACIÓN MANUAL

Si prefieres replicar manualmente o tienes un proyecto existente:

### Archivos Clave del Backend:
```
/app/backend/
├── database.py       → Conexión MariaDB con pymysql
├── models.py         → Modelos SQLAlchemy (Tela, Entalle, TipoProducto, MuestraBase, Base, Ficha, Tizado)
├── schemas.py        → Schemas Pydantic para validación
├── server.py         → FastAPI con todos los endpoints CRUD
├── requirements.txt  → pymysql, sqlalchemy, aiofiles, python-multipart
└── .env             → Credenciales de base de datos
```

### Archivos Clave del Frontend:
```
/app/frontend/src/
├── pages/
│   ├── Dashboard.js
│   ├── Telas.js
│   ├── Entalles.js
│   ├── TiposProducto.js
│   ├── MuestrasBase.js    → Con tabla de bases embebida
│   ├── Bases.js            → Con fichas Many-to-One y modal
│   └── Tizados.js
├── components/
│   ├── Layout.js
│   ├── ExcelGrid.js        → Grid editable con TanStack Table
│   └── FileUpload.js       → Upload con react-dropzone
├── App.js
├── App.css
└── index.css
```

### Dependencias Adicionales:
**Backend:**
```bash
pip install pymysql sqlalchemy aiofiles python-multipart
```

**Frontend:**
```bash
yarn add @tanstack/react-table react-dropzone
```

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

```
┌─────────────────┐
│  tipo_producto  │
└────────┬────────┘
         │
┌────────▼────────┐     ┌─────────────────┐
│ muestra_base    │────▶│  tela_desarrollo│
└────────┬────────┘     └─────────────────┘
         │              ┌─────────────────┐
         │              │entalle_desarrollo│
         └─────────────▶└─────────────────┘
         │
         │ (One-to-Many)
         │
┌────────▼────────┐
│      base       │
└────┬───────┬────┘
     │       │
     │       │ (One-to-Many)
     │       │
     │   ┌───▼─────┐
     │   │  ficha  │
     │   └─────────┘
     │
     │ (One-to-Many)
     │
 ┌───▼─────┐
 │ tizado  │
 └─────────┘
```

---

## 🎨 DISEÑO Y UX

### Colores:
- Background: Slate 50 (#f8fafc)
- Primary: Slate 900 (#0f172a)
- Accent: Blue 600 (#2563eb)
- Success: Green 600
- Warning: Orange 600
- Error: Red 600

### Fuentes:
- Headings: Chivo
- Body: Inter
- Data/Mono: JetBrains Mono

### Componentes Clave:
1. **ExcelGrid**: Tabla editable con búsqueda, ordenamiento y acciones
2. **FileUpload**: Drag & drop para archivos con preview
3. **Dialog Modal**: Formularios CRUD
4. **Badges**: Estados visuales (Aprobado/Pendiente, contadores)

---

## 🔧 FUNCIONALIDADES ESPECIALES

### 1. Descarga de Archivos
Implementado con fetch + blob para forzar descarga:
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

### 2. Fichas Many-to-One en Bases
- Tabla `ficha` separada con FK a `base`
- En grid: contador clickeable muestra modal con tabla
- En formulario: lista editable de fichas con add/remove

### 3. Bases Embebidas en Muestras
- Dentro del formulario de edición de Muestra Base
- Tabla tipo Excel mostrando todas las bases relacionadas
- Botón "Ver" abre modal con detalles completos

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend:
- [ ] Base de datos MariaDB configurada
- [ ] Tablas creadas con schema_completo.sql
- [ ] database.py con pymysql
- [ ] models.py con 7 modelos (Tela, Entalle, TipoProducto, MuestraBase, Base, Ficha, Tizado)
- [ ] schemas.py con schemas Pydantic
- [ ] server.py con endpoints CRUD para todas las entidades
- [ ] Endpoint /api/upload funcionando
- [ ] Endpoint /api/files/{filename} funcionando
- [ ] Carpeta uploads creada

### Frontend:
- [ ] Layout con sidebar oscuro
- [ ] Dashboard con estadísticas
- [ ] ExcelGrid component reutilizable
- [ ] FileUpload component con react-dropzone
- [ ] Página Telas (CRUD básico)
- [ ] Página Entalles (CRUD básico)
- [ ] Página Tipos Producto (CRUD básico)
- [ ] Página Muestras Base con tabla de bases embebida
- [ ] Página Bases con fichas Many-to-One y modales
- [ ] Página Tizados (CRUD básico)
- [ ] Descarga de archivos funcionando
- [ ] Eliminación sin confirm (directo con toast)

### Testing:
- [ ] Crear una Tela
- [ ] Crear un Entalle
- [ ] Crear un Tipo de Producto
- [ ] Crear una Muestra Base
- [ ] Editar Muestra Base y ver bases relacionadas
- [ ] Crear una Base con múltiples fichas
- [ ] Hacer clic en contador de fichas y ver modal
- [ ] Ver detalles de una Base desde Muestra Base
- [ ] Descargar un archivo
- [ ] Eliminar registros

---

## 🚀 SIGUIENTES PASOS (MÓDULO 2)

Después de implementar el Módulo 1, el siguiente paso es:

### MÓDULO 2: PRODUCCIÓN Y MATERIA PRIMA
- Tabla: materia_prima, rollo_tela, movimiento_rollo, stock_mp_cantidad, movimiento_mp_cantidad, orden_produccion
- Control de inventario por rollos (tela) y cantidad (otros insumos)
- Órdenes de producción solo desde Bases aprobadas
- Consumos de materia prima
- Trazabilidad completa

---

## 📞 SOPORTE

Si tienes dudas o problemas durante la replicación:
1. Revisa el archivo PROMPT_PARA_REPLICAR.md
2. Verifica que las credenciales de MariaDB sean correctas
3. Asegúrate de usar pymysql (NO asyncpg)
4. Verifica que las tablas se hayan creado correctamente
5. Revisa los logs de backend y frontend

**Puntos críticos:**
- ✅ Usar MariaDB con pymysql
- ✅ Tablas con nombres correctos (tela_desarrollo, entalle_desarrollo)
- ✅ Prefijo /api en todos los endpoints
- ✅ Descarga de archivos con fetch + blob
- ✅ Fichas como tabla separada (Many-to-One)

---

## 📁 ARCHIVOS DE ESTE PROYECTO

Todos los archivos importantes están en:
- `/app/PROMPT_PARA_REPLICAR.md` - Prompt completo
- `/app/backend/schema_completo.sql` - Script SQL
- `/app/README_ERP.md` - Documentación original
- `/app/design_guidelines.json` - Guías de diseño

¡Buena suerte con tu replicación! 🎉
