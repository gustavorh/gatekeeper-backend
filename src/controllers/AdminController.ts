import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IUserService } from "@/services/interfaces/IUserService";
import type { IRoleRepository } from "@/repositories/interfaces/IRoleRepository";
import { TYPES } from "@/types";
import { ResponseHelper } from "@/utils/ResponseHelper";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.RoleRepository) private roleRepo: IRoleRepository
  ) {}

  // Gestión de usuarios
  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const limitParam = url.searchParams.get("limit");
      const offsetParam = url.searchParams.get("offset");

      const limit = limitParam ? parseInt(limitParam) : 50;
      const offset = offsetParam ? parseInt(offsetParam) : 0;

      // Validar parámetros
      const validationErrors = [];
      if (limit < 1 || limit > 100) {
        validationErrors.push({
          field: "limit",
          message: "Limit debe estar entre 1 y 100",
        });
      }
      if (offset < 0) {
        validationErrors.push({
          field: "offset",
          message: "Offset debe ser mayor o igual a 0",
        });
      }

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Parámetros de consulta inválidos",
          validationErrors
        );
      }

      const result = await this.userService.getAllUsers(limit, offset);

      return ResponseHelper.successWithPagination(
        result.users,
        {
          limit,
          offset,
          total: result.total,
          hasMore: result.users.length === limit,
        },
        "Usuarios obtenidos exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint admin/users:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async getUserById(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      if (!userId || isNaN(userId)) {
        return ResponseHelper.validationError("ID de usuario inválido", [
          {
            field: "userId",
            message: "El ID de usuario debe ser un número válido",
          },
        ]);
      }

      const user = await this.userService.getUserWithRoles(userId);

      if (!user) {
        return ResponseHelper.notFoundError("Usuario no encontrado");
      }

      return ResponseHelper.success({ user }, "Usuario obtenido exitosamente");
    } catch (error) {
      console.error(`Error en endpoint admin/users/${userId}:`, error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // Gestión de roles
  async getRoles(request: NextRequest): Promise<NextResponse> {
    try {
      const allRoles = await this.roleRepo.findActiveRoles();

      const rolesData = allRoles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      return ResponseHelper.success(
        {
          roles: rolesData,
          total: allRoles.length,
        },
        "Roles obtenidos exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint admin/roles:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // Utility method para extraer userId de la URL path
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

  // Gestión de roles de usuario específico
  async getUserRoles(request: NextRequest): Promise<NextResponse> {
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

      const result = await this.userService.getUserRoles(userId);

      return ResponseHelper.success(
        {
          userId: result.userId,
          roles: result.roles,
        },
        "Roles de usuario obtenidos exitosamente"
      );
    } catch (error) {
      console.error(`Error en endpoint admin/users/{userId}/roles:`, error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async assignUserRole(
    request: NextRequest,
    assignedBy: number
  ): Promise<NextResponse> {
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

      const { roleId } = await request.json();

      if (!roleId || isNaN(roleId)) {
        return ResponseHelper.validationError("ID de rol inválido", [
          {
            field: "roleId",
            message: "El ID de rol debe ser un número válido",
          },
        ]);
      }

      const result = await this.userService.assignRoleToUser(
        userId,
        roleId,
        assignedBy
      );

      if (!result.success) {
        return ResponseHelper.validationError(
          result.message || "Error al asignar rol",
          []
        );
      }

      return ResponseHelper.operationSuccess(
        result.message || "Rol asignado exitosamente",
        {
          userId,
          roleId,
          assignedBy,
        }
      );
    } catch (error) {
      console.error(`Error asignando rol a usuario:`, error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async removeUserRole(request: NextRequest): Promise<NextResponse> {
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

      const { roleId } = await request.json();

      if (!roleId || isNaN(roleId)) {
        return ResponseHelper.validationError("ID de rol inválido", [
          {
            field: "roleId",
            message: "El ID de rol debe ser un número válido",
          },
        ]);
      }

      const result = await this.userService.removeRoleFromUser(userId, roleId);

      if (!result.success) {
        return ResponseHelper.validationError(
          result.message || "Error al remover rol",
          []
        );
      }

      return ResponseHelper.operationSuccess(
        result.message || "Rol removido exitosamente",
        {
          userId,
          roleId,
        }
      );
    } catch (error) {
      console.error(`Error removiendo rol de usuario:`, error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }
}
