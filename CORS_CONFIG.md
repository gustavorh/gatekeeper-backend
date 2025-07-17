# Configuración de CORS para Gatekeeper Backend

## Descripción

Este proyecto incluye una configuración completa de CORS (Cross-Origin Resource Sharing) que permite que el frontend pueda consumir los servicios del backend desde múltiples puertos de desarrollo.

## Configuración Actual

### Desarrollo

- **Orígenes permitidos**: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:3001`, `http://127.0.0.1:3001`
- **Métodos permitidos**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Headers permitidos**: `Content-Type`, `Authorization`, `X-Requested-With`, `Accept`, `Origin`
- **Credenciales**: Habilitadas

### Producción

- **Orígenes permitidos**: Se configura via variable de entorno `FRONTEND_URL`
- **Métodos y headers**: Los mismos que en desarrollo
- **Credenciales**: Habilitadas

## Prueba de CORS

### Endpoint de Prueba

Puedes probar si CORS está funcionando correctamente visitando:

```
GET http://localhost:9000/api/test-cors
```

### Desde el Frontend

```javascript
// Prueba simple desde la consola del navegador
fetch("http://localhost:9000/api/test-cors", {
  method: "GET",
  credentials: "include",
})
  .then((response) => response.json())
  .then((data) => console.log("CORS working:", data))
  .catch((error) => console.error("CORS error:", error));
```

## Variables de Entorno

Crea un archivo `.env.local` en el directorio `backend/` con las siguientes variables:

```env
# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/gatekeeper

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration (for production)
FRONTEND_URL=https://your-frontend-domain.com

# Environment
NODE_ENV=development
```

## Archivos Modificados

### 1. `src/lib/cors.ts`

Middleware de CORS que se aplica a todas las rutas de API.

### 2. `src/lib/config.ts`

Configuración centralizada que maneja diferentes entornos.

### 3. `middleware.ts`

Middleware global de Next.js que aplica CORS a nivel de aplicación.

### 4. Rutas de API actualizadas:

- `src/app/api/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/protected/route.ts`
- `src/app/api/test-cors/route.ts` (nuevo endpoint de prueba)

## Cómo usar desde el Frontend

### Configuración base para diferentes puertos:

Si tu frontend está en `localhost:3000`:

```javascript
const API_BASE_URL = "http://localhost:9000/api";
```

Si tu frontend está en `localhost:3001`:

```javascript
const API_BASE_URL = "http://localhost:9000/api";
```

### Ejemplo con fetch:

```javascript
const response = await fetch("http://localhost:9000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Importante para cookies/credenciales
  body: JSON.stringify({
    username: "usuario",
    password: "contraseña",
  }),
});
```

### Ejemplo con axios:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:9000/api",
  withCredentials: true, // Para incluir cookies
});

// Login
const response = await api.post("/auth/login", {
  username: "usuario",
  password: "contraseña",
});
```

## Solución de Problemas

### Error: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Pasos de debugging:**

1. **Verificar que el backend esté corriendo:**

   ```bash
   curl http://localhost:9000/api/test-cors
   ```

2. **Verificar headers CORS desde el navegador:**

   - Abre las herramientas de desarrollo (F12)
   - Ve a la pestaña Network
   - Realiza la petición
   - Verifica que los headers incluyan:
     - `Access-Control-Allow-Origin: http://localhost:3001` (tu origen)
     - `Access-Control-Allow-Credentials: true`

3. **Verificar el origen en el servidor:**
   El endpoint `/api/test-cors` te dirá qué origen está recibiendo el servidor.

4. **Verificar el middleware:**
   Asegúrate de que el archivo `middleware.ts` esté en la raíz del directorio `backend/`

5. **Reiniciar el servidor:**
   ```bash
   cd backend
   npm run dev
   ```

### Error: "Credentials mode is 'include' but the Access-Control-Allow-Credentials header is not present"

- Verifica que estés usando `credentials: 'include'` en tus requests
- Asegúrate de que el middleware de CORS esté aplicado correctamente

### Error: "CORS header 'Access-Control-Allow-Origin' does not match"

- Verifica que tu frontend esté corriendo en un puerto permitido (3000 o 3001)
- Revisa que el archivo `src/lib/config.ts` incluya tu puerto
- Usa las herramientas de desarrollo para verificar qué origen está enviando tu frontend

### Configuración para otros puertos

Para permitir otros puertos, actualiza el archivo `src/lib/config.ts`:

```typescript
allowedOrigins: process.env.NODE_ENV === "production"
  ? [process.env.FRONTEND_URL || "https://your-frontend-domain.com"]
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3002", // Agrega más puertos si es necesario
    ],
```

## Comandos para Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# El backend se ejecutará en http://localhost:9000
```

## Debugging Avanzado

### Verificar configuración actual:

```bash
# Desde el directorio backend
node -e "console.log('Config:', require('./src/lib/config.ts').default.cors)"
```

### Probar CORS manualmente:

```bash
# Preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v http://localhost:9000/api/auth/login

# Actual request
curl -X POST \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v http://localhost:9000/api/auth/login
```

## Seguridad

⚠️ **Importante**: En producción, asegúrate de:

1. Configurar correctamente la variable `FRONTEND_URL`
2. Usar un `JWT_SECRET` seguro
3. Configurar HTTPS en tu servidor de producción
4. Revisar que solo los dominios necesarios estén en `allowedOrigins`
5. Remover el endpoint `/api/test-cors` en producción
