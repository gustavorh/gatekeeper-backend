import { NextRequest, NextResponse } from "next/server";
import { withPermissions } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { getRecentActivities } from "@/lib/time-tracking";
import { PERMISSIONS } from "@/lib/rbac-init";

async function getRecentActivitiesHandler(
  request: NextRequest,
  user: JWTPayload
) {
  try {
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 5;

    // Obtener actividades recientes
    const activities = await getRecentActivities(user.userId, limit);

    return NextResponse.json({
      activities: activities.map((activity) => ({
        id: activity.id,
        type: activity.entryType,
        timestamp: activity.timestamp,
        date: activity.date,
        timezone: activity.timezone,
        isValid: activity.isValid,
      })),
    });
  } catch (error) {
    console.error("Error en endpoint recent-activities:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares - solo usuarios con permisos de lectura pueden ver actividades
const getRecentActivitiesWithAuth = withPermissions([
  PERMISSIONS.TIME_TRACKING.READ_OWN,
])(getRecentActivitiesHandler);
const getRecentActivitiesWithCors = withCors(getRecentActivitiesWithAuth);

export const GET = getRecentActivitiesWithCors;
export const OPTIONS = getRecentActivitiesWithCors;
