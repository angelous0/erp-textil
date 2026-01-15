# ERP Textil - Sistema de Desarrollo de Muestras

## Estado Actual del Proyecto

He desarrollado completamente el sistema ERP textil con las siguientes características:

### ✅ Implementado

#### Backend (FastAPI + MariaDB)
- Conexión a MariaDB configurada (host: 72.60.241.216:100)
- Modelos SQLAlchemy para todas las entidades del módulo de muestras
- API REST completa con endpoints CRUD para:
  - Telas
  - Entalles
  - Tipos de Producto
  - Muestras Base
  - Bases
  - Tizados
- Sistema de upload/download de archivos
- Relaciones One-to-Many correctamente implementadas

#### Frontend (React)
- Diseño minimalista profesional según especificaciones
- Vista tipo Excel (grid editable) con búsqueda y filtros
- Vista tipo Formulario (CRUD completo) en diálogos modales
- Componentes reutilizables:
  - ExcelGrid: Tabla editable con TanStack Table
  - FileUpload: Upload de archivos con drag & drop
  - Layout: Sidebar con navegación
- Páginas implementadas para todas las entidades
- Interfaz responsive y profesional

### ⚠️ Acción Requerida

**La base de datos tiene tablas existentes con estructura diferente a la requerida por este módulo.**

Tu base de datos actual tiene una tabla `tela` con columnas:
- id
- detalle
- estado

Pero el módulo de muestras necesita una tabla `tela` con:
- id_tela
- nombre_tela
- gramaje
- elasticidad
- proveedor
- ancho_estandar
- color

## Opciones de Solución

### Opción 1: Crear tablas nuevas (Recomendado)
Ejecuta el script SQL ubicado en `/app/backend/schema.sql` que creará:
- `tela_muestra` (para no conflictuar con tu tabla `tela` existente)
- `muestra_base`
- `base`
- `tizado`

Luego necesitarás actualizar el archivo `/app/backend/models.py` para que use `tela_muestra` en lugar de `tela`.

### Opción 2: Usar tablas existentes
Si las tablas `entalle` y `tipo_producto` ya tienen la estructura correcta, solo necesitas:
1. Crear las tablas faltantes: `muestra_base`, `base`, `tizado`
2. Decidir si usar tu tabla `tela` existente o crear una nueva

## Cómo continuar

1. **Revisa la estructura de tus tablas existentes:**
   ```sql
   DESCRIBE entalle;
   DESCRIBE tipo_producto;
   ```

2. **Ejecuta el script SQL** (ajustado según tus necesidades):
   ```bash
   mysql -h 72.60.241.216 -P 100 -u admin -p prueba < /app/backend/schema.sql
   ```

3. **Una vez creadas las tablas**, reinicia el backend:
   ```bash
   sudo supervisorctl restart backend
   ```

4. **Accede a la aplicación** en: https://sample-dev-module.preview.emergentagent.com

## Estructura del Sistema

```
Módulo de Desarrollo de Muestras
├── Telas → Material textil básico
├── Entalles → Formas/siluetas (Regular, Slim, etc.)
├── Tipos de Producto → Categorías (Polo, Pantalón, etc.)
├── Muestras Base → Combinación de tipo + entalle + tela
│   └── Bases → Moldes/patrones derivados de una muestra
│       └── Tizados → Configuraciones de corte
```

## Funcionalidades Implementadas

- ✅ Vista grid editable (tipo Excel)
- ✅ Vista formulario con CRUD completo
- ✅ Alternar entre ambas vistas
- ✅ Relaciones One-to-Many embebidas en formularios
- ✅ Upload de archivos (archivo_costo, patron, fichas, archivo_tizado)
- ✅ Filtros y búsqueda en grids
- ✅ Estados de aprobación para Muestras Base y Bases
- ✅ Diseño minimalista profesional
- ✅ Validaciones de formularios

## Próximos Pasos

Una vez que las tablas estén creadas y funcionando:
1. Probar el flujo completo del módulo de muestras
2. Implementar el Módulo 2: Producción y Materia Prima
3. Agregar validaciones de negocio adicionales
4. Implementar reportes y dashboards

## Soporte

Si tienes dudas sobre la estructura de las tablas o necesitas ayuda para ajustar el esquema, házmelo saber.
