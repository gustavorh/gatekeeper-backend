import { NextRequest, NextResponse } from "next/server";
import { withPermissions } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { getUserSessions } from "@/lib/time-tracking";
import { PERMISSIONS } from "@/lib/rbac-init";

async function getSessionsHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const startDate = startDateParam || undefined;
    const endDate = endDateParam || undefined;

    // Validar parámetros
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Parámetros de paginación inválidos" },
        { status: 400 }
      );
    }

    // Obtener sesiones del usuario
    const result = await getUserSessions(
      user.userId,
      page,
      limit,
      startDate,
      endDate
    );

    return NextResponse.json({
      sessions: result.sessions.map((session) => ({
        id: session.id,
        date: session.date,
        clockInTime: session.clockInTime,
        clockOutTime: session.clockOutTime,
        lunchStartTime: session.lunchStartTime,
        lunchEndTime: session.lunchEndTime,
        totalWorkHours: session.totalWorkHours,
        totalLunchMinutes: session.totalLunchMinutes,
        status: session.status,
        isOvertimeDay: session.isOvertimeDay,
        overtimeMinutes: session.overtimeMinutes,
        isValidSession: session.isValidSession,
      })),
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        total: result.total,
        limit: limit,
        hasNextPage: result.currentPage < result.totalPages,
        hasPreviousPage: result.currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Error en endpoint sessions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares - solo usuarios con permisos de lectura pueden ver sus sesiones
const getSessionsWithAuth = withPermissions([
  PERMISSIONS.TIME_TRACKING.READ_OWN,
])(getSessionsHandler);
const getSessionsWithCors = withCors(getSessionsWithAuth);

export const GET = getSessionsWithCors;
export const OPTIONS = getSessionsWithCors;
