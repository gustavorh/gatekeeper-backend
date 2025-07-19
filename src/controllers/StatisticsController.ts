import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IStatisticsService } from "@/services/interfaces/IStatisticsService";
import { TYPES } from "@/types";

@injectable()
export class StatisticsController {
  constructor(
    @inject(TYPES.StatisticsService)
    private statisticsService: IStatisticsService
  ) {}

  async getDashboard(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      // Obtener estadísticas del dashboard para el usuario
      const dashboardStats = await this.statisticsService.getDashboardStats(
        userId
      );

      return NextResponse.json({
        weekStats: {
          totalHours: dashboardStats.weekStats.totalHours,
          totalDays: dashboardStats.weekStats.totalDays,
          overtimeHours: dashboardStats.weekStats.overtimeHours,
        },
        monthStats: {
          totalHours: dashboardStats.monthStats.totalHours,
          totalDays: dashboardStats.monthStats.totalDays,
          overtimeHours: dashboardStats.monthStats.overtimeHours,
        },
        averageEntryTime: dashboardStats.averageEntryTime,
        averageExitTime: dashboardStats.averageExitTime,
        averageLunchDuration: dashboardStats.averageLunchDuration,
        complianceScore: dashboardStats.complianceScore,
      });
    } catch (error) {
      console.error("Error en endpoint dashboard stats:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  async getWeeklyStats(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const dateParam = url.searchParams.get("date");

      let date: Date | undefined;
      if (dateParam) {
        date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Formato de fecha inválido" },
            { status: 400 }
          );
        }
      }

      const weeklyStats = await this.statisticsService.getWeeklyStats(
        userId,
        date
      );

      return NextResponse.json({
        weekStartDate: weeklyStats.weekStartDate,
        totalHours: weeklyStats.totalHours,
        totalDays: weeklyStats.totalDays,
        overtimeHours: weeklyStats.overtimeHours,
        sessions: weeklyStats.sessions,
      });
    } catch (error) {
      console.error("Error en endpoint weekly stats:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  async getMonthlyStats(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const dateParam = url.searchParams.get("date");

      let date: Date | undefined;
      if (dateParam) {
        date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Formato de fecha inválido" },
            { status: 400 }
          );
        }
      }

      const monthlyStats = await this.statisticsService.getMonthlyStats(
        userId,
        date
      );

      return NextResponse.json({
        monthStartDate: monthlyStats.monthStartDate,
        totalHours: monthlyStats.totalHours,
        totalDays: monthlyStats.totalDays,
        overtimeHours: monthlyStats.overtimeHours,
        averageHoursPerDay: monthlyStats.averageHoursPerDay,
        complianceScore: monthlyStats.complianceScore,
      });
    } catch (error) {
      console.error("Error en endpoint monthly stats:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  async getComplianceScore(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const startDateParam = url.searchParams.get("startDate");
      const endDateParam = url.searchParams.get("endDate");

      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          { error: "startDate y endDate son requeridos" },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Formato de fecha inválido" },
          { status: 400 }
        );
      }

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: "startDate debe ser menor que endDate" },
          { status: 400 }
        );
      }

      const complianceScore =
        await this.statisticsService.calculateComplianceScore(
          userId,
          startDate,
          endDate
        );

      return NextResponse.json({
        complianceScore,
        period: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      });
    } catch (error) {
      console.error("Error en endpoint compliance score:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }
}
