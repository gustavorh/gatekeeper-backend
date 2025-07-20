import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IAdminWorkSessionService } from "@/services/interfaces/IAdminWorkSessionService";
import { TYPES } from "@/types";
import { ResponseHelper } from "@/utils/ResponseHelper";
import { CreateWorkSessionData } from "@/models/entities/WorkSession";

@injectable()
export class AdminWorkSessionController {
  constructor(
    @inject(TYPES.AdminWorkSessionService)
    private adminWorkSessionService: IAdminWorkSessionService
  ) {}

  // GET: Obtener todas las sesiones con filtros
  async getAllSessions(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const userId = url.searchParams.get("userId")
        ? parseInt(url.searchParams.get("userId")!)
        : undefined;
      const status = url.searchParams.get("status") || undefined;
      const startDate = url.searchParams.get("startDate") || undefined;
      const endDate = url.searchParams.get("endDate") || undefined;
      const isValidSession = url.searchParams.get("isValidSession")
        ? url.searchParams.get("isValidSession") === "true"
        : undefined;

      const result = await this.adminWorkSessionService.getAllSessions({
        page,
        limit,
        userId,
        status: status as any,
        startDate,
        endDate,
        isValidSession,
      });

      return ResponseHelper.successWithPagination(
        result.data,
        {
          currentPage: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.hasNext,
          hasPreviousPage: result.hasPrev,
        },
        "Sesiones obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint admin/work-sessions:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // GET: Obtener una sesión específica
  async getSessionById(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const sessionId = this.extractSessionIdFromPath(url.pathname);

      if (!sessionId || isNaN(sessionId)) {
        return ResponseHelper.validationError("ID de sesión inválido", [
          {
            field: "sessionId",
            message: "El ID de sesión debe ser un número válido",
          },
        ]);
      }

      const session = await this.adminWorkSessionService.getSessionById(
        sessionId
      );

      if (!session) {
        return ResponseHelper.notFoundError("Sesión no encontrada");
      }

      return ResponseHelper.success(
        { session },
        "Sesión obtenida exitosamente"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/work-sessions/[sessionId]:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // GET: Obtener sesiones de un usuario específico
  async getUserSessions(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const userId = this.extractUserIdFromPath(url.pathname);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const startDate = url.searchParams.get("startDate") || undefined;
      const endDate = url.searchParams.get("endDate") || undefined;
      const status = url.searchParams.get("status") || undefined;

      if (!userId || isNaN(userId)) {
        return ResponseHelper.validationError("ID de usuario inválido", [
          {
            field: "userId",
            message: "El ID de usuario debe ser un número válido",
          },
        ]);
      }

      const result = await this.adminWorkSessionService.getUserSessions(
        userId,
        {
          page,
          limit,
          startDate,
          endDate,
          status: status as any,
        }
      );

      return ResponseHelper.successWithPagination(
        result.data,
        {
          currentPage: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.hasNext,
          hasPreviousPage: result.hasPrev,
        },
        "Sesiones del usuario obtenidas exitosamente"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/users/[userId]/work-sessions:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // PUT: Actualizar una sesión
  async updateSession(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const sessionId = this.extractSessionIdFromPath(url.pathname);

      if (!sessionId || isNaN(sessionId)) {
        return ResponseHelper.validationError("ID de sesión inválido", [
          {
            field: "sessionId",
            message: "El ID de sesión debe ser un número válido",
          },
        ]);
      }

      const updates: Partial<CreateWorkSessionData> = await request.json();

      // Validar campos requeridos si se proporcionan
      const validationErrors = [];
      if (updates.clockInTime && updates.clockOutTime) {
        if (new Date(updates.clockInTime) >= new Date(updates.clockOutTime)) {
          validationErrors.push({
            field: "clockOutTime",
            message:
              "La hora de salida debe ser posterior a la hora de entrada",
          });
        }
      }

      if (updates.lunchStartTime && updates.lunchEndTime) {
        if (
          new Date(updates.lunchStartTime) >= new Date(updates.lunchEndTime)
        ) {
          validationErrors.push({
            field: "lunchEndTime",
            message:
              "La hora de fin de almuerzo debe ser posterior a la hora de inicio",
          });
        }
      }

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Datos de sesión inválidos",
          validationErrors
        );
      }

      const updatedSession = await this.adminWorkSessionService.updateSession(
        sessionId,
        updates
      );

      if (!updatedSession) {
        return ResponseHelper.notFoundError("Sesión no encontrada");
      }

      return ResponseHelper.success(
        { session: updatedSession },
        "Sesión actualizada exitosamente"
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/work-sessions/[sessionId] PUT:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // POST: Crear una nueva sesión
  async createSession(request: NextRequest): Promise<NextResponse> {
    try {
      const sessionData: CreateWorkSessionData = await request.json();

      // Validar campos requeridos
      const validationErrors = [];
      if (!sessionData.userId) {
        validationErrors.push({
          field: "userId",
          message: "userId es requerido",
        });
      }
      if (!sessionData.date) {
        validationErrors.push({
          field: "date",
          message: "date es requerido",
        });
      }

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Campos requeridos faltantes",
          validationErrors
        );
      }

      const session = await this.adminWorkSessionService.createSession(
        sessionData
      );

      return ResponseHelper.success({ session }, "Sesión creada exitosamente");
    } catch (error) {
      console.error("Error en endpoint admin/work-sessions POST:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // DELETE: Eliminar una sesión
  async deleteSession(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const sessionId = this.extractSessionIdFromPath(url.pathname);

      if (!sessionId || isNaN(sessionId)) {
        return ResponseHelper.validationError("ID de sesión inválido", [
          {
            field: "sessionId",
            message: "El ID de sesión debe ser un número válido",
          },
        ]);
      }

      const deleted = await this.adminWorkSessionService.deleteSession(
        sessionId
      );

      if (!deleted) {
        return ResponseHelper.notFoundError("Sesión no encontrada");
      }

      return ResponseHelper.operationSuccess("Sesión eliminada exitosamente", {
        sessionId,
      });
    } catch (error) {
      console.error(
        "Error en endpoint admin/work-sessions/[sessionId] DELETE:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // POST: Revalidar una sesión específica
  async revalidateSession(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const sessionId = this.extractSessionIdFromPath(url.pathname);

      if (!sessionId || isNaN(sessionId)) {
        return ResponseHelper.validationError("ID de sesión inválido", [
          {
            field: "sessionId",
            message: "El ID de sesión debe ser un número válido",
          },
        ]);
      }

      const result = await this.adminWorkSessionService.revalidateSession(
        sessionId
      );

      if (!result.success) {
        return ResponseHelper.validationError(result.message, []);
      }

      return ResponseHelper.success(
        {
          sessionId,
          isValid: !result.errors || result.errors.length === 0,
          errors: result.errors,
        },
        result.message
      );
    } catch (error) {
      console.error(
        "Error en endpoint admin/work-sessions/[sessionId]/revalidate:",
        error
      );
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // GET: Obtener estadísticas de sesiones
  async getSessionStatistics(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId")
        ? parseInt(url.searchParams.get("userId")!)
        : undefined;
      const startDate = url.searchParams.get("startDate") || undefined;
      const endDate = url.searchParams.get("endDate") || undefined;

      const statistics =
        await this.adminWorkSessionService.getSessionStatistics({
          userId,
          startDate,
          endDate,
        });

      return ResponseHelper.success(
        { statistics },
        "Estadísticas obtenidas exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint admin/work-sessions/statistics:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  // Utility methods para extraer IDs de la URL
  private extractSessionIdFromPath(pathname: string): number | null {
    try {
      const segments = pathname.split("/");
      const sessionIndex = segments.findIndex(
        (segment) => segment === "work-sessions"
      );
      if (sessionIndex !== -1 && segments[sessionIndex + 1]) {
        return parseInt(segments[sessionIndex + 1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractUserIdFromPath(pathname: string): number | null {
    try {
      const segments = pathname.split("/");
      const userIndex = segments.findIndex((segment) => segment === "users");
      if (userIndex !== -1 && segments[userIndex + 1]) {
        return parseInt(segments[userIndex + 1]);
      }
      return null;
    } catch {
      return null;
    }
  }
}
