import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IStatisticsService } from "@/services/interfaces/IStatisticsService";
import { TYPES } from "@/types";
import { ResponseHelper } from "@/utils/ResponseHelper";

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

      return ResponseHelper.success(
        {
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
        },
        "Estadísticas del dashboard obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint dashboard stats:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
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
          return ResponseHelper.validationError("Formato de fecha inválido", [
            {
              field: "date",
              code: "INVALID_FORMAT",
              message: "El formato de fecha proporcionado es inválido",
            },
          ]);
        }
      }

      const weeklyStats = await this.statisticsService.getWeeklyStats(
        userId,
        date
      );

      return ResponseHelper.success(
        {
          weekStartDate: weeklyStats.weekStartDate,
          totalHours: weeklyStats.totalHours,
          totalDays: weeklyStats.totalDays,
          overtimeHours: weeklyStats.overtimeHours,
          sessions: weeklyStats.sessions,
        },
        "Estadísticas semanales obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint weekly stats:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
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
          return ResponseHelper.validationError("Formato de fecha inválido", [
            {
              field: "date",
              code: "INVALID_FORMAT",
              message: "El formato de fecha proporcionado es inválido",
            },
          ]);
        }
      }

      const monthlyStats = await this.statisticsService.getMonthlyStats(
        userId,
        date
      );

      return ResponseHelper.success(
        {
          monthStartDate: monthlyStats.monthStartDate,
          totalHours: monthlyStats.totalHours,
          totalDays: monthlyStats.totalDays,
          overtimeHours: monthlyStats.overtimeHours,
          averageHoursPerDay: monthlyStats.averageHoursPerDay,
          complianceScore: monthlyStats.complianceScore,
        },
        "Estadísticas mensuales obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint monthly stats:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
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

      // Validar parámetros requeridos
      const validationErrors = [];
      if (!startDateParam) {
        validationErrors.push({
          field: "startDate",
          message: "startDate es requerido",
        });
      }
      if (!endDateParam) {
        validationErrors.push({
          field: "endDate",
          message: "endDate es requerido",
        });
      }

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Parámetros requeridos faltantes",
          validationErrors
        );
      }

      const startDate = new Date(startDateParam!);
      const endDate = new Date(endDateParam!);

      // Validar formato de fechas
      if (isNaN(startDate.getTime())) {
        validationErrors.push({
          field: "startDate",
          code: "INVALID_FORMAT",
          message: "Formato de startDate inválido",
        });
      }
      if (isNaN(endDate.getTime())) {
        validationErrors.push({
          field: "endDate",
          code: "INVALID_FORMAT",
          message: "Formato de endDate inválido",
        });
      }

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Formato de fecha inválido",
          validationErrors
        );
      }

      // Validar lógica de fechas
      if (startDate >= endDate) {
        return ResponseHelper.validationError("Rango de fechas inválido", [
          {
            field: "startDate",
            code: "INVALID_RANGE",
            message: "startDate debe ser menor que endDate",
          },
        ]);
      }

      const complianceScore =
        await this.statisticsService.calculateComplianceScore(
          userId,
          startDate,
          endDate
        );

      return ResponseHelper.success(
        {
          complianceScore,
          period: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
          },
        },
        "Puntuación de cumplimiento calculada exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint compliance score:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }
}
