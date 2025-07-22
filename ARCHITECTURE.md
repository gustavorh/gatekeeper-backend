# Arquitectura Limpia - Gatekeeper Backend

Este proyecto implementa una arquitectura limpia por capas utilizando NestJS y Drizzle ORM con MySQL.

## Estructura de Carpetas

```
src/
├── domain/                 # Capa de Dominio
│   ├── entities/          # Entidades del dominio
│   ├── repositories/      # Interfaces de repositorios
│   └── services/          # Interfaces de servicios
├── application/           # Capa de Aplicación
│   ├── use-cases/        # Casos de uso
│   ├── dto/              # Data Transfer Objects
│   ├── services/         # Implementación de servicios
│   ├── modules/          # Módulos de aplicación
│   └── decorators/       # Decoradores personalizados
├── infrastructure/        # Capa de Infraestructura
│   ├── database/         # Configuración de base de datos
│   ├── repositories/     # Implementación de repositorios
│   └── config/           # Configuraciones
├── presentation/         # Capa de Presentación
│   ├── controllers/      # Controladores
│   ├── middleware/       # Middleware y Guards
│   └── decorators/       # Decoradores personalizados
└── utils/               # Utilidades
    └── rut-validator.ts # Validador de RUT chileno
```

## Capas de la Arquitectura

### 1. Dominio (Domain Layer)

- **Entidades**: Representan los conceptos del negocio (User, Role, Permission)
- **Repositorios**: Interfaces que definen contratos para acceso a datos
- **Servicios**: Interfaces para lógica de negocio

### 2. Aplicación (Application Layer)

- **Casos de Uso**: Orquestan la lógica de negocio
- **DTOs**: Objetos de transferencia de datos
- **Servicios**: Implementación de la lógica de negocio
- **Decoradores**: Validaciones personalizadas (ej: RUT)

### 3. Infraestructura (Infrastructure Layer)

- **Base de Datos**: Configuración y esquemas de Drizzle ORM con MySQL
- **Repositorios**: Implementación concreta de los repositorios
- **Configuración**: Variables de entorno y configuraciones

### 4. Presentación (Presentation Layer)

- **Controladores**: Manejan las peticiones HTTP
- **Middleware**: Autenticación, validación, etc.
- **Decoradores**: Funcionalidades personalizadas

## Funcionalidades Implementadas

### Autenticación JWT con RUT

- Registro de usuarios con RUT y email
- Login con RUT y contraseña
- Protección de rutas con Guards
- Validación de tokens
- Validación de formato RUT chileno

### Entidades del Dominio

- **User**: Usuarios del sistema (RUT, email, contraseña, etc.)
- **Role**: Roles de usuario
- **Permission**: Permisos del sistema

### Validación de RUT

- Formato XX.XXX.XXX-X
- Validación de dígito verificador
- Decorador personalizado `@IsRut()`

## Configuración

### Variables de Entorno

Copiar `env.example` a `.env` y configurar:

- `DATABASE_URL`: URL de conexión a MySQL
- `JWT_SECRET`: Clave secreta para JWT
- `PORT`: Puerto del servidor

### Base de Datos

```bash
# Generar migraciones
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Abrir Drizzle Studio
npm run db:studio
```

## Endpoints Disponibles

### Autenticación

- `POST /auth/register` - Registro de usuarios (RUT + email + contraseña)
- `POST /auth/login` - Login de usuarios (RUT + contraseña)

### Usuarios (Protegido)

- `GET /users/profile` - Obtener perfil del usuario actual

## Ejemplos de Uso

### Registro de Usuario

```json
{
  "rut": "12.345.678-9",
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

### Login de Usuario

```json
{
  "rut": "12.345.678-9",
  "password": "contraseña123"
}
```

## Tecnologías Utilizadas

- **NestJS**: Framework de Node.js
- **Drizzle ORM**: ORM para TypeScript
- **MySQL**: Base de datos relacional
- **JWT**: Autenticación con tokens
- **bcryptjs**: Hash de contraseñas
- **class-validator**: Validación de datos

## Próximos Pasos

1. Agregar validación de entrada más robusta
2. Agregar tests unitarios e integración
3. Implementar paginación y filtrado en las consultas
4. Mejorar la documentación de la API con Swagger
