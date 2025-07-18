import { db } from "./db";
import { workSessions, workStatistics, NewWorkStatistics } from "./schema";
import { eq, and, gte, lte, sql, sum, avg, count } from "drizzle-orm";

export interface DashboardStats {
  weekStats: {
    totalHours: number;
    totalDays: number;
    overtimeHours: number;
  };
  monthStats: {
    totalHours: number;
    totalDays: number;
    overtimeHours: number;
  };
  averageEntryTime: string;
  averageExitTime: string;
  averageLunchDuration: number;
  complianceScore: number;
}

export interface WeeklyStats {
  weekStartDate: string;
  totalHours: number;
  totalDays: number;
  overtimeHours: number;
  sessions: Array<{
    date: string;
    totalWorkHours: number;
    totalLunchMinutes: number;
    status: string;
  }>;
}

export interface MonthlyStats {
  monthStartDate: string;
  totalHours: number;
  totalDays: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  complianceScore: number;
}

/**
 * Utilidad para obtener la fecha actual en formato Chile/Santiago
 */
function getCurrentChileTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Santiago" })
  );
}

/**
 * Calcula el inicio de la semana (lunes)
 */
function getWeekStart(date: Date): Date {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Calcula el inicio del mes
 */
function getMonthStart(date: Date): Date {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * Calcula estadísticas semanales
 */
export async function calculateWeeklyStats(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<WeeklyStats> {
  try {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDateStr = weekStart.toISOString().split("T")[0];
    const endDateStr = weekEnd.toISOString().split("T")[0];

    // Obtener sesiones de la semana
    const sessions = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) >= ${startDateStr}`,
          sql`DATE(${workSessions.date}) <= ${endDateStr}`
        )
      );

    let totalHours = 0;
    let totalDays = 0;
    let overtimeHours = 0;

    const sessionDetails = sessions.map((session) => {
      const workHours = Number(session.totalWorkHours) || 0;
      totalHours += workHours;

      if (session.status === "completed") {
        totalDays++;
      }

      // Calcular horas extras (más de 8 horas por día)
      if (workHours > 8) {
        overtimeHours += workHours - 8;
      }

      return {
        date:
          typeof session.date === "string"
            ? session.date
            : session.date.toISOString().split("T")[0],
        totalWorkHours: workHours,
        totalLunchMinutes: session.totalLunchMinutes || 0,
        status: session.status || "active",
      };
    });

    return {
      weekStartDate: startDateStr,
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      sessions: sessionDetails,
    };
  } catch (error) {
    console.error("Error calculando estadísticas semanales:", error);
    return {
      weekStartDate: date.toISOString().split("T")[0],
      totalHours: 0,
      totalDays: 0,
      overtimeHours: 0,
      sessions: [],
    };
  }
}

/**
 * Calcula estadísticas mensuales
 */
export async function calculateMonthlyStats(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<MonthlyStats> {
  try {
    const monthStart = getMonthStart(date);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const startDateStr = monthStart.toISOString().split("T")[0];
    const endDateStr = monthEnd.toISOString().split("T")[0];

    // Obtener sesiones del mes
    const sessions = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) >= ${startDateStr}`,
          sql`DATE(${workSessions.date}) <= ${endDateStr}`
        )
      );

    let totalHours = 0;
    let totalDays = 0;
    let overtimeHours = 0;
    let complianceViolations = 0;

    sessions.forEach((session) => {
      const workHours = Number(session.totalWorkHours) || 0;
      totalHours += workHours;

      if (session.status === "completed") {
        totalDays++;
      }

      // Calcular horas extras (más de 8 horas por día)
      if (workHours > 8) {
        overtimeHours += workHours - 8;
      }

      // Verificar violaciones de compliance
      if (workHours > 10) {
        complianceViolations++;
      }
    });

    const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const complianceScore =
      totalDays > 0 ? Math.max(0, 100 - complianceViolations * 10) : 100;

    return {
      monthStartDate: startDateStr,
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      complianceScore: Math.round(complianceScore * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculando estadísticas mensuales:", error);
    return {
      monthStartDate: date.toISOString().split("T")[0],
      totalHours: 0,
      totalDays: 0,
      overtimeHours: 0,
      averageHoursPerDay: 0,
      complianceScore: 100,
    };
  }
}

/**
 * Calcula promedios de entrada y salida
 */
export async function calculateAverages(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<{
  averageEntryTime: string;
  averageExitTime: string;
  averageLunchDuration: number;
}> {
  try {
    const monthStart = getMonthStart(date);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const startDateStr = monthStart.toISOString().split("T")[0];
    const endDateStr = monthEnd.toISOString().split("T")[0];

    // Obtener sesiones completadas del mes
    const sessions = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          eq(workSessions.status, "completed"),
          sql`DATE(${workSessions.date}) >= ${startDateStr}`,
          sql`DATE(${workSessions.date}) <= ${endDateStr}`
        )
      );

    if (sessions.length === 0) {
      return {
        averageEntryTime: "08:00",
        averageExitTime: "17:00",
        averageLunchDuration: 60,
      };
    }

    let totalEntryMinutes = 0;
    let totalExitMinutes = 0;
    let totalLunchMinutes = 0;
    let validSessions = 0;

    sessions.forEach((session) => {
      if (session.clockInTime && session.clockOutTime) {
        const clockIn = new Date(session.clockInTime);
        const clockOut = new Date(session.clockOutTime);

        // Convertir horas a minutos desde medianoche
        const entryMinutes = clockIn.getHours() * 60 + clockIn.getMinutes();
        const exitMinutes = clockOut.getHours() * 60 + clockOut.getMinutes();

        totalEntryMinutes += entryMinutes;
        totalExitMinutes += exitMinutes;
        totalLunchMinutes += session.totalLunchMinutes || 0;
        validSessions++;
      }
    });

    if (validSessions === 0) {
      return {
        averageEntryTime: "08:00",
        averageExitTime: "17:00",
        averageLunchDuration: 60,
      };
    }

    // Calcular promedios
    const avgEntryMinutes = Math.round(totalEntryMinutes / validSessions);
    const avgExitMinutes = Math.round(totalExitMinutes / validSessions);
    const avgLunchMinutes = Math.round(totalLunchMinutes / validSessions);

    // Convertir minutos a formato HH:MM
    const entryHours = Math.floor(avgEntryMinutes / 60);
    const entryMins = avgEntryMinutes % 60;
    const exitHours = Math.floor(avgExitMinutes / 60);
    const exitMins = avgExitMinutes % 60;

    return {
      averageEntryTime: `${entryHours.toString().padStart(2, "0")}:${entryMins
        .toString()
        .padStart(2, "0")}`,
      averageExitTime: `${exitHours.toString().padStart(2, "0")}:${exitMins
        .toString()
        .padStart(2, "0")}`,
      averageLunchDuration: avgLunchMinutes,
    };
  } catch (error) {
    console.error("Error calculando promedios:", error);
    return {
      averageEntryTime: "08:00",
      averageExitTime: "17:00",
      averageLunchDuration: 60,
    };
  }
}

/**
 * Obtiene estadísticas completas para el dashboard
 */
export async function getDashboardStats(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<DashboardStats> {
  try {
    // Calcular estadísticas en paralelo
    const [weekStats, monthStats, averages] = await Promise.all([
      calculateWeeklyStats(userId, date),
      calculateMonthlyStats(userId, date),
      calculateAverages(userId, date),
    ]);

    return {
      weekStats: {
        totalHours: weekStats.totalHours,
        totalDays: weekStats.totalDays,
        overtimeHours: weekStats.overtimeHours,
      },
      monthStats: {
        totalHours: monthStats.totalHours,
        totalDays: monthStats.totalDays,
        overtimeHours: monthStats.overtimeHours,
      },
      averageEntryTime: averages.averageEntryTime,
      averageExitTime: averages.averageExitTime,
      averageLunchDuration: averages.averageLunchDuration,
      complianceScore: monthStats.complianceScore,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas del dashboard:", error);
    return {
      weekStats: {
        totalHours: 0,
        totalDays: 0,
        overtimeHours: 0,
      },
      monthStats: {
        totalHours: 0,
        totalDays: 0,
        overtimeHours: 0,
      },
      averageEntryTime: "08:00",
      averageExitTime: "17:00",
      averageLunchDuration: 60,
      complianceScore: 100,
    };
  }
}

/**
 * Actualiza o crea estadísticas pre-calculadas
 */
export async function updateOrCreateStatistics(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<void> {
  try {
    const weekStart = getWeekStart(date);
    const monthStart = getMonthStart(date);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const monthStartStr = monthStart.toISOString().split("T")[0];

    // Verificar si ya existen estadísticas
    const existingStats = await db
      .select()
      .from(workStatistics)
      .where(
        and(
          eq(workStatistics.userId, userId),
          sql`DATE(${workStatistics.weekStartDate}) = ${weekStartStr}`,
          sql`DATE(${workStatistics.monthStartDate}) = ${monthStartStr}`
        )
      )
      .limit(1);

    const [weekStats, monthStats, averages] = await Promise.all([
      calculateWeeklyStats(userId, date),
      calculateMonthlyStats(userId, date),
      calculateAverages(userId, date),
    ]);

    const statsData = {
      userId,
      weekStartDate: weekStart,
      monthStartDate: monthStart,
      totalHoursWeek: weekStats.totalHours.toFixed(2),
      totalDaysWeek: weekStats.totalDays,
      overtimeHoursWeek: weekStats.overtimeHours.toFixed(2),
      totalHoursMonth: monthStats.totalHours.toFixed(2),
      totalDaysMonth: monthStats.totalDays,
      overtimeHoursMonth: monthStats.overtimeHours.toFixed(2),
      averageEntryTime: averages.averageEntryTime,
      averageExitTime: averages.averageExitTime,
      averageLunchDuration: averages.averageLunchDuration,
      complianceScore: monthStats.complianceScore.toFixed(2),
    };

    if (existingStats.length > 0) {
      // Actualizar estadísticas existentes
      await db
        .update(workStatistics)
        .set(statsData)
        .where(eq(workStatistics.id, existingStats[0].id));
    } else {
      // Crear nuevas estadísticas
      await db.insert(workStatistics).values(statsData);
    }
  } catch (error) {
    console.error("Error actualizando estadísticas:", error);
  }
}

/**
 * Obtiene estadísticas almacenadas
 */
export async function getStoredStatistics(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<DashboardStats | null> {
  try {
    const weekStart = getWeekStart(date);
    const monthStart = getMonthStart(date);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const stats = await db
      .select()
      .from(workStatistics)
      .where(
        and(
          eq(workStatistics.userId, userId),
          sql`DATE(${workStatistics.weekStartDate}) = ${weekStartStr}`,
          sql`DATE(${workStatistics.monthStartDate}) = ${monthStartStr}`
        )
      )
      .limit(1);

    if (stats.length === 0) {
      return null;
    }

    const stat = stats[0];

    return {
      weekStats: {
        totalHours: Number(stat.totalHoursWeek) || 0,
        totalDays: stat.totalDaysWeek || 0,
        overtimeHours: Number(stat.overtimeHoursWeek) || 0,
      },
      monthStats: {
        totalHours: Number(stat.totalHoursMonth) || 0,
        totalDays: stat.totalDaysMonth || 0,
        overtimeHours: Number(stat.overtimeHoursMonth) || 0,
      },
      averageEntryTime: stat.averageEntryTime || "08:00",
      averageExitTime: stat.averageExitTime || "17:00",
      averageLunchDuration: stat.averageLunchDuration || 60,
      complianceScore: Number(stat.complianceScore) || 100,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas almacenadas:", error);
    return null;
  }
}
