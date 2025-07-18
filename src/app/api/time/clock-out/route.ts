import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { clockOut } from "@/lib/time-tracking";

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

// Combinar middlewares
const clockOutWithAuth = withAuth(clockOutHandler);
const clockOutWithCors = withCors(clockOutWithAuth);

export const POST = clockOutWithCors;
export const OPTIONS = clockOutWithCors;
