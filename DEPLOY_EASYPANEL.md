# 🚀 Guía de Despliegue en EasyPanel

## Información del Proyecto
- **Dominio**: https://bases.ambissionindustries.cloud
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React (Node 18)
- **Base de datos**: MariaDB externa (72.60.241.216:3030)
- **Almacenamiento**: Cloudflare R2

---

## 📋 Paso 1: Guardar código en GitHub

1. En Emergent, haz clic en **"Save to GitHub"**
2. Selecciona o crea un repositorio
3. Haz push del código

---

## 📋 Paso 2: Crear proyecto en EasyPanel

1. Entra a tu EasyPanel
2. Crea un nuevo proyecto llamado `erp-textil`

---

## 📋 Paso 3: Crear servicio BACKEND

### 3.1 Crear App desde GitHub
- **Nombre**: `backend`
- **Fuente**: GitHub → tu repositorio
- **Branch**: main
- **Ruta del Dockerfile**: `/backend/Dockerfile`

### 3.2 Variables de entorno del Backend
Copia y pega estas variables:

```
PG_HOST=72.60.241.216
PG_PORT=3030
PG_USER=admin
PG_PASSWORD=admin
PG_DB=sistema_bd
MINI_ERP_URL=mysql+pymysql://admin:Proyectomoda%4004072001@72.60.241.216:8000/proyecto_moda
R2_ACCOUNT_ID=250ad6553555f2b70048aff3d363c852
R2_ACCESS_KEY_ID=56bc9416e2b56513a03f8d1703914843
R2_SECRET_ACCESS_KEY=a24f4aded40d1f02466e6ca784607cdea8283698191e72004c4eda07696e87fb
R2_BUCKET_NAME=erp-textil-archivos
R2_PUBLIC_URL=https://erp-textil-achivos.250ad6553555f2b70048aff3d363c852.r2.cloudflarestorage.com
CORS_ORIGINS=https://bases.ambissionindustries.cloud
```

### 3.3 Configurar dominio del Backend
- **Dominio**: `api.bases.ambissionindustries.cloud` (o usa path `/api`)
- **Puerto interno**: 8001
- **HTTPS**: Activado

---

## 📋 Paso 4: Crear servicio FRONTEND

### 4.1 Crear App desde GitHub
- **Nombre**: `frontend`
- **Fuente**: GitHub → tu repositorio
- **Branch**: main
- **Ruta del Dockerfile**: `/frontend/Dockerfile`

### 4.2 Build Arguments del Frontend
En la sección de Build Args:

```
REACT_APP_BACKEND_URL=https://api.bases.ambissionindustries.cloud
```

> **Nota**: Ajusta esta URL según cómo configures el backend (subdominio o path)

### 4.3 Configurar dominio del Frontend
- **Dominio**: `bases.ambissionindustries.cloud`
- **Puerto interno**: 80
- **HTTPS**: Activado

---

## 📋 Paso 5: Configurar DNS

En Cloudflare (o tu proveedor DNS), agrega:

| Tipo | Nombre | Contenido |
|------|--------|-----------|
| A | bases | IP de tu EasyPanel |
| A | api.bases | IP de tu EasyPanel |

---

## 📋 Paso 6: Desplegar

1. Primero despliega el **Backend**
2. Espera a que esté activo (verde)
3. Luego despliega el **Frontend**

---

## 🔧 Opción Alternativa: Un solo dominio con proxy

Si prefieres usar un solo dominio (`bases.ambissionindustries.cloud`):

### En EasyPanel para el Frontend:
Configura un proxy inverso para `/api/*` que redirija al backend:

```nginx
location /api/ {
    proxy_pass http://backend:8001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Y usa `REACT_APP_BACKEND_URL=https://bases.ambissionindustries.cloud`

---

## 🧪 Verificar instalación

1. Abre https://bases.ambissionindustries.cloud
2. Intenta hacer login con:
   - **Usuario**: eduard
   - **Password**: cardenas007

---

## ❗ Problemas comunes

### Error de CORS
- Verifica que `CORS_ORIGINS` incluya tu dominio exacto
- Incluye `https://`

### Frontend no carga datos
- Verifica que `REACT_APP_BACKEND_URL` apunte al backend correcto
- Revisa los logs del backend en EasyPanel

### Error de conexión a BD
- Verifica que tu IP de EasyPanel tenga acceso al servidor MariaDB
- Puede que necesites agregar la IP al firewall

---

## 📞 Soporte

Si tienes problemas, revisa los logs en EasyPanel:
- **Backend logs**: Ver errores de conexión a BD o API
- **Frontend logs**: Ver errores de build
