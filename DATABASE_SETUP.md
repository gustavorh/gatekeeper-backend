# Configuración de Base de Datos MySQL

## Opciones de Configuración

### Opción 1: URL Completa (Recomendado para desarrollo)

En tu archivo `.env`:

```env
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/gatekeeper
```

### Opción 2: Variables Separadas (Recomendado para producción)

En tu archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=gatekeeper
```

## Configuración de MySQL

### 1. Instalar MySQL

**macOS (usando Homebrew):**

```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
Descargar e instalar desde [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)

### 2. Configurar MySQL

```bash
# Acceder a MySQL como root
mysql -u root -p

# Crear la base de datos
CREATE DATABASE gatekeeper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Crear usuario específico (opcional pero recomendado)
CREATE USER 'gatekeeper_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON gatekeeper.* TO 'gatekeeper_user'@'localhost';
FLUSH PRIVILEGES;

# Salir de MySQL
EXIT;
```

### 3. Configurar Variables de Entorno

Copia `env.example` a `.env` y configura según tu setup:

**Para desarrollo local:**

```env
DATABASE_URL=mysql://gatekeeper_user:tu_contraseña_segura@localhost:3306/gatekeeper
```

**Para producción:**

```env
DB_HOST=tu-servidor-mysql.com
DB_PORT=3306
DB_USER=gatekeeper_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=gatekeeper
```

## Generar y Ejecutar Migraciones

```bash
# Generar migraciones basadas en el esquema
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Abrir Drizzle Studio para ver la base de datos
npm run db:studio
```

## Verificar Conexión

```bash
# Probar la conexión
npm run start:dev
```

Si todo está configurado correctamente, deberías ver que la aplicación inicia sin errores de conexión a la base de datos.

## Troubleshooting

### Error: "Access denied for user"

- Verifica que el usuario existe y tiene permisos
- Asegúrate de que la contraseña es correcta
- Verifica que el host está permitido

### Error: "Unknown database"

- Ejecuta el script `scripts/setup-database.sql`
- Verifica que la base de datos existe

### Error: "Connection refused"

- Verifica que MySQL está ejecutándose
- Verifica el puerto (por defecto 3306)
- Verifica que el firewall no está bloqueando la conexión
