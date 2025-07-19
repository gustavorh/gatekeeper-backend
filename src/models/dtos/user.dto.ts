import { SafeUser } from "../entities/User";
import { Role } from "../entities/Role";

// User Management DTOs
export interface UserWithRolesDTO extends SafeUser {
  roles: UserRoleDetailDTO[];
}

export interface UserRoleDetailDTO {
  roleId: number;
  roleName: string;
  roleDescription?: string | null;
  assignedAt: Date;
}

export interface UsersListRequestDTO {
  limit?: number;
  offset?: number;
}

export interface UsersListResponseDTO {
  users: UserWithRolesDTO[];
  total: number;
}

// Role Management DTOs
export interface RolesListResponseDTO {
  roles: Role[];
  total: number;
}

export interface UserRolesResponseDTO {
  userId: number;
  roles: UserRolePermissionDTO[];
}

export interface UserRolePermissionDTO {
  roleId: number;
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
  assignedAt: Date;
  isActive: boolean;
}

export interface AssignRoleRequestDTO {
  roleId: number;
}

export interface AssignRoleResponseDTO {
  success: boolean;
  message: string;
}

export interface RemoveRoleRequestDTO {
  roleId: number;
}

export interface RemoveRoleResponseDTO {
  success: boolean;
  message: string;
}
