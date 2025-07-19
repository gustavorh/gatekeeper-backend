export interface User {
  id: number;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  password: string;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserData = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserData = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt">
>;
export type SafeUser = Omit<User, "password">;
