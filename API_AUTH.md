# API de Autenticación - Gatekeeper

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto backend con las siguientes variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=gatekeeper

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

### Base de Datos

1. Asegúrate de tener MySQL instalado y corriendo
2. Crea la base de datos: `CREATE DATABASE gatekeeper;`
3. Ejecuta las migraciones: `npm run db:push`

## Endpoints

### 1. Registro de Usuario

**POST** `/api/auth/register`

Crea un nuevo usuario en el sistema.

**Request Body:**

```json
{
  "username": "usuario123",
  "password": "contraseña123",
  "email": "usuario@example.com" // opcional
}
```

**Response (201):**

```json
{
  "token": "jwt-token-aqui",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**

- 400: Username y password son requeridos
- 409: El usuario ya existe / El email ya está registrado

### 2. Login

**POST** `/api/auth/login`

Autentica un usuario y devuelve un token JWT.

**Request Body:**

```json
{
  "username": "usuario123",
  "password": "contraseña123"
}
```

**Response (200):**

```json
{
  "token": "jwt-token-aqui",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**

- 400: Username y password son requeridos
- 401: Credenciales inválidas

### 3. Ruta Protegida (Ejemplo)

**GET** `/api/protected`

Ejemplo de endpoint que requiere autenticación.

**Headers:**

```
Authorization: Bearer jwt-token-aqui
```

**Response (200):**

```json
{
  "message": "Acceso exitoso a ruta protegida",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com"
  }
}
```

**Errores:**

- 401: Token de autorización requerido
- 401: Token inválido o expirado

## Uso del Middleware de Autenticación

Para proteger cualquier endpoint, usa el middleware `withAuth`:

```typescript
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";

async function protectedHandler(request: NextRequest, user: JWTPayload) {
  // El usuario autenticado está disponible en el parámetro 'user'
  return NextResponse.json({
    message: "Endpoint protegido",
    userId: user.userId,
  });
}

export const GET = withAuth(protectedHandler);
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Generar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Sincronizar esquema con la BD (desarrollo)
npm run db:push
```

## Estructura del Proyecto

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts
│       │   └── register/
│       │       └── route.ts
│       └── protected/
│           └── route.ts
└── lib/
    ├── auth.ts          # Utilidades JWT y hash
    ├── db.ts            # Configuración DB
    ├── middleware.ts    # Middleware de autenticación
    └── schema.ts        # Esquema de la BD
```
