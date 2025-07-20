import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminWorkSessionController } from "@/controllers/AdminWorkSessionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener todas las sesiones con filtros
async function getAllSessionsHandler(request: NextRequest, user?: JWTPayload) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.getAllSessions(request);
  } catch (error) {
    console.error("Error en admin/work-sessions route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva sesión
async function createSessionHandler(request: NextRequest, user?: JWTPayload) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.createSession(request);
  } catch (error) {
    console.error("Error en admin/work-sessions POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-WORK-SESSIONS");

// Solo administradores pueden gestionar sesiones
export const GET = ADMIN_ONLY(getAllSessionsHandler);
export const POST = ADMIN_ONLY(createSessionHandler);
