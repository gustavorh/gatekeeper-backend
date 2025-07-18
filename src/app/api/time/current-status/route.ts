import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { getCurrentStatus } from "@/lib/time-tracking";

async function getCurrentStatusHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Obtener estado actual
    const currentStatus = await getCurrentStatus(user.userId);

    return NextResponse.json({
      status: currentStatus.status,
      session: currentStatus.session,
      buttonStates: currentStatus.buttonStates,
      canClockIn: currentStatus.buttonStates.clockIn.enabled,
      canClockOut: currentStatus.buttonStates.clockOut.enabled,
      canStartLunch: currentStatus.buttonStates.startLunch.enabled,
      canResumeShift: currentStatus.buttonStates.resumeShift.enabled,
      restrictions: [
        !currentStatus.buttonStates.clockIn.enabled &&
          currentStatus.buttonStates.clockIn.reason,
        !currentStatus.buttonStates.startLunch.enabled &&
          currentStatus.buttonStates.startLunch.reason,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("Error en endpoint current-status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares
const getCurrentStatusWithAuth = withAuth(getCurrentStatusHandler);
const getCurrentStatusWithCors = withCors(getCurrentStatusWithAuth);

export const GET = getCurrentStatusWithCors;
export const OPTIONS = getCurrentStatusWithCors;
