import { db } from "./db";
import { roles, userRoles, users } from "./schema";
import { eq, isNull, and } from "drizzle-orm";

export const PERMISSIONS = {
  TIME_TRACKING: {
    READ_OWN: "time_tracking.read_own",
    WRITE_OWN: "time_tracking.write_own",
    READ_ALL: "time_tracking.read_all",
    WRITE_ALL: "time_tracking.write_all",
  },
  STATISTICS: {
    READ_OWN: "statistics.read_own",
    READ_ALL: "statistics.read_all",
    WRITE_ALL: "statistics.write_all",
  },
  USER_MANAGEMENT: {
    READ: "user_management.read",
    WRITE: "user_management.write",
    DELETE: "user_management.delete",
  },
  SYSTEM_SETTINGS: {
    READ: "system_settings.read",
    WRITE: "system_settings.write",
  },
  ROLES: {
    READ: "roles.read",
    WRITE: "roles.write",
  },
} as const;

export const ROLE_DEFINITIONS = {
  ADMIN: {
    name: "admin",
    description: "Administrador del sistema con acceso completo",
    permissions: [
      PERMISSIONS.TIME_TRACKING.READ_OWN,
      PERMISSIONS.TIME_TRACKING.WRITE_OWN,
      PERMISSIONS.TIME_TRACKING.READ_ALL,
      PERMISSIONS.TIME_TRACKING.WRITE_ALL,
      PERMISSIONS.STATISTICS.READ_OWN,
      PERMISSIONS.STATISTICS.READ_ALL,
      PERMISSIONS.STATISTICS.WRITE_ALL,
      PERMISSIONS.USER_MANAGEMENT.READ,
      PERMISSIONS.USER_MANAGEMENT.WRITE,
      PERMISSIONS.USER_MANAGEMENT.DELETE,
      PERMISSIONS.SYSTEM_SETTINGS.READ,
      PERMISSIONS.SYSTEM_SETTINGS.WRITE,
      PERMISSIONS.ROLES.READ,
      PERMISSIONS.ROLES.WRITE,
    ],
  },
  EMPLOYEE: {
    name: "employee",
    description: "Empleado con acceso básico a funciones de registro de tiempo",
    permissions: [
      PERMISSIONS.TIME_TRACKING.READ_OWN,
      PERMISSIONS.TIME_TRACKING.WRITE_OWN,
      PERMISSIONS.STATISTICS.READ_OWN,
    ],
  },
} as const;

export async function initializeRBAC() {
  try {
    console.log("Inicializando sistema RBAC...");

    // Crear roles básicos
    for (const [key, roleData] of Object.entries(ROLE_DEFINITIONS)) {
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      if (existingRole.length === 0) {
        await db.insert(roles).values({
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          isActive: true,
        });
        console.log(`✓ Rol '${roleData.name}' creado`);
      } else {
        console.log(`- Rol '${roleData.name}' ya existe`);
      }
    }

    // Asignar rol 'employee' por defecto a usuarios existentes que no tengan rol
    const employeeRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "employee"))
      .limit(1);

    if (employeeRole.length > 0) {
      const roleId = employeeRole[0].id;

      // Obtener usuarios sin roles
      const usersWithoutRoles = await db
        .select({ userId: users.id })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .where(isNull(userRoles.userId));

      for (const user of usersWithoutRoles) {
        await db.insert(userRoles).values({
          userId: user.userId,
          roleId: roleId,
          assignedBy: null, // Sistema automático
          isActive: true,
        });
        console.log(`✓ Rol 'employee' asignado a usuario ID ${user.userId}`);
      }
    }

    console.log("Sistema RBAC inicializado correctamente");
    return { success: true };
  } catch (error) {
    console.error("Error inicializando RBAC:", error);
    return { success: false, error };
  }
}

export async function getUserRoles(userId: number) {
  try {
    const userRoleData = await db
      .select({
        roleName: roles.name,
        permissions: roles.permissions,
        isActive: roles.isActive,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true)
        )
      );

    return userRoleData;
  } catch (error) {
    console.error("Error obteniendo roles del usuario:", error);
    return [];
  }
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
}

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}
