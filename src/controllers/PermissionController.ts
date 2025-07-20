import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IPermissionService } from "@/services/interfaces/IPermissionService";
import { TYPES } from "@/types";
import { ResponseHelper } from "@/utils/ResponseHelper";

@injectable()
export class PermissionController {
  constructor(
    @inject(TYPES.PermissionService)
    private permissionService: IPermissionService
  ) {}

  // GET: Obtener todos los permisos disponibles
  async getAllPermissions(request: NextRequest): Promise<NextResponse> {
    try {
      const permissions = await this.permissionService.getAllPermissions();

      return ResponseHelper.success(
        { permissions },
        "Permisos obtenidos exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint admin/permissions:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // GET: Obtener permisos de un rol específico
  async getRolePermissions(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const roleId = this.extractRoleIdFromPath(url.pathname);

      if (!roleId || isNaN(roleId)) {
        return ResponseHelper.validationError("ID de rol inválido", [
          {
            field: "roleId",
            message: "El ID de rol debe ser un número válido",
          },
        ]);
      }

      const permissions = await this.permissionService.getRolePermissions(
        roleId
      );

      return ResponseHelper.success(
        { roleId, permissions },
        "Permisos del rol obtenidos exitosamente"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/roles/[roleId]/permissions:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // POST: Asignar permisos a un rol
  async assignPermissionsToRole(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const roleId = this.extractRoleIdFromPath(url.pathname);

      if (!roleId || isNaN(roleId)) {
        return ResponseHelper.validationError("ID de rol inválido", [
          {
            field: "roleId",
            message: "El ID de rol debe ser un número válido",
          },
        ]);
      }

      const { permissions } = await request.json();

      if (!permissions || !Array.isArray(permissions)) {
        return ResponseHelper.validationError("Permisos inválidos", [
          {
            field: "permissions",
            message: "Los permisos deben ser un array de strings",
          },
        ]);
      }

      const success = await this.permissionService.assignPermissionsToRole(
        roleId,
        permissions
      );

      if (!success) {
        return ResponseHelper.notFoundError("Rol no encontrado");
      }

      return ResponseHelper.operationSuccess(
        "Permisos asignados exitosamente",
        { roleId, permissions }
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/roles/[roleId]/permissions POST:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // DELETE: Remover permisos de un rol
  async removePermissionsFromRole(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const roleId = this.extractRoleIdFromPath(url.pathname);

      if (!roleId || isNaN(roleId)) {
        return ResponseHelper.validationError("ID de rol inválido", [
          {
            field: "roleId",
            message: "El ID de rol debe ser un número válido",
          },
        ]);
      }

      const { permissions } = await request.json();

      if (!permissions || !Array.isArray(permissions)) {
        return ResponseHelper.validationError("Permisos inválidos", [
          {
            field: "permissions",
            message: "Los permisos deben ser un array de strings",
          },
        ]);
      }

      const success = await this.permissionService.removePermissionsFromRole(
        roleId,
        permissions
      );

      if (!success) {
        return ResponseHelper.notFoundError("Rol no encontrado");
      }

      return ResponseHelper.operationSuccess(
        "Permisos removidos exitosamente",
        { roleId, permissions }
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/roles/[roleId]/permissions DELETE:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // GET: Verificar permisos de un usuario
  async getUserPermissions(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const userId = this.extractUserIdFromPath(url.pathname);

      if (!userId || isNaN(userId)) {
        return ResponseHelper.validationError("ID de usuario inválido", [
          {
            field: "userId",
            message: "El ID de usuario debe ser un número válido",
          },
        ]);
      }

      const permissions = await this.permissionService.getUserPermissions(
        userId
      );

      return ResponseHelper.success(
        { userId, permissions },
        "Permisos del usuario obtenidos exitosamente"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/users/[userId]/permissions:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // POST: Verificar si un usuario tiene un permiso específico
  async checkUserPermission(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const userId = this.extractUserIdFromPath(url.pathname);

      if (!userId || isNaN(userId)) {
        return ResponseHelper.validationError("ID de usuario inválido", [
          {
            field: "userId",
            message: "El ID de usuario debe ser un número válido",
          },
        ]);
      }

      const { permission } = await request.json();

      if (!permission || typeof permission !== "string") {
        return ResponseHelper.validationError("Permiso inválido", [
          {
            field: "permission",
            message: "El permiso debe ser un string",
          },
        ]);
      }

      const hasPermission = await this.permissionService.userHasPermission(
        userId,
        permission
      );

      return ResponseHelper.success(
        { userId, permission, hasPermission },
        hasPermission
          ? "Usuario tiene el permiso"
          : "Usuario no tiene el permiso"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/users/[userId]/permissions/check:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // POST: Crear un nuevo permiso
  async createPermission(request: NextRequest): Promise<NextResponse> {
    try {
      const { permissionName, description } = await request.json();

      if (!permissionName || typeof permissionName !== "string") {
        return ResponseHelper.validationError("Nombre de permiso inválido", [
          {
            field: "permissionName",
            message: "El nombre del permiso debe ser un string",
          },
        ]);
      }

      const success = await this.permissionService.createPermission(
        permissionName,
        description
      );

      if (!success) {
        return ResponseHelper.internalServerError("Error al crear el permiso");
      }

      return ResponseHelper.operationSuccess("Permiso creado exitosamente", {
        permissionName,
        description,
      });
    } catch (error) {
      console.error("Error en endpoint admin/permissions POST:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // DELETE: Eliminar un permiso
  async deletePermission(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const permissionName = this.extractPermissionNameFromPath(url.pathname);

      if (!permissionName) {
        return ResponseHelper.validationError("Nombre de permiso inválido", [
          {
            field: "permissionName",
            message: "El nombre del permiso es requerido",
          },
        ]);
      }

      const success = await this.permissionService.deletePermission(
        permissionName
      );

      if (!success) {
        return ResponseHelper.internalServerError(
          "Error al eliminar el permiso"
        );
      }

      return ResponseHelper.operationSuccess("Permiso eliminado exitosamente", {
        permissionName,
      });
    } catch (error) {
      console.error(
        "Error en endpoint admin/permissions/[permissionName] DELETE:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // GET: Obtener roles que tienen un permiso específico
  async getRolesWithPermission(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const permission = this.extractPermissionNameFromPath(url.pathname);

      if (!permission) {
        return ResponseHelper.validationError("Nombre de permiso inválido", [
          {
            field: "permission",
            message: "El nombre del permiso es requerido",
          },
        ]);
      }

      const roles = await this.permissionService.getRolesWithPermission(
        permission
      );

      return ResponseHelper.success(
        { permission, roles },
        "Roles con permiso obtenidos exitosamente"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/permissions/[permission]/roles:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // Utility methods para extraer IDs de la URL
  private extractRoleIdFromPath(pathname: string): number | null {
    try {
      const segments = pathname.split("/");
      const roleIndex = segments.findIndex((segment) => segment === "roles");
      if (roleIndex !== -1 && segments[roleIndex + 1]) {
        return parseInt(segments[roleIndex + 1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractUserIdFromPath(pathname: string): number | null {
    try {
      const segments = pathname.split("/");
      const userIndex = segments.findIndex((segment) => segment === "users");
      if (userIndex !== -1 && segments[userIndex + 1]) {
        return parseInt(segments[userIndex + 1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractPermissionNameFromPath(pathname: string): string | null {
    try {
      const segments = pathname.split("/");
      const permissionIndex = segments.findIndex(
        (segment) => segment === "permissions"
      );
      if (permissionIndex !== -1 && segments[permissionIndex + 1]) {
        return segments[permissionIndex + 1];
      }
      return null;
    } catch {
      return null;
    }
  }
}
