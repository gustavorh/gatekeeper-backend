export interface Role {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  isActive: boolean;
  assignedAt: Date;
  assignedBy?: number | null;
}

export type CreateRoleData = Omit<Role, "id" | "createdAt" | "updatedAt">;
export type CreateUserRoleData = Omit<UserRole, "id" | "assignedAt">;
