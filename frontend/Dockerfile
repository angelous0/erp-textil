# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias con flags para resolver conflictos
# También instalamos ajv explícitamente para resolver el error de módulo
RUN npm install --legacy-peer-deps && \
    npm install ajv@8 ajv-keywords@5 --legacy-peer-deps

# Copiar código fuente
COPY . .

# Argumento para la URL del backend
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build de producción usando react-scripts directamente (evita problemas de craco)
RUN npm run build || (npm install react-scripts --legacy-peer-deps && npx react-scripts build)

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
