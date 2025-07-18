import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { resumeShift } from "@/lib/time-tracking";

async function resumeShiftHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const { timestamp } = body;

    // Convertir timestamp si se proporciona
    const resumeTime = timestamp ? new Date(timestamp) : new Date();

    // Ejecutar resume-shift
    const result = await resumeShift(user.userId, resumeTime);

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
      lunchDuration: result.session?.totalLunchMinutes || 0,
    });
  } catch (error) {
    console.error("Error en endpoint resume-shift:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares
const resumeShiftWithAuth = withAuth(resumeShiftHandler);
const resumeShiftWithCors = withCors(resumeShiftWithAuth);

export const POST = resumeShiftWithCors;
