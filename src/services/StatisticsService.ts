import { injectable, inject } from "inversify";
import type { IStatisticsService } from "./interfaces/IStatisticsService";
import type { IWorkSessionRepository } from "@/repositories/interfaces/IWorkSessionRepository";
import type { IDateUtils } from "@/utils/interfaces/IDateUtils";
import { TYPES } from "@/types";
import {
  DashboardStatsDTO,
  WeeklyStatsDTO,
  MonthlyStatsDTO,
} from "@/models/dtos";

@injectable()
export class StatisticsService implements IStatisticsService {
  constructor(
    @inject(TYPES.WorkSessionRepository)
    private sessionRepo: IWorkSessionRepository,
    @inject(TYPES.DateUtils) private dateUtils: IDateUtils
  ) {}

  async getDashboardStats(userId: number): Promise<DashboardStatsDTO> {
    try {
      const currentDate = this.getCurrentChileTime();

      // Calcular estadísticas semanales y mensuales en paralelo
      const [weekStats, monthStats] = await Promise.all([
        this.getWeeklyStats(userId, currentDate),
        this.getMonthlyStats(userId, currentDate),
      ]);

      // Calcular promedios de entrada y salida (simplificado por ahora)
      const averageEntryTime = await this.calculateAverageEntryTime(userId);
      const averageExitTime = await this.calculateAverageExitTime(userId);
      const averageLunchDuration = await this.calculateAverageLunchDuration(
        userId
      );

      // Calcular compliance score para el mes actual
      const monthStart = this.getMonthStart(currentDate);
      const complianceScore = await this.calculateComplianceScore(
        userId,
        monthStart,
        currentDate
      );

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
        averageEntryTime,
        averageExitTime,
        averageLunchDuration,
        complianceScore,
      };
    } catch (error) {
      console.error("Error calculando estadísticas del dashboard:", error);
      return this.getEmptyDashboardStats();
    }
  }

  async getWeeklyStats(userId: number, date?: Date): Promise<WeeklyStatsDTO> {
    try {
      const targetDate = date || this.getCurrentChileTime();
      const weekStart = this.getWeekStart(targetDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Formatear fechas para la query
      const startDateStr = weekStart.toISOString().split("T")[0];
      const endDateStr = weekEnd.toISOString().split("T")[0];

      // Obtener sesiones de la semana
      const result = await this.sessionRepo.findByUserId(userId, {
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 50,
      });

      const sessions = result.data;

      // Calcular totales
      let totalHours = 0;
      let totalDays = 0;

      const sessionDetails = sessions.map((session) => {
        const workHours = Number(session.totalWorkHours) || 0;
        totalHours += workHours;

        if (workHours > 0) {
          totalDays++;
        }

        return {
          date: session.date.toISOString().split("T")[0],
          totalWorkHours: workHours,
          totalLunchMinutes: session.totalLunchMinutes || 0,
          status: session.status,
        };
      });

      const overtimeHours = this.calculateOvertimeHours(
        totalHours,
        totalDays * 8
      );

      return {
        weekStartDate: weekStart.toISOString().split("T")[0],
        totalHours,
        totalDays,
        overtimeHours,
        sessions: sessionDetails,
      };
    } catch (error) {
      console.error("Error calculando estadísticas semanales:", error);
      return this.getEmptyWeeklyStats(date);
    }
  }

  async getMonthlyStats(userId: number, date?: Date): Promise<MonthlyStatsDTO> {
    try {
      const targetDate = date || this.getCurrentChileTime();
      const monthStart = this.getMonthStart(targetDate);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      // Formatear fechas para la query
      const startDateStr = monthStart.toISOString().split("T")[0];
      const endDateStr = monthEnd.toISOString().split("T")[0];

      // Obtener sesiones del mes
      const result = await this.sessionRepo.findByUserId(userId, {
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      });

      const sessions = result.data;

      // Calcular totales
      let totalHours = 0;
      let totalDays = 0;

      sessions.forEach((session) => {
        const workHours = Number(session.totalWorkHours) || 0;
        totalHours += workHours;

        if (workHours > 0) {
          totalDays++;
        }
      });

      const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
      const overtimeHours = this.calculateOvertimeHours(
        totalHours,
        totalDays * 8
      );
      const complianceScore = await this.calculateComplianceScore(
        userId,
        monthStart,
        monthEnd
      );

      return {
        monthStartDate: monthStart.toISOString().split("T")[0],
        totalHours,
        totalDays,
        overtimeHours,
        averageHoursPerDay,
        complianceScore,
      };
    } catch (error) {
      console.error("Error calculando estadísticas mensuales:", error);
      return this.getEmptyMonthlyStats(date);
    }
  }

  async calculateComplianceScore(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Formatear fechas para la query
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Obtener sesiones del período
      const result = await this.sessionRepo.findByUserId(userId, {
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      });

      const sessions = result.data;

      if (sessions.length === 0) return 100;

      let compliantSessions = 0;
      let totalSessions = sessions.length;

      sessions.forEach((session) => {
        const workHours = Number(session.totalWorkHours) || 0;

        // Considerar compliant si trabajó entre 7 y 10 horas
        if (workHours >= 7 && workHours <= 10) {
          compliantSessions++;
        }
      });

      return Math.round((compliantSessions / totalSessions) * 100);
    } catch (error) {
      console.error("Error calculando compliance score:", error);
      return 85; // Score por defecto
    }
  }

  calculateOvertimeHours(
    totalHours: number,
    regularHours: number = 40
  ): number {
    return Math.max(0, totalHours - regularHours);
  }

  getWeekStart(date?: Date): Date {
    const targetDate = date || this.getCurrentChileTime();
    const startOfWeek = new Date(targetDate);
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  getMonthStart(date?: Date): Date {
    const targetDate = date || this.getCurrentChileTime();
    const startOfMonth = new Date(targetDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return startOfMonth;
  }

  getCurrentChileTime(): Date {
    return this.dateUtils.getCurrentChileTime();
  }

  // Métodos auxiliares privados

  private async calculateAverageEntryTime(userId: number): Promise<string> {
    try {
      // En una implementación completa, calcularíamos el promedio real
      // Por ahora retornamos un valor por defecto
      return "09:15";
    } catch (error) {
      return "09:00";
    }
  }

  private async calculateAverageExitTime(userId: number): Promise<string> {
    try {
      // En una implementación completa, calcularíamos el promedio real
      // Por ahora retornamos un valor por defecto
      return "18:30";
    } catch (error) {
      return "18:00";
    }
  }

  private async calculateAverageLunchDuration(userId: number): Promise<number> {
    try {
      // En una implementación completa, calcularíamos el promedio real
      // Por ahora retornamos un valor por defecto en minutos
      return 45;
    } catch (error) {
      return 30;
    }
  }

  private getEmptyDashboardStats(): DashboardStatsDTO {
    return {
      weekStats: { totalHours: 0, totalDays: 0, overtimeHours: 0 },
      monthStats: { totalHours: 0, totalDays: 0, overtimeHours: 0 },
      averageEntryTime: "09:00",
      averageExitTime: "18:00",
      averageLunchDuration: 30,
      complianceScore: 100,
    };
  }

  private getEmptyWeeklyStats(date?: Date): WeeklyStatsDTO {
    const weekStart = this.getWeekStart(date);
    return {
      weekStartDate: weekStart.toISOString().split("T")[0],
      totalHours: 0,
      totalDays: 0,
      overtimeHours: 0,
      sessions: [],
    };
  }

  private getEmptyMonthlyStats(date?: Date): MonthlyStatsDTO {
    const monthStart = this.getMonthStart(date);
    return {
      monthStartDate: monthStart.toISOString().split("T")[0],
      totalHours: 0,
      totalDays: 0,
      overtimeHours: 0,
      averageHoursPerDay: 0,
      complianceScore: 100,
    };
  }
}
