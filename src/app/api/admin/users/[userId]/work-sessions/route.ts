import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminWorkSessionController } from "@/controllers/AdminWorkSessionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener sesiones de un usuario específico
async function getUserSessionsHandler(request: NextRequest, user?: JWTPayload) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.getUserSessions(request);
  } catch (error) {
    console.error("Error en admin/users/[userId]/work-sessions route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-USER-WORK-SESSIONS");

// Solo administradores pueden ver sesiones de usuarios
export const GET = ADMIN_ONLY(getUserSessionsHandler);
