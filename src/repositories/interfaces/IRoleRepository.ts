import { IRepository } from "@/types";
import {
  Role,
  UserRole,
  CreateRoleData,
  CreateUserRoleData,
} from "@/models/entities/Role";

export interface IRoleRepository extends IRepository<Role> {
  findActiveRoles(): Promise<Role[]>;
  findByName(name: string): Promise<Role | null>;
  findUserRoles(userId: number): Promise<Role[]>;

  // UserRole management
  assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy?: number
  ): Promise<UserRole>;
  removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;
  hasUserRole(userId: number, roleId: number): Promise<boolean>;
  getUserRoleDetails(userId: number): Promise<
    Array<{
      roleId: number;
      roleName: string;
      roleDescription?: string | null;
      permissions: string[];
      assignedAt: Date;
      isActive: boolean;
    }>
  >;
}
