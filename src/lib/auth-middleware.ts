import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
} from "./rbac-init";
import appConfig from "./config";
import { ResponseHelper } from "@/utils/ResponseHelper";

// Configuración del middleware de protección
export interface ApiProtectionConfig {
  requireAuth?: boolean;
  roles?: string[];
  permissions?: string[];
  allowOwnResource?: boolean;
  resourceOwnerIdGetter?: (req: NextRequest) => number | Promise<number>;
}

// Tipo para handlers protegidos
export type ProtectedHandler = (
  req: NextRequest,
  user?: JWTPayload
) => Promise<NextResponse>;

// Tipo para handlers no protegidos
export type UnprotectedHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Helper para generar headers CORS consistentes
 */
function createCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const { allowedOrigins, allowedMethods, allowedHeaders, credentials } =
    appConfig.cors;

  // Determinar el origin permitido
  let allowedOrigin = allowedOrigins[0]; // Fallback default

  if (origin && allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
  } else if (appConfig.environment === "development" && origin) {
    // En desarrollo, permitir localhost con cualquier puerto
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):(\d+)$/;
    if (localhostPattern.test(origin)) {
      allowedOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Allow-Credentials": credentials.toString(),
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Helper para agregar headers CORS a respuestas del ResponseHelper
 */
function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const corsHeaders = createCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Middleware unificado para protección de APIs
 * Combina autenticación, autorización y validación de recursos
 * Incluye manejo CORS como respaldo si el middleware global falla
 */
export function protectApi(config: ApiProtectionConfig = {}) {
  const {
    requireAuth = true,
    roles = [],
    permissions = [],
    allowOwnResource = false,
    resourceOwnerIdGetter,
  } = config;

  return function (handler: ProtectedHandler | UnprotectedHandler) {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        // Manejo explícito de OPTIONS como respaldo
        if (request.method === "OPTIONS") {
          console.log(
            `🎯 [AUTH-MIDDLEWARE] Handling OPTIONS fallback for: ${request.url}`
          );
          const response = new NextResponse(null, { status: 200 });
          const corsResponse = addCorsHeaders(response, request);
          console.log(
            `📤 [AUTH-MIDDLEWARE] OPTIONS response status: ${corsResponse.status}`
          );
          return corsResponse;
        }

        // Si no requiere autenticación, ejecutar handler directamente
        if (!requireAuth) {
          const response = await (handler as UnprotectedHandler)(request);
          // Agregar headers CORS a la respuesta
          return addCorsHeaders(response, request);
        }

        // Verificar token de autorización
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return addCorsHeaders(
            ResponseHelper.unauthorizedError("Token de autorización requerido"),
            request
          );
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        if (!payload) {
          return addCorsHeaders(
            ResponseHelper.unauthorizedError("Token inválido o expirado"),
            request
          );
        }

        // Verificar que el token no esté vacío y tenga campos requeridos
        if (!payload.userId || !payload.rut) {
          return addCorsHeaders(
            ResponseHelper.unauthorizedError("Token malformado"),
            request
          );
        }

        // Verificar roles si se especificaron
        if (roles.length > 0) {
          if (!hasAnyRole(payload.roles || [], roles)) {
            return addCorsHeaders(
              ResponseHelper.forbiddenError(
                `Se requiere uno de los siguientes roles: ${roles.join(", ")}`
              ),
              request
            );
          }
        }

        // Verificar permisos si se especificaron
        if (permissions.length > 0) {
          if (!hasAnyPermission(payload.permissions || [], permissions)) {
            return addCorsHeaders(
              ResponseHelper.forbiddenError(
                `Se requiere uno de los siguientes permisos: ${permissions.join(
                  ", "
                )}`
              ),
              request
            );
          }
        }

        // Verificar acceso a recursos propios si está configurado
        if (allowOwnResource && resourceOwnerIdGetter) {
          const resourceOwnerId = await resourceOwnerIdGetter(request);

          // Si es admin, puede acceder a todos los recursos
          if (!hasRole(payload.roles || [], "admin")) {
            // Si no es admin, solo puede acceder a sus propios recursos
            if (payload.userId !== resourceOwnerId) {
              return addCorsHeaders(
                ResponseHelper.forbiddenError(
                  "Solo puedes acceder a tus propios datos"
                ),
                request
              );
            }
          }
        }

        // Ejecutar el handler con el usuario autenticado
        const response = await (handler as ProtectedHandler)(request, payload);

        // Agregar headers CORS a la respuesta exitosa
        return addCorsHeaders(response, request);
      } catch (error) {
        console.error("❌ Error en middleware de autenticación:", error);
        return addCorsHeaders(
          ResponseHelper.internalServerError(
            "Error de autenticación",
            error as Error
          ),
          request
        );
      }
    };
  };
}

// Helpers para configuraciones comunes
export const withAuth = () => protectApi({ requireAuth: true });

export const withAdminRole = () =>
  protectApi({ requireAuth: true, roles: ["admin"] });

export const withEmployeeRole = () =>
  protectApi({ requireAuth: true, roles: ["employee"] });

export const withTimeTrackingPermissions = (writeAccess = false) =>
  protectApi({
    requireAuth: true,
    permissions: writeAccess
      ? ["time_tracking.write_own"]
      : ["time_tracking.read_own"],
  });

export const withOwnResourceAccess = (
  resourceOwnerIdGetter: (req: NextRequest) => number | Promise<number>
) =>
  protectApi({
    requireAuth: true,
    allowOwnResource: true,
    resourceOwnerIdGetter,
  });

// Shorthand para casos comunes
export const PUBLIC_ROUTE = protectApi({ requireAuth: false });
export const ADMIN_ONLY = protectApi({ requireAuth: true, roles: ["admin"] });
export const AUTHENTICATED_ONLY = protectApi({ requireAuth: true });
