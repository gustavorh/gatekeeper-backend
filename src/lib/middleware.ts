import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";

export function withAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
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
