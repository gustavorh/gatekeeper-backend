import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { initializeRBAC } from "@/lib/rbac-init";

async function initRBACHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Inicializar el sistema RBAC
    const result = await initializeRBAC();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Sistema RBAC inicializado correctamente",
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Error inicializando el sistema RBAC",
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en endpoint init RBAC:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// Solo administradores pueden inicializar el sistema RBAC
// Nota: Como es la primera vez, se necesita crear un admin manualmente en la BD
const initRBACWithAuth = withRoles(["admin"])(initRBACHandler);
const initRBACWithCors = withCors(initRBACWithAuth);

export const POST = initRBACWithCors;
export const OPTIONS = initRBACWithCors;
