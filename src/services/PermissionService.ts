import { injectable, inject } from "inversify";
import type { IPermissionService } from "./interfaces/IPermissionService";
import type { IRoleRepository } from "@/repositories/interfaces/IRoleRepository";
import type { IUserRepository } from "@/repositories/interfaces/IUserRepository";
import { TYPES } from "@/types";
import { Role } from "@/lib/schema";
import { db } from "@/lib/db";
import { roles, userRoles } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

@injectable()
export class PermissionService implements IPermissionService {
  constructor(
    @inject(TYPES.RoleRepository) private roleRepo: IRoleRepository,
    @inject(TYPES.UserRepository) private userRepo: IUserRepository
  ) {}

  async getAllPermissions(): Promise<string[]> {
    try {
      // Obtener todos los roles activos y extraer permisos únicos
      const allRoles = await this.roleRepo.findActiveRoles();
      const allPermissions = new Set<string>();

      allRoles.forEach((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission) => {
            if (typeof permission === "string") {
              allPermissions.add(permission);
            }
          });
        }
      });

      return Array.from(allPermissions).sort();
    } catch (error) {
      console.error("Error obteniendo todos los permisos:", error);
      return [];
    }
  }

  async getRolePermissions(roleId: number): Promise<string[]> {
    try {
      const role = await this.roleRepo.findById(roleId);
      if (!role || !role.permissions) {
        return [];
      }

      return Array.isArray(role.permissions) ? role.permissions : [];
    } catch (error) {
      console.error(`Error obteniendo permisos del rol ${roleId}:`, error);
      return [];
    }
  }

  async assignPermissionsToRole(
    roleId: number,
    permissions: string[]
  ): Promise<boolean> {
    try {
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        return false;
      }

      const currentPermissions = Array.isArray(role.permissions)
        ? role.permissions
        : [];
      const newPermissions = [
        ...new Set([...currentPermissions, ...permissions]),
      ];

      await this.roleRepo.update(roleId, {
        permissions: newPermissions,
      });

      return true;
    } catch (error) {
      console.error(`Error asignando permisos al rol ${roleId}:`, error);
      return false;
    }
  }

  async removePermissionsFromRole(
    roleId: number,
    permissions: string[]
  ): Promise<boolean> {
    try {
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        return false;
      }

      const currentPermissions = Array.isArray(role.permissions)
        ? role.permissions
        : [];
      const newPermissions = currentPermissions.filter(
        (permission) => !permissions.includes(permission)
      );

      await this.roleRepo.update(roleId, {
        permissions: newPermissions,
      });

      return true;
    } catch (error) {
      console.error(`Error removiendo permisos del rol ${roleId}:`, error);
      return false;
    }
  }

  async userHasPermission(
    userId: number,
    permission: string
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.includes(permission);
    } catch (error) {
      console.error(
        `Error verificando permiso ${permission} para usuario ${userId}:`,
        error
      );
      return false;
    }
  }

  async userHasAnyPermission(
    userId: number,
    permissions: string[]
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.some((permission) =>
        userPermissions.includes(permission)
      );
    } catch (error) {
      console.error(
        `Error verificando permisos para usuario ${userId}:`,
        error
      );
      return false;
    }
  }

  async userHasAllPermissions(
    userId: number,
    permissions: string[]
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.every((permission) =>
        userPermissions.includes(permission)
      );
    } catch (error) {
      console.error(
        `Error verificando todos los permisos para usuario ${userId}:`,
        error
      );
      return false;
    }
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    try {
      const userRoleDetails = await this.roleRepo.getUserRoleDetails(userId);
      const allPermissions = new Set<string>();

      userRoleDetails.forEach((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission) => {
            if (typeof permission === "string") {
              allPermissions.add(permission);
            }
          });
        }
      });

      return Array.from(allPermissions);
    } catch (error) {
      console.error(`Error obteniendo permisos del usuario ${userId}:`, error);
      return [];
    }
  }

  async createPermission(
    permissionName: string,
    description?: string
  ): Promise<boolean> {
    try {
      // En esta implementación, los permisos se manejan como strings en el campo permissions
      // No hay una tabla separada de permisos, por lo que este método es principalmente
      // para validación y documentación
      console.log(
        `Permiso creado: ${permissionName} - ${
          description || "Sin descripción"
        }`
      );
      return true;
    } catch (error) {
      console.error(`Error creando permiso ${permissionName}:`, error);
      return false;
    }
  }

  async deletePermission(permissionName: string): Promise<boolean> {
    try {
      // Obtener todos los roles que tienen este permiso
      const rolesWithPermission = await this.getRolesWithPermission(
        permissionName
      );

      // Remover el permiso de todos los roles que lo tienen
      for (const role of rolesWithPermission) {
        await this.removePermissionsFromRole(role.id, [permissionName]);
      }

      return true;
    } catch (error) {
      console.error(`Error eliminando permiso ${permissionName}:`, error);
      return false;
    }
  }

  async getRolesWithPermission(permission: string): Promise<Role[]> {
    try {
      const allRoles = await this.roleRepo.findActiveRoles();
      return allRoles.filter((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          return role.permissions.includes(permission);
        }
        return false;
      }) as Role[];
    } catch (error) {
      console.error(`Error obteniendo roles con permiso ${permission}:`, error);
      return [];
    }
  }
}
