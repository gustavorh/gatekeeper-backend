import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
} from "./rbac-init";

export function withAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Skip authentication for OPTIONS requests (CORS preflight)
      if (request.method === "OPTIONS") {
        return new NextResponse(null, { status: 200 });
      }

      const authHeader = request.headers.get("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Token de autorización requerido" },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = verifyToken(token);

      if (!payload) {
        return NextResponse.json(
          { error: "Token inválido o expirado" },
          { status: 401 }
        );
      }

      // Pass the user payload to the handler
      return handler(request, payload);
    } catch (error) {
      console.error("Error en middleware de autenticación:", error);
      return NextResponse.json(
        { error: "Error de autenticación" },
        { status: 401 }
      );
    }
  };
}

// Middleware para verificar roles específicos
export function withRoles(requiredRoles: string[]) {
  return function (
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
  ) {
    return withAuth(async (request: NextRequest, user: JWTPayload) => {
      // Verificar si el usuario tiene alguno de los roles requeridos
      if (!hasAnyRole(user.roles || [], requiredRoles)) {
        return NextResponse.json(
          {
            error: "Acceso denegado",
            message: `Se requiere uno de los siguientes roles: ${requiredRoles.join(
              ", "
            )}`,
            userRoles: user.roles || [],
          },
          { status: 403 }
        );
      }

      return handler(request, user);
    });
  };
}

// Middleware para verificar permisos específicos
export function withPermissions(requiredPermissions: string[]) {
  return function (
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
  ) {
    return withAuth(async (request: NextRequest, user: JWTPayload) => {
      // Verificar si el usuario tiene alguno de los permisos requeridos
      if (!hasAnyPermission(user.permissions || [], requiredPermissions)) {
        return NextResponse.json(
          {
            error: "Acceso denegado",
            message: `Se requiere uno de los siguientes permisos: ${requiredPermissions.join(
              ", "
            )}`,
            userPermissions: user.permissions || [],
          },
          { status: 403 }
        );
      }

      return handler(request, user);
    });
  };
}

// Middleware para verificar si el usuario puede acceder a sus propios datos o a todos los datos
export function withResourceAccess(
  resourceOwnerIdGetter: (req: NextRequest) => number | Promise<number>
) {
  return function (
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
  ) {
    return withAuth(async (request: NextRequest, user: JWTPayload) => {
      const resourceOwnerId = await resourceOwnerIdGetter(request);

      // Si es admin, puede acceder a todos los recursos
      if (hasRole(user.roles || [], "admin")) {
        return handler(request, user);
      }

      // Si no es admin, solo puede acceder a sus propios recursos
      if (user.userId !== resourceOwnerId) {
        return NextResponse.json(
          {
            error: "Acceso denegado",
            message: "Solo puedes acceder a tus propios datos",
          },
          { status: 403 }
        );
      }

      return handler(request, user);
    });
  };
}
