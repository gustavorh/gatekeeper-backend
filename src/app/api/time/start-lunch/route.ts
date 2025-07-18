import { NextRequest, NextResponse } from "next/server";
import { withPermissions } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { startLunch } from "@/lib/time-tracking";
import { PERMISSIONS } from "@/lib/rbac-init";

async function startLunchHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const { timestamp } = body;

    // Convertir timestamp si se proporciona
    const lunchTime = timestamp ? new Date(timestamp) : new Date();

    // Ejecutar start-lunch
    const result = await startLunch(user.userId, lunchTime);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
          validationErrors: result.validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      session: result.session,
      entry: result.entry,
      buttonStates: result.buttonStates,
    });
  } catch (error) {
    console.error("Error en endpoint start-lunch:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares - solo usuarios con permisos de escritura pueden iniciar almuerzo
const startLunchWithAuth = withPermissions([
  PERMISSIONS.TIME_TRACKING.WRITE_OWN,
])(startLunchHandler);
const startLunchWithCors = withCors(startLunchWithAuth);

export const POST = startLunchWithCors;
export const OPTIONS = startLunchWithCors;
