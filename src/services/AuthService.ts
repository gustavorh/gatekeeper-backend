import { injectable, inject } from "inversify";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { IAuthService } from "./interfaces/IAuthService";
import type { IUserRepository } from "@/repositories/interfaces/IUserRepository";
import type { IRoleRepository } from "@/repositories/interfaces/IRoleRepository";
import { TYPES } from "@/types";
import {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  JWTPayloadDTO,
} from "@/models/dtos";
import { CreateUserData } from "@/models/entities";

// Extender SafeUser para incluir roles
interface SafeUserWithRoles {
  id: number;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
  roles?: string[];
  permissions?: string[];
}

@injectable()
export class AuthService implements IAuthService {
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-here";
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

  constructor(
    @inject(TYPES.UserRepository) private userRepo: IUserRepository,
    @inject(TYPES.RoleRepository) private roleRepo: IRoleRepository
  ) {}

  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO | null> {
    try {
      const { rut, password } = credentials;

      // Validar credenciales básicas
      const validation = this.validateCredentials(rut, password);
      if (!validation.isValid) {
        return null;
      }

      // Buscar usuario por RUT
      const user = await this.userRepo.findByRut(rut);
      if (!user) {
        return null;
      }

      // Verificar contraseña
      const isPasswordValid = await this.comparePassword(
        password,
        user.password
      );
      if (!isPasswordValid) {
        return null;
      }

      // Obtener roles del usuario
      const userRoleDetails = await this.roleRepo.getUserRoleDetails(user.id);
      const roles = userRoleDetails.map((role) => role.roleName);
      const permissions = userRoleDetails.reduce((acc, role) => {
        const rolePermissions = Array.isArray(role.permissions)
          ? role.permissions
          : [];
        return [...acc, ...rolePermissions];
      }, [] as string[]);

      // Generar token con roles
      const token = await this.generateTokenWithRoles({
        userId: user.id,
        rut: user.rut,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        email: user.email || undefined,
      });

      // Devolver respuesta sin la contraseña pero con roles
      const { password: _, ...safeUser } = user;
      const userWithRoles: SafeUserWithRoles = {
        ...safeUser,
        roles,
        permissions,
      };

      return {
        token,
        user: userWithRoles,
      };
    } catch (error) {
      console.error("Error en login:", error);
      return null;
    }
  }

  async register(
    userData: RegisterRequestDTO
  ): Promise<RegisterResponseDTO | null> {
    try {
      const {
        rut,
        nombre,
        apellido_paterno,
        apellido_materno,
        password,
        email,
      } = userData;

      // Validar RUT
      if (!this.validateRutDigit(rut)) {
        return null;
      }

      // Verificar si el usuario ya existe
      const existingUser = await this.userRepo.existsByRut(rut);
      if (existingUser) {
        return null;
      }

      // Verificar si el email ya existe (si se proporciona)
      if (email) {
        const existingEmail = await this.userRepo.existsByEmail(email);
        if (existingEmail) {
          return null;
        }
      }

      // Encriptar contraseña
      const hashedPassword = await this.hashPassword(password);

      // Crear usuario
      const createData: CreateUserData = {
        rut,
        nombre,
        apellido_paterno,
        apellido_materno,
        password: hashedPassword,
        email: email || undefined,
      };

      const newUser = await this.userRepo.createUser(createData);

      // Asignar rol por defecto (empleado)
      let roles: string[] = [];
      let permissions: string[] = [];

      try {
        const empleadoRole = await this.roleRepo.findByName("employee");
        if (empleadoRole) {
          await this.roleRepo.assignRoleToUser(newUser.id, empleadoRole.id);
          roles = [empleadoRole.name];
          permissions = Array.isArray(empleadoRole.permissions)
            ? empleadoRole.permissions
            : [];
        }
      } catch (error) {
        console.warn("No se pudo asignar rol por defecto:", error);
      }

      // Generar token con roles
      const token = await this.generateTokenWithRoles({
        userId: newUser.id,
        rut: newUser.rut,
        nombre: newUser.nombre,
        apellido_paterno: newUser.apellido_paterno,
        apellido_materno: newUser.apellido_materno,
        email: newUser.email || undefined,
      });

      // Devolver respuesta sin la contraseña pero con roles
      const { password: _, ...safeUser } = newUser;
      const userWithRoles: SafeUserWithRoles = {
        ...safeUser,
        roles,
        permissions,
      };

      return {
        token,
        user: userWithRoles,
      };
    } catch (error) {
      console.error("Error en register:", error);
      return null;
    }
  }

  generateToken(payload: JWTPayloadDTO): string {
    return (jwt as any).sign({ ...payload }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  async generateTokenWithRoles(
    userPayload: Omit<JWTPayloadDTO, "roles" | "permissions">
  ): Promise<string> {
    try {
      const userRoleDetails = await this.roleRepo.getUserRoleDetails(
        userPayload.userId
      );

      const roles = userRoleDetails.map((role) => role.roleName);
      const permissions = userRoleDetails.reduce((acc, role) => {
        const rolePermissions = Array.isArray(role.permissions)
          ? role.permissions
          : [];
        return [...acc, ...rolePermissions];
      }, [] as string[]);

      const payload: JWTPayloadDTO = {
        ...userPayload,
        roles,
        permissions,
      };

      return this.generateToken(payload);
    } catch (error) {
      console.error("Error generando token con roles:", error);
      // Generar token básico sin roles en caso de error
      const payload: JWTPayloadDTO = {
        ...userPayload,
        roles: [],
        permissions: [],
      };
      return this.generateToken(payload);
    }
  }

  verifyToken(token: string): JWTPayloadDTO | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayloadDTO;
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validateRutDigit(rut: string): boolean {
    try {
      // Limpiar el RUT: remover puntos, espacios y convertir a mayúsculas
      const cleanRut = rut.replace(/[\s.-]/g, "").toUpperCase();

      // Validar formato básico (al menos 2 caracteres)
      if (cleanRut.length < 2) {
        return false;
      }

      // Separar el número del dígito verificador
      const rutNumber = cleanRut.slice(0, -1);
      const checkDigit = cleanRut.slice(-1);

      // Validar que la parte numérica solo contenga dígitos
      if (!/^\d+$/.test(rutNumber)) {
        return false;
      }

      // Validar que el dígito verificador sea válido (0-9 o K)
      if (!/^[0-9K]$/.test(checkDigit)) {
        return false;
      }

      // Calcular el dígito verificador esperado
      let sum = 0;
      let multiplier = 2;

      // Multiplicar cada dígito de derecha a izquierda
      for (let i = rutNumber.length - 1; i >= 0; i--) {
        sum += parseInt(rutNumber[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
      }

      // Calcular el resto de la división por 11
      const remainder = sum % 11;

      // Determinar el dígito verificador esperado
      let expectedCheckDigit: string;
      if (remainder === 0) {
        expectedCheckDigit = "0";
      } else if (remainder === 1) {
        expectedCheckDigit = "K";
      } else {
        expectedCheckDigit = (11 - remainder).toString();
      }

      // Comparar con el dígito verificador proporcionado
      return checkDigit === expectedCheckDigit;
    } catch (error) {
      return false;
    }
  }

  validateCredentials(
    rut: string,
    password: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rut || rut.trim() === "") {
      errors.push("RUT es requerido");
    } else if (!this.validateRutDigit(rut)) {
      errors.push("RUT no es válido");
    }

    if (!password || password.trim() === "") {
      errors.push("Password es requerido");
    } else if (password.length < 6) {
      errors.push("Password debe tener al menos 6 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
