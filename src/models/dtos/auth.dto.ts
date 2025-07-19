import { SafeUser } from "../entities/User";

// Login DTOs
export interface LoginRequestDTO {
  rut: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  user: SafeUser;
}

// Register DTOs
export interface RegisterRequestDTO {
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  password: string;
  email?: string;
}

export interface RegisterResponseDTO {
  token: string;
  user: SafeUser;
}

// JWT Payload
export interface JWTPayloadDTO {
  userId: number;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}
