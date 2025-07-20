import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminWorkSessionController } from "@/controllers/AdminWorkSessionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener estadísticas de sesiones
async function getSessionStatisticsHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.getSessionStatistics(request);
  } catch (error) {
    console.error("Error en admin/work-sessions/statistics route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-WORK-SESSIONS-STATISTICS");

// Solo administradores pueden ver estadísticas
export const GET = ADMIN_ONLY(getSessionStatisticsHandler);
