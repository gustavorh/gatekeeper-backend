import { Role } from "@/lib/schema";

export interface IPermissionService {
  // Obtener todos los permisos disponibles
  getAllPermissions(): Promise<string[]>;

  // Obtener permisos de un rol específico
  getRolePermissions(roleId: number): Promise<string[]>;

  // Asignar permisos a un rol
  assignPermissionsToRole(
    roleId: number,
    permissions: string[]
  ): Promise<boolean>;

  // Remover permisos de un rol
  removePermissionsFromRole(
    roleId: number,
    permissions: string[]
  ): Promise<boolean>;

  // Verificar si un usuario tiene un permiso específico
  userHasPermission(userId: number, permission: string): Promise<boolean>;

  // Verificar si un usuario tiene al menos uno de los permisos
  userHasAnyPermission(userId: number, permissions: string[]): Promise<boolean>;

  // Verificar si un usuario tiene todos los permisos
  userHasAllPermissions(
    userId: number,
    permissions: string[]
  ): Promise<boolean>;

  // Obtener todos los permisos de un usuario
  getUserPermissions(userId: number): Promise<string[]>;

  // Crear un nuevo permiso
  createPermission(
    permissionName: string,
    description?: string
  ): Promise<boolean>;

  // Eliminar un permiso
  deletePermission(permissionName: string): Promise<boolean>;

  // Obtener roles que tienen un permiso específico
  getRolesWithPermission(permission: string): Promise<Role[]>;
}
