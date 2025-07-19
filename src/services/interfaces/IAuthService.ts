import type {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  JWTPayloadDTO,
} from "@/models/dtos";

export interface IAuthService {
  // Authentication
  login(credentials: LoginRequestDTO): Promise<LoginResponseDTO | null>;
  register(userData: RegisterRequestDTO): Promise<RegisterResponseDTO | null>;

  // JWT utilities
  generateToken(payload: JWTPayloadDTO): string;
  generateTokenWithRoles(
    userPayload: Omit<JWTPayloadDTO, "roles" | "permissions">
  ): Promise<string>;
  verifyToken(token: string): JWTPayloadDTO | null;

  // Password utilities
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;

  // Validation utilities
  validateRutDigit(rut: string): boolean;
  validateCredentials(
    rut: string,
    password: string
  ): { isValid: boolean; errors: string[] };
}
