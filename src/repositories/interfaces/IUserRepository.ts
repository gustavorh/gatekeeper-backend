import { IRepository } from "@/types";
import { User, CreateUserData, UpdateUserData } from "@/models/entities/User";

export interface IUserRepository extends IRepository<User> {
  findByRut(rut: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  createUser(userData: CreateUserData): Promise<User>;
  updateUser(id: number, userData: UpdateUserData): Promise<User | null>;
  existsByRut(rut: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}
