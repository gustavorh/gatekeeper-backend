import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { getTodaySession } from "@/lib/time-tracking";

async function getTodaySessionHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Obtener sesión de hoy
    const todaySession = await getTodaySession(user.userId);

    if (!todaySession) {
      return NextResponse.json({
        session: null,
        workedHours: 0,
        lunchDuration: 0,
        remainingHours: 8,
        status: "clocked_out",
      });
    }

    // Calcular horas restantes (basado en jornada de 8 horas)
    const remainingHours = Math.max(0, 8 - todaySession.totalWorkedHours);

    return NextResponse.json({
      session: todaySession.session,
      workedHours: todaySession.totalWorkedHours,
      lunchDuration: todaySession.totalLunchMinutes,
      remainingHours,
      status: todaySession.currentStatus,
      canClockIn: todaySession.canClockIn,
      canClockOut: todaySession.canClockOut,
      canStartLunch: todaySession.canStartLunch,
      canResumeShift: todaySession.canResumeShift,
    });
  } catch (error) {
    console.error("Error en endpoint today-session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares
const getTodaySessionWithAuth = withAuth(getTodaySessionHandler);
const getTodaySessionWithCors = withCors(getTodaySessionWithAuth);

export const GET = getTodaySessionWithCors;
export const OPTIONS = getTodaySessionWithCors;
