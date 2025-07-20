import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminWorkSessionController } from "@/controllers/AdminWorkSessionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener una sesión específica
async function getSessionByIdHandler(request: NextRequest, user?: JWTPayload) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.getSessionById(request);
  } catch (error) {
    console.error("Error en admin/work-sessions/[sessionId] GET route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una sesión
async function updateSessionHandler(request: NextRequest, user?: JWTPayload) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.updateSession(request);
  } catch (error) {
    console.error("Error en admin/work-sessions/[sessionId] PUT route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una sesión
async function deleteSessionHandler(request: NextRequest, user?: JWTPayload) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.deleteSession(request);
  } catch (error) {
    console.error(
      "Error en admin/work-sessions/[sessionId] DELETE route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-WORK-SESSION");

// Solo administradores pueden gestionar sesiones específicas
export const GET = ADMIN_ONLY(getSessionByIdHandler);
export const PUT = ADMIN_ONLY(updateSessionHandler);
export const DELETE = ADMIN_ONLY(deleteSessionHandler);
