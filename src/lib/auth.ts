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
}

export function generateToken(payload: JWTPayload): string {
  // Temporary workaround for JWT types issue
  return (jwt as any).sign({ ...payload }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function generateTokenWithRoles(
  userPayload: Omit<JWTPayload, "roles" | "permissions">
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
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
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
