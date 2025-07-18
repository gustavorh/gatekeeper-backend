import { NextRequest, NextResponse } from "next/server";
import { withPermissions } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { clockIn } from "@/lib/time-tracking";
import { PERMISSIONS } from "@/lib/rbac-init";

async function clockInHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const { timestamp } = body;

    // Convertir timestamp si se proporciona
    const clockInTime = timestamp ? new Date(timestamp) : new Date();

    // Ejecutar clock-in
    const result = await clockIn(user.userId, clockInTime);

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
    console.error("Error en endpoint clock-in:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares - solo usuarios con permisos de time tracking pueden hacer clock-in
const clockInWithAuth = withPermissions([PERMISSIONS.TIME_TRACKING.WRITE_OWN])(
  clockInHandler
);
const clockInWithCors = withCors(clockInWithAuth);

export const POST = clockInWithCors;
export const OPTIONS = clockInWithCors;
