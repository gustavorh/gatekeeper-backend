import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { ITimeTrackingService } from "@/services/interfaces/ITimeTrackingService";
import { TYPES } from "@/types";
import { ClockActionRequestDTO } from "@/models/dtos";
import { ResponseHelper } from "@/utils/ResponseHelper";

@injectable()
export class TimeController {
  constructor(
    @inject(TYPES.TimeTrackingService)
    private timeTrackingService: ITimeTrackingService
  ) {}

  async clockIn(request: NextRequest, userId: number): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      // Convertir timestamp si se proporciona
      const clockInTime = timestamp ? new Date(timestamp) : undefined;

      // Ejecutar clock-in a través del servicio
      const result = await this.timeTrackingService.clockIn(
        userId,
        clockInTime
      );

      if (!result.success) {
        const errors =
          result.validationErrors?.map((error) => ({
            message: String(error),
          })) || [];

        return ResponseHelper.validationError(
          result.message || "Error en clock-in",
          errors
        );
      }

      return ResponseHelper.operationSuccess(
        result.message || "Clock-in realizado exitosamente",
        {
          session: result.session,
          entry: result.entry,
          buttonStates: result.buttonStates,
        }
      );
    } catch (error) {
      console.error("Error en endpoint clock-in:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async clockOut(request: NextRequest, userId: number): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      const clockOutTime = timestamp ? new Date(timestamp) : undefined;
      const result = await this.timeTrackingService.clockOut(
        userId,
        clockOutTime
      );

      if (!result.success) {
        const errors =
          result.validationErrors?.map((error) => ({
            message: String(error),
          })) || [];

        return ResponseHelper.validationError(
          result.message || "Error en clock-out",
          errors
        );
      }

      return ResponseHelper.operationSuccess(
        result.message || "Clock-out realizado exitosamente",
        {
          session: result.session,
          entry: result.entry,
          buttonStates: result.buttonStates,
          totalHours: result.session?.totalWorkHours || 0,
        }
      );
    } catch (error) {
      console.error("Error en endpoint clock-out:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async startLunch(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      const lunchTime = timestamp ? new Date(timestamp) : undefined;
      const result = await this.timeTrackingService.startLunch(
        userId,
        lunchTime
      );

      if (!result.success) {
        const errors =
          result.validationErrors?.map((error) => ({
            message: String(error),
          })) || [];

        return ResponseHelper.validationError(
          result.message || "Error al iniciar almuerzo",
          errors
        );
      }

      return ResponseHelper.operationSuccess(
        result.message || "Almuerzo iniciado exitosamente",
        {
          session: result.session,
          entry: result.entry,
          buttonStates: result.buttonStates,
        }
      );
    } catch (error) {
      console.error("Error en endpoint start-lunch:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async resumeShift(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      // Convertir timestamp si se proporciona
      const resumeTime = timestamp ? new Date(timestamp) : undefined;

      // Ejecutar resume-shift a través del servicio
      const result = await this.timeTrackingService.resumeShift(
        userId,
        resumeTime
      );

      if (!result.success) {
        const errors =
          result.validationErrors?.map((error) => ({
            message: String(error),
          })) || [];

        return ResponseHelper.validationError(
          result.message || "Error al reanudar turno",
          errors
        );
      }

      return ResponseHelper.operationSuccess(
        result.message || "Turno reanudado exitosamente",
        {
          session: result.session,
          entry: result.entry,
          buttonStates: result.buttonStates,
          lunchDuration: result.session?.totalLunchMinutes || 0,
        }
      );
    } catch (error) {
      console.error("Error en endpoint resume-shift:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async getCurrentStatus(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      // Obtener el estado actual a través del servicio
      const result = await this.timeTrackingService.getCurrentStatus(userId);

      return ResponseHelper.success(
        {
          status: result.status,
          session: result.session,
          buttonStates: result.buttonStates,
          canClockIn: result.buttonStates.clockIn.enabled,
          canClockOut: result.buttonStates.clockOut.enabled,
          canStartLunch: result.buttonStates.startLunch.enabled,
          canResumeShift: result.buttonStates.resumeShift.enabled,
          restrictions: [
            !result.buttonStates.clockIn.enabled &&
              result.buttonStates.clockIn.reason,
            !result.buttonStates.startLunch.enabled &&
              result.buttonStates.startLunch.reason,
          ].filter(Boolean),
        },
        "Estado actual obtenido exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint current-status:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async getTodaySession(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      // Obtener sesión de hoy a través del servicio
      const todaySession = await this.timeTrackingService.getTodaySession(
        userId
      );

      if (!todaySession) {
        return ResponseHelper.success(
          {
            session: null,
            workedHours: 0,
            lunchDuration: 0,
            remainingHours: 8,
            status: "clocked_out",
          },
          "No hay sesión activa para hoy"
        );
      }

      // Calcular horas restantes (basado en jornada de 8 horas)
      const remainingHours = Math.max(0, 8 - todaySession.workedHours);

      return ResponseHelper.success(
        {
          session: todaySession.session,
          workedHours: todaySession.workedHours,
          lunchDuration: todaySession.lunchDuration,
          remainingHours,
          status: todaySession.status,
          canClockIn: todaySession.canClockIn,
          canClockOut: todaySession.canClockOut,
          canStartLunch: todaySession.canStartLunch,
          canResumeShift: todaySession.canResumeShift,
        },
        "Sesión de hoy obtenida exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint today-session:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async getRecentActivities(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      // Obtener parámetros de consulta
      const url = new URL(request.url);
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? parseInt(limitParam) : 5;

      // Validar límite
      if (limit < 1 || limit > 100) {
        return ResponseHelper.validationError("Parámetro limit inválido", [
          { field: "limit", message: "El límite debe estar entre 1 y 100" },
        ]);
      }

      // Obtener actividades recientes a través del servicio
      const activities = await this.timeTrackingService.getRecentActivities(
        userId,
        limit
      );

      return ResponseHelper.success(
        {
          activities: activities.map((activity) => ({
            id: activity.id,
            type: activity.type,
            timestamp: activity.timestamp,
            date: activity.date,
            timezone: activity.timezone,
            isValid: activity.isValid,
          })),
        },
        "Actividades recientes obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint recent-activities:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async getSessions(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
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
      const validationErrors = [];
      if (page < 1) {
        validationErrors.push({
          field: "page",
          message: "La página debe ser mayor a 0",
        });
      }
      if (limit < 1 || limit > 100) {
        validationErrors.push({
          field: "limit",
          message: "El límite debe estar entre 1 y 100",
        });
      }

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Parámetros de paginación inválidos",
          validationErrors
        );
      }

      // Obtener sesiones del usuario a través del servicio
      const result = await this.timeTrackingService.getUserSessions(
        userId,
        page,
        limit,
        startDate,
        endDate
      );

      const sessionsData = result.sessions.map((session) => ({
        id: session.id,
        date: session.date,
        clockInTime: session.clockInTime,
        clockOutTime: session.clockOutTime,
        lunchStartTime: session.lunchStartTime,
        lunchEndTime: session.lunchEndTime,
        totalWorkHours: session.totalWorkHours,
        totalLunchMinutes: session.totalLunchMinutes,
        status: session.status,
      }));

      return ResponseHelper.successWithPagination(
        sessionsData,
        {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
          limit: limit,
          hasNextPage: result.currentPage < result.totalPages,
          hasPreviousPage: result.currentPage > 1,
        },
        "Sesiones obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint sessions:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }
}
