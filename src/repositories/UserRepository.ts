import { injectable } from "inversify";
import { BaseRepository } from "./BaseRepository";
import { IUserRepository } from "./interfaces/IUserRepository";
import { User, CreateUserData, UpdateUserData } from "@/models/entities/User";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";

@injectable()
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  constructor() {
    super(users, users.id);
  }

  async findByRut(rut: string): Promise<User | null> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.rut, rut))
        .limit(1);

      return results.length > 0 ? (results[0] as User) : null;
    } catch (error) {
      console.error(`Error finding user by RUT ${rut}:`, error);
      throw new Error("Failed to find user by RUT");
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return results.length > 0 ? (results[0] as User) : null;
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw new Error("Failed to find user by email");
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    return await this.create(userData);
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User | null> {
    return await this.update(id, userData);
  }

  async existsByRut(rut: string): Promise<boolean> {
    try {
      const user = await this.findByRut(rut);
      return user !== null;
    } catch (error) {
      console.error(`Error checking RUT existence ${rut}:`, error);
      throw new Error("Failed to check RUT existence");
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      return user !== null;
    } catch (error) {
      console.error(`Error checking email existence ${email}:`, error);
      throw new Error("Failed to check email existence");
    }
  }
}
