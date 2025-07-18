import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { getDashboardStats } from "@/lib/statistics";

async function getDashboardStatsHandler(
  request: NextRequest,
  user: JWTPayload
) {
  try {
    // Obtener estadísticas del dashboard
    const stats = await getDashboardStats(user.userId);

    return NextResponse.json({
      weekStats: {
        totalHours: stats.weekStats.totalHours,
        totalDays: stats.weekStats.totalDays,
        overtimeHours: stats.weekStats.overtimeHours,
      },
      monthStats: {
        totalHours: stats.monthStats.totalHours,
        totalDays: stats.monthStats.totalDays,
        overtimeHours: stats.monthStats.overtimeHours,
      },
      averageEntryTime: stats.averageEntryTime,
      averageExitTime: stats.averageExitTime,
      averageLunchDuration: stats.averageLunchDuration,
      complianceScore: stats.complianceScore,
    });
  } catch (error) {
    console.error("Error en endpoint dashboard stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares
const getDashboardStatsWithAuth = withAuth(getDashboardStatsHandler);
const getDashboardStatsWithCors = withCors(getDashboardStatsWithAuth);

export const GET = getDashboardStatsWithCors;
export const OPTIONS = getDashboardStatsWithCors;
