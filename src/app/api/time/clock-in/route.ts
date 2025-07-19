import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { TimeController } from "@/controllers/TimeController";
import { PERMISSIONS } from "@/lib/rbac-init";
import { quickOptions } from "@/lib/cors-helper";

async function clockInHandler(request: NextRequest, user?: JWTPayload) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const timeController = container.get<TimeController>(TYPES.TimeController);

    // Delegar al controlador - el middleware garantiza que user existe
    return await timeController.clockIn(request, user!.userId);
  } catch (error) {
    console.error("Error en clock-in route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("CLOCK-IN");

// Solo usuarios con permisos de escritura pueden hacer clock-in
export const POST = protectApi({
  permissions: [PERMISSIONS.TIME_TRACKING.WRITE_OWN],
})(clockInHandler);
