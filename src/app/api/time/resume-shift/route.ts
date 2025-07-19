import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";

import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY, PUBLIC_ROUTE } from "@/lib/auth-middleware";

import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { TimeController } from "@/controllers/TimeController";
import { PERMISSIONS } from "@/lib/rbac-init";
import { quickOptions } from "@/lib/cors-helper";

async function resumeShiftHandler(request: NextRequest, user?: JWTPayload) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const timeController = container.get<TimeController>(TYPES.TimeController);

    // Delegar al controlador
    return await timeController.resumeShift(request, user!.userId);
  } catch (error) {
    console.error("Error en resume-shift route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("RESUME-SHIFT");

// Solo usuarios con permisos de escritura pueden reanudar turno
export const POST = protectApi({
  permissions: [PERMISSIONS.TIME_TRACKING.WRITE_OWN],
})(resumeShiftHandler);
