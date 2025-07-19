import { injectable, inject } from "inversify";
import type { IUserService } from "./interfaces/IUserService";
import type { IUserRepository } from "@/repositories/interfaces/IUserRepository";
import type { IRoleRepository } from "@/repositories/interfaces/IRoleRepository";
import { TYPES } from "@/types";
import {
  UsersListResponseDTO,
  UserRolesResponseDTO,
  AssignRoleResponseDTO,
  RemoveRoleResponseDTO,
  UserWithRolesDTO,
  UserRoleDetailDTO,
} from "@/models/dtos";
import type { SafeUser } from "@/models/entities/User";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepo: IUserRepository,
    @inject(TYPES.RoleRepository) private roleRepo: IRoleRepository
  ) {}

  async getAllUsers(limit = 50, offset = 0): Promise<UsersListResponseDTO> {
    try {
      // Limitar máximo 100 usuarios por request
      const safeLimit = Math.min(limit, 100);

      // Obtener usuarios con paginación
      const allUsers = await this.userRepo.findAll(safeLimit, offset);

      // Obtener roles para cada usuario
      const usersWithRoles: UserWithRolesDTO[] = await Promise.all(
        allUsers.map(async (user) => {
          const userRoleDetails = await this.roleRepo.getUserRoleDetails(
            user.id
          );

          const roles: UserRoleDetailDTO[] = userRoleDetails.map((role) => ({
            roleId: role.roleId,
            roleName: role.roleName,
            roleDescription: role.roleDescription,
            assignedAt: role.assignedAt,
          }));

          // Remover password para seguridad
          const { password, ...safeUser } = user;

          return {
            ...safeUser,
            roles,
          };
        })
      );

      return {
        users: usersWithRoles,
        total: usersWithRoles.length, // En una implementación real, harías una query count separada
      };
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      return {
        users: [],
        total: 0,
      };
    }
  }

  async getUserById(userId: number): Promise<SafeUser | null> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) return null;

      // Remover password para seguridad
      const { password, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      console.error(`Error obteniendo usuario ${userId}:`, error);
      return null;
    }
  }

  async getUserWithRoles(
    userId: number
  ): Promise<(SafeUser & { roles: any[] }) | null> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) return null;

      const userRoleDetails = await this.roleRepo.getUserRoleDetails(userId);

      // Remover password para seguridad
      const { password, ...safeUser } = user;

      return {
        ...safeUser,
        roles: userRoleDetails,
      };
    } catch (error) {
      console.error(`Error obteniendo usuario con roles ${userId}:`, error);
      return null;
    }
  }

  async getUserRoles(userId: number): Promise<UserRolesResponseDTO> {
    try {
      // Verificar que el usuario existe
      const userExists = await this.validateUserExists(userId);
      if (!userExists) {
        return {
          userId,
          roles: [],
        };
      }

      // Obtener detalles de roles del usuario
      const roleDetails = await this.roleRepo.getUserRoleDetails(userId);

      return {
        userId,
        roles: roleDetails,
      };
    } catch (error) {
      console.error(`Error obteniendo roles del usuario ${userId}:`, error);
      return {
        userId,
        roles: [],
      };
    }
  }

  async assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy: number
  ): Promise<AssignRoleResponseDTO> {
    try {
      // Validar la asignación
      const validation = await this.validateRoleAssignment(userId, roleId);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(", "),
        };
      }

      // Verificar si el usuario ya tiene el rol
      const hasRole = await this.roleRepo.hasUserRole(userId, roleId);
      if (hasRole) {
        return {
          success: false,
          message: "El usuario ya tiene este rol asignado",
        };
      }

      // Asignar el rol
      await this.roleRepo.assignRoleToUser(userId, roleId, assignedBy);

      return {
        success: true,
        message: "Rol asignado exitosamente",
      };
    } catch (error) {
      console.error(
        `Error asignando rol ${roleId} a usuario ${userId}:`,
        error
      );
      return {
        success: false,
        message: "Error interno del servidor",
      };
    }
  }

  async removeRoleFromUser(
    userId: number,
    roleId: number
  ): Promise<RemoveRoleResponseDTO> {
    try {
      // Verificar que el usuario existe
      const userExists = await this.validateUserExists(userId);
      if (!userExists) {
        return {
          success: false,
          message: "Usuario no encontrado",
        };
      }

      // Verificar que el rol existe
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        return {
          success: false,
          message: "Rol no encontrado",
        };
      }

      // Verificar que el usuario tiene el rol
      const hasRole = await this.roleRepo.hasUserRole(userId, roleId);
      if (!hasRole) {
        return {
          success: false,
          message: "El usuario no tiene este rol asignado",
        };
      }

      // Remover el rol
      const removed = await this.roleRepo.removeRoleFromUser(userId, roleId);

      if (!removed) {
        return {
          success: false,
          message: "No se pudo remover el rol",
        };
      }

      return {
        success: true,
        message: "Rol removido exitosamente",
      };
    } catch (error) {
      console.error(
        `Error removiendo rol ${roleId} de usuario ${userId}:`,
        error
      );
      return {
        success: false,
        message: "Error interno del servidor",
      };
    }
  }

  async validateUserExists(userId: number): Promise<boolean> {
    try {
      const user = await this.userRepo.findById(userId);
      return user !== null;
    } catch (error) {
      console.error(`Error validando existencia de usuario ${userId}:`, error);
      return false;
    }
  }

  async validateRoleAssignment(
    userId: number,
    roleId: number
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Verificar que el usuario existe
      const userExists = await this.validateUserExists(userId);
      if (!userExists) {
        errors.push("Usuario no encontrado");
      }

      // Verificar que el rol existe
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        errors.push("Rol no encontrado");
      } else if (!role.isActive) {
        errors.push("El rol no está activo");
      }
    } catch (error) {
      console.error(`Error validando asignación de rol:`, error);
      errors.push("Error de validación");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
