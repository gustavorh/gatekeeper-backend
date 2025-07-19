import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { StatisticsController } from "@/controllers/StatisticsController";
import { PERMISSIONS } from "@/lib/rbac-init";
import { quickOptions } from "@/lib/cors-helper";

async function getDashboardStatsHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const statisticsController = container.get<StatisticsController>(
      TYPES.StatisticsController
    );

    // Delegar al controlador - el middleware garantiza que user existe
    return await statisticsController.getDashboard(request, user!.userId);
  } catch (error) {
    console.error("Error en statistics/dashboard route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("DASHBOARD");

// Requiere permisos de lectura de estadísticas propias
export const GET = protectApi({
  permissions: [PERMISSIONS.STATISTICS.READ_OWN],
})(getDashboardStatsHandler);
