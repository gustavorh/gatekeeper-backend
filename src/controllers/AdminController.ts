import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IUserService } from "@/services/interfaces/IUserService";
import type { IRoleRepository } from "@/repositories/interfaces/IRoleRepository";
import { TYPES } from "@/types";

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
      if (limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: "Limit debe estar entre 1 y 100" },
          { status: 400 }
        );
      }

      if (offset < 0) {
        return NextResponse.json(
          { error: "Offset debe ser mayor o igual a 0" },
          { status: 400 }
        );
      }

      const result = await this.userService.getAllUsers(limit, offset);

      return NextResponse.json({
        users: result.users,
        total: result.total,
        pagination: {
          limit,
          offset,
          hasMore: result.users.length === limit,
        },
      });
    } catch (error) {
      console.error("Error en endpoint admin/users:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  async getUserById(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      if (!userId || isNaN(userId)) {
        return NextResponse.json(
          { error: "ID de usuario inválido" },
          { status: 400 }
        );
      }

      const user = await this.userService.getUserWithRoles(userId);

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user,
      });
    } catch (error) {
      console.error(`Error en endpoint admin/users/${userId}:`, error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  // Gestión de roles
  async getRoles(request: NextRequest): Promise<NextResponse> {
    try {
      const allRoles = await this.roleRepo.findActiveRoles();

      return NextResponse.json({
        roles: allRoles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
        total: allRoles.length,
      });
    } catch (error) {
      console.error("Error en endpoint admin/roles:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
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
        return NextResponse.json(
          { error: "ID de usuario inválido" },
          { status: 400 }
        );
      }

      const result = await this.userService.getUserRoles(userId);

      return NextResponse.json({
        userId: result.userId,
        roles: result.roles,
      });
    } catch (error) {
      console.error(`Error en endpoint admin/users/{userId}/roles:`, error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
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
        return NextResponse.json(
          { error: "ID de usuario inválido" },
          { status: 400 }
        );
      }

      const { roleId } = await request.json();

      if (!roleId || isNaN(roleId)) {
        return NextResponse.json(
          { error: "ID de rol inválido" },
          { status: 400 }
        );
      }

      const result = await this.userService.assignRoleToUser(
        userId,
        roleId,
        assignedBy
      );

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        userId,
        roleId,
        assignedBy,
      });
    } catch (error) {
      console.error(`Error asignando rol a usuario:`, error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  async removeUserRole(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const userId = this.extractUserIdFromPath(url.pathname);

      if (!userId || isNaN(userId)) {
        return NextResponse.json(
          { error: "ID de usuario inválido" },
          { status: 400 }
        );
      }

      const { roleId } = await request.json();

      if (!roleId || isNaN(roleId)) {
        return NextResponse.json(
          { error: "ID de rol inválido" },
          { status: 400 }
        );
      }

      const result = await this.userService.removeRoleFromUser(userId, roleId);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        userId,
        roleId,
      });
    } catch (error) {
      console.error(`Error removiendo rol de usuario:`, error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }
}
