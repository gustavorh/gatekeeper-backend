import { NextRequest, NextResponse } from "next/server";
import { withPermissions } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { clockOut } from "@/lib/time-tracking";
import { PERMISSIONS } from "@/lib/rbac-init";

async function clockOutHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const { timestamp } = body;

    // Convertir timestamp si se proporciona
    const clockOutTime = timestamp ? new Date(timestamp) : new Date();

    // Ejecutar clock-out
    const result = await clockOut(user.userId, clockOutTime);

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
      totalHours: result.session?.totalWorkHours || 0,
    });
  } catch (error) {
    console.error("Error en endpoint clock-out:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares - solo usuarios con permisos de time tracking pueden hacer clock-out
const clockOutWithAuth = withPermissions([PERMISSIONS.TIME_TRACKING.WRITE_OWN])(
  clockOutHandler
);
const clockOutWithCors = withCors(clockOutWithAuth);

export const POST = clockOutWithCors;
export const OPTIONS = clockOutWithCors;
