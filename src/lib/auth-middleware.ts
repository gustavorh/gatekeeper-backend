import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
} from "./rbac-init";
import appConfig from "./config";

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
          const corsHeaders = createCorsHeaders(request);
          const response = new NextResponse(null, {
            status: 200,
            headers: corsHeaders,
          });
          console.log(
            `📤 [AUTH-MIDDLEWARE] OPTIONS response status: ${response.status}`
          );
          return response;
        }

        // Si no requiere autenticación, ejecutar handler directamente
        if (!requireAuth) {
          const response = await (handler as UnprotectedHandler)(request);
          // Agregar headers CORS a la respuesta
          const corsHeaders = createCorsHeaders(request);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        // Verificar token de autorización
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          const corsHeaders = createCorsHeaders(request);
          const response = NextResponse.json(
            {
              error: "Token de autorización requerido",
              code: "MISSING_TOKEN",
            },
            { status: 401 }
          );
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        if (!payload) {
          const corsHeaders = createCorsHeaders(request);
          const response = NextResponse.json(
            {
              error: "Token inválido o expirado",
              code: "INVALID_TOKEN",
            },
            { status: 401 }
          );
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        // Verificar que el token no esté vacío y tenga campos requeridos
        if (!payload.userId || !payload.rut) {
          const corsHeaders = createCorsHeaders(request);
          const response = NextResponse.json(
            {
              error: "Token malformado",
              code: "MALFORMED_TOKEN",
            },
            { status: 401 }
          );
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        // Verificar roles si se especificaron
        if (roles.length > 0) {
          if (!hasAnyRole(payload.roles || [], roles)) {
            const corsHeaders = createCorsHeaders(request);
            const response = NextResponse.json(
              {
                error: "Acceso denegado por falta de rol",
                message: `Se requiere uno de los siguientes roles: ${roles.join(
                  ", "
                )}`,
                code: "INSUFFICIENT_ROLE",
                requiredRoles: roles,
                userRoles: payload.roles || [],
              },
              { status: 403 }
            );
            Object.entries(corsHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
            return response;
          }
        }

        // Verificar permisos si se especificaron
        if (permissions.length > 0) {
          if (!hasAnyPermission(payload.permissions || [], permissions)) {
            const corsHeaders = createCorsHeaders(request);
            const response = NextResponse.json(
              {
                error: "Acceso denegado por falta de permisos",
                message: `Se requiere uno de los siguientes permisos: ${permissions.join(
                  ", "
                )}`,
                code: "INSUFFICIENT_PERMISSIONS",
                requiredPermissions: permissions,
                userPermissions: payload.permissions || [],
              },
              { status: 403 }
            );
            Object.entries(corsHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
            return response;
          }
        }

        // Verificar acceso a recursos propios si está configurado
        if (allowOwnResource && resourceOwnerIdGetter) {
          const resourceOwnerId = await resourceOwnerIdGetter(request);

          // Si es admin, puede acceder a todos los recursos
          if (!hasRole(payload.roles || [], "admin")) {
            // Si no es admin, solo puede acceder a sus propios recursos
            if (payload.userId !== resourceOwnerId) {
              const corsHeaders = createCorsHeaders(request);
              const response = NextResponse.json(
                {
                  error: "Acceso denegado a recurso",
                  message: "Solo puedes acceder a tus propios datos",
                  code: "RESOURCE_ACCESS_DENIED",
                },
                { status: 403 }
              );
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              return response;
            }
          }
        }

        // Ejecutar el handler con el usuario autenticado
        const response = await (handler as ProtectedHandler)(request, payload);

        // Agregar headers CORS a la respuesta exitosa
        const corsHeaders = createCorsHeaders(request);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      } catch (error) {
        console.error("❌ Error en middleware de autenticación:", error);
        const corsHeaders = createCorsHeaders(request);
        const response = NextResponse.json(
          {
            error: "Error de autenticación",
            code: "AUTH_ERROR",
          },
          { status: 401 }
        );
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
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
