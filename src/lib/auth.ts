import * as jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getUserRoles } from "./rbac-init";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export interface JWTPayload {
  userId: number;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email?: string;
  roles: string[];
  permissions: string[];
  iat?: number; // issued at
  exp?: number; // expiration time
}

export function generateToken(payload: JWTPayload): string {
  // Temporary workaround for JWT types issue
  return (jwt as any).sign({ ...payload }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function generateTokenWithRoles(
  userPayload: Omit<JWTPayload, "roles" | "permissions" | "iat" | "exp">
): Promise<string> {
  const userRoles = await getUserRoles(userPayload.userId);

  const roles = userRoles.map((role) => role.roleName);
  const permissions = userRoles.reduce((acc, role) => {
    const rolePermissions = Array.isArray(role.permissions)
      ? role.permissions
      : [];
    return [...acc, ...rolePermissions];
  }, [] as string[]);

  const payload: JWTPayload = {
    ...userPayload,
    roles,
    permissions,
  };

  return generateToken(payload);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Validaciones adicionales de seguridad
    if (!decoded.userId || !decoded.rut) {
      console.error("❌ Token missing required fields");
      return null;
    }

    // Verificar que el token no esté próximo a expirar (menos de 5 minutos)
    if (decoded.exp && decoded.exp * 1000 < Date.now() + 5 * 60 * 1000) {
      console.warn("⚠️ Token expires soon");
      // Aunque esté próximo a expirar, si es válido lo aceptamos
      // El cliente debería renovar el token
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("❌ Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error("❌ Invalid token format");
    } else {
      console.error("❌ Token verification failed:", error);
    }
    return null;
  }
}

/**
 * Valida que un token tenga una estructura válida sin verificar la firma
 * Útil para debugging o análisis de tokens
 */
export function decodeTokenWithoutVerification(
  token: string
): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si un token necesita renovación (expira en menos de 1 hora)
 */
export function shouldRenewToken(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded.exp) return true;

    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    return decoded.exp * 1000 < oneHourFromNow;
  } catch {
    return true;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Valida el dígito verificador del RUT chileno
 * @param rut - RUT en formato 12345678-9 o 12345678-K
 * @returns boolean - true si el dígito verificador es válido
 */
export function validateRutDigit(rut: string): boolean {
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

    // Iterar desde el último dígito hacia el primero
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumber[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const expectedCheckDigit =
      remainder === 0
        ? "0"
        : remainder === 1
        ? "K"
        : (11 - remainder).toString();

    return checkDigit === expectedCheckDigit;
  } catch (error) {
    return false;
  }
}
