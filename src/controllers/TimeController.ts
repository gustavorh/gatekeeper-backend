import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { ITimeTrackingService } from "@/services/interfaces/ITimeTrackingService";
import type { IValidationUtils } from "@/utils/interfaces/IValidationUtils";
import { TYPES } from "@/types";
import { ClockActionRequestDTO } from "@/models/dtos";
import { ResponseHelper } from "@/utils/ResponseHelper";
import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/utils/exceptions";

@injectable()
export class TimeController {
  constructor(
    @inject(TYPES.TimeTrackingService)
    private timeTrackingService: ITimeTrackingService,
    @inject(TYPES.ValidationUtils)
    private validationUtils: IValidationUtils
  ) {}

  /**
   * Helper method to handle service exceptions consistently
   */
  private handleServiceError(error: Error): NextResponse {
    if (error instanceof BusinessRuleError) {
      return ResponseHelper.validationError(error.message, [
        { message: error.message },
      ]);
    }

    if (error instanceof NotFoundError) {
      return ResponseHelper.notFoundError(error.message);
    }

    if (error instanceof ValidationError) {
      return ResponseHelper.validationError(
        error.message,
        error.validationErrors
      );
    }

    if (error instanceof ConflictError) {
      return ResponseHelper.conflictError(error.message);
    }

    console.error("Error interno del servicio:", error);
    return ResponseHelper.internalServerError(
      "Error interno del servidor",
      error
    );
  }

  async clockIn(request: NextRequest, userId: number): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      // Convertir timestamp si se proporciona
      const clockInTime = timestamp ? new Date(timestamp) : new Date();

      // Realizar validaciones en el controlador
      const validations = await this.validationUtils.validateTimeEntry(
        userId,
        "clock_in",
        clockInTime
      );

      const errors = validations.filter((v) => !v.isValid);

      if (errors.length > 0) {
        const validationErrors = errors.map((error) => ({
          message: error.error!,
        }));

        return ResponseHelper.validationError(
          "No se pudo realizar el clock-in",
          validationErrors
        );
      }

      // Ejecutar clock-in a través del servicio (sin validaciones)
      const result = await this.timeTrackingService.clockIn(
        userId,
        clockInTime
      );

      return ResponseHelper.operationSuccess(
        "Clock-in realizado exitosamente",
        {
          session: result.session,
          entry: result.entry,
          buttonStates: result.buttonStates,
        }
      );
    } catch (error) {
      return this.handleServiceError(error as Error);
    }
  }

  async clockOut(request: NextRequest, userId: number): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      const clockOutTime = timestamp ? new Date(timestamp) : new Date();

      // Realizar validaciones en el controlador
      const validations = await this.validationUtils.validateTimeEntry(
        userId,
        "clock_out",
        clockOutTime
      );

      const errors = validations.filter((v) => !v.isValid);

      if (errors.length > 0) {
        const validationErrors = errors.map((error) => ({
          message: error.error!,
        }));

        return ResponseHelper.validationError(
          "No se pudo realizar el clock-out",
          validationErrors
        );
      }

      const result = await this.timeTrackingService.clockOut(
        userId,
        clockOutTime
      );

      return ResponseHelper.operationSuccess(
        "Clock-out realizado exitosamente",
        {
          session: result.session,
          entry: result.entry,
          buttonStates: result.buttonStates,
          totalHours: result.session?.totalWorkHours || 0,
        }
      );
    } catch (error) {
      return this.handleServiceError(error as Error);
    }
  }

  async startLunch(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      const lunchTime = timestamp ? new Date(timestamp) : new Date();

      // Realizar validaciones en el controlador
      const validations = await this.validationUtils.validateTimeEntry(
        userId,
        "start_lunch",
        lunchTime
      );

      const errors = validations.filter((v) => !v.isValid);

      if (errors.length > 0) {
        const validationErrors = errors.map((error) => ({
          message: error.error!,
        }));

        return ResponseHelper.validationError(
          "No se pudo iniciar el almuerzo",
          validationErrors
        );
      }

      const result = await this.timeTrackingService.startLunch(
        userId,
        lunchTime
      );

      return ResponseHelper.operationSuccess("Almuerzo iniciado exitosamente", {
        session: result.session,
        entry: result.entry,
        buttonStates: result.buttonStates,
      });
    } catch (error) {
      return this.handleServiceError(error as Error);
    }
  }

  async resumeShift(
    request: NextRequest,
    userId: number
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { timestamp }: ClockActionRequestDTO = body;

      const resumeTime = timestamp ? new Date(timestamp) : new Date();

      // Realizar validaciones en el controlador
      const validations = await this.validationUtils.validateTimeEntry(
        userId,
        "resume_shift",
        resumeTime
      );

      const errors = validations.filter((v) => !v.isValid);

      if (errors.length > 0) {
        const validationErrors = errors.map((error) => ({
          message: error.error!,
        }));

        return ResponseHelper.validationError(
          "No se pudo reanudar el turno",
          validationErrors
        );
      }

      const result = await this.timeTrackingService.resumeShift(
        userId,
        resumeTime
      );

      return ResponseHelper.operationSuccess("Turno reanudado exitosamente", {
        session: result.session,
        entry: result.entry,
        buttonStates: result.buttonStates,
        lunchDuration: result.session?.totalLunchMinutes || 0,
      });
    } catch (error) {
      return this.handleServiceError(error as Error);
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
