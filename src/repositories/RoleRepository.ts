import { injectable } from "inversify";
import { BaseRepository } from "./BaseRepository";
import { IRoleRepository } from "./interfaces/IRoleRepository";
import { Role, UserRole } from "@/models/entities/Role";
import { roles, userRoles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";

@injectable()
export class RoleRepository
  extends BaseRepository<Role>
  implements IRoleRepository
{
  constructor() {
    super(roles, roles.id);
  }

  async findActiveRoles(): Promise<Role[]> {
    try {
      const results = await db
        .select()
        .from(roles)
        .where(eq(roles.isActive, true));

      return results as Role[];
    } catch (error) {
      console.error("Error finding active roles:", error);
      throw new Error("Failed to find active roles");
    }
  }

  async findByName(name: string): Promise<Role | null> {
    try {
      const results = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

      return results.length > 0 ? (results[0] as Role) : null;
    } catch (error) {
      console.error(`Error finding role by name ${name}:`, error);
      throw new Error("Failed to find role by name");
    }
  }

  async findUserRoles(userId: number): Promise<Role[]> {
    try {
      const results = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          permissions: roles.permissions,
          isActive: roles.isActive,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.isActive, true),
            eq(roles.isActive, true)
          )
        );

      return results as Role[];
    } catch (error) {
      console.error(`Error finding roles for user ${userId}:`, error);
      throw new Error("Failed to find user roles");
    }
  }

  async assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy?: number
  ): Promise<UserRole> {
    try {
      // Verificar si ya existe la asignación
      const existing = await this.hasUserRole(userId, roleId);
      if (existing) {
        throw new Error("User already has this role assigned");
      }

      const result = await db.insert(userRoles).values({
        userId,
        roleId,
        isActive: true,
        assignedBy,
      } as any);

      const insertId = Number(result[0].insertId);

      const createdUserRole = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.id, insertId))
        .limit(1);

      return createdUserRole[0] as UserRole;
    } catch (error) {
      console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
      throw new Error("Failed to assign role to user");
    }
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    try {
      const result = await db
        .update(userRoles)
        .set({ isActive: false })
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId),
            eq(userRoles.isActive, true)
          )
        );

      return result[0].affectedRows > 0;
    } catch (error) {
      console.error(
        `Error removing role ${roleId} from user ${userId}:`,
        error
      );
      throw new Error("Failed to remove role from user");
    }
  }

  async hasUserRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const results = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId),
            eq(userRoles.isActive, true)
          )
        )
        .limit(1);

      return results.length > 0;
    } catch (error) {
      console.error(
        `Error checking if user ${userId} has role ${roleId}:`,
        error
      );
      throw new Error("Failed to check user role");
    }
  }

  async getUserRoleDetails(userId: number): Promise<
    Array<{
      roleId: number;
      roleName: string;
      roleDescription?: string | null;
      permissions: string[];
      assignedAt: Date;
      isActive: boolean;
    }>
  > {
    try {
      const results = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
          roleDescription: roles.description,
          permissions: roles.permissions,
          assignedAt: userRoles.assignedAt,
          isActive: userRoles.isActive,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)));

      return results.map((result) => ({
        ...result,
        permissions: result.permissions as string[],
        assignedAt: result.assignedAt!,
        isActive: result.isActive!,
      }));
    } catch (error) {
      console.error(`Error getting role details for user ${userId}:`, error);
      throw new Error("Failed to get user role details");
    }
  }
}
