import type {
  UsersListRequestDTO,
  UsersListResponseDTO,
  UserRolesResponseDTO,
  AssignRoleRequestDTO,
  AssignRoleResponseDTO,
  RemoveRoleRequestDTO,
  RemoveRoleResponseDTO,
} from "@/models/dtos";
import type { SafeUser } from "@/models/entities/User";

export interface IUserService {
  // User management
  getAllUsers(limit?: number, offset?: number): Promise<UsersListResponseDTO>;
  getUserById(userId: number): Promise<SafeUser | null>;
  getUserWithRoles(
    userId: number
  ): Promise<(SafeUser & { roles: any[] }) | null>;

  // Role management for users
  getUserRoles(userId: number): Promise<UserRolesResponseDTO>;
  assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy: number
  ): Promise<AssignRoleResponseDTO>;
  removeRoleFromUser(
    userId: number,
    roleId: number
  ): Promise<RemoveRoleResponseDTO>;

  // Validation utilities
  validateUserExists(userId: number): Promise<boolean>;
  validateRoleAssignment(
    userId: number,
    roleId: number
  ): Promise<{ isValid: boolean; errors: string[] }>;
}
