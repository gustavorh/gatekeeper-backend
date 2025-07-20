import { injectable, inject } from "inversify";
import type { IAdminWorkSessionService } from "./interfaces/IAdminWorkSessionService";
import type { IWorkSessionRepository } from "@/repositories/interfaces/IWorkSessionRepository";
import type { ITimeEntryRepository } from "@/repositories/interfaces/ITimeEntryRepository";
import type { IDateUtils } from "@/utils/interfaces/IDateUtils";
import { TYPES } from "@/types";
import {
  WorkSession,
  CreateWorkSessionData,
  SessionStatus,
} from "@/models/entities/WorkSession";
import { PaginatedResponse } from "@/types";
import { workSessions, timeEntries } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq, and, desc, sql, gte, lte, isNull, isNotNull } from "drizzle-orm";

@injectable()
export class AdminWorkSessionService implements IAdminWorkSessionService {
  constructor(
    @inject(TYPES.WorkSessionRepository)
    private sessionRepo: IWorkSessionRepository,
    @inject(TYPES.TimeEntryRepository)
    private timeEntryRepo: ITimeEntryRepository,
    @inject(TYPES.DateUtils) private dateUtils: IDateUtils
  ) {}

  async getAllSessions(options: {
    page?: number;
    limit?: number;
    userId?: number;
    status?: SessionStatus;
    startDate?: string;
    endDate?: string;
    isValidSession?: boolean;
  }): Promise<PaginatedResponse<WorkSession>> {
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100);
      const offset = (page - 1) * limit;

      // Construir condiciones base
      let whereConditions: any[] = [];

      if (options.userId) {
        whereConditions.push(eq(workSessions.userId, options.userId));
      }

      if (options.status) {
        whereConditions.push(eq(workSessions.status, options.status));
      }

      if (options.startDate) {
        whereConditions.push(
          gte(workSessions.date, new Date(options.startDate))
        );
      }

      if (options.endDate) {
        whereConditions.push(lte(workSessions.date, new Date(options.endDate)));
      }

      if (options.isValidSession !== undefined) {
        whereConditions.push(
          eq(workSessions.isValidSession, options.isValidSession)
        );
      }

      // Contar total de sesiones
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(workSessions)
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined
        );

      const total = totalResult[0].count;
      const totalPages = Math.ceil(total / limit);

      // Obtener sesiones paginadas
      const sessions = await db
        .select()
        .from(workSessions)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(workSessions.date), desc(workSessions.id))
        .limit(limit)
        .offset(offset);

      return {
        data: sessions as WorkSession[],
        total,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      console.error("Error obteniendo todas las sesiones:", error);
      throw new Error("Error al obtener sesiones");
    }
  }

  async getSessionById(sessionId: number): Promise<WorkSession | null> {
    try {
      const session = await this.sessionRepo.findById(sessionId);
      return session;
    } catch (error) {
      console.error(`Error obteniendo sesión ${sessionId}:`, error);
      return null;
    }
  }

  async getUserSessions(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      status?: SessionStatus;
    }
  ): Promise<PaginatedResponse<WorkSession>> {
    try {
      return await this.sessionRepo.findByUserId(userId, {
        page: options.page || 1,
        limit: options.limit || 20,
        startDate: options.startDate,
        endDate: options.endDate,
      });
    } catch (error) {
      console.error(`Error obteniendo sesiones del usuario ${userId}:`, error);
      throw new Error("Error al obtener sesiones del usuario");
    }
  }

  async updateSession(
    sessionId: number,
    updates: Partial<CreateWorkSessionData>
  ): Promise<WorkSession | null> {
    try {
      // Validar que la sesión existe
      const existingSession = await this.sessionRepo.findById(sessionId);
      if (!existingSession) {
        return null;
      }

      // Validar fechas si se proporcionan
      if (updates.clockInTime && updates.clockOutTime) {
        if (new Date(updates.clockInTime) >= new Date(updates.clockOutTime)) {
          throw new Error(
            "La hora de entrada debe ser anterior a la hora de salida"
          );
        }
      }

      if (updates.lunchStartTime && updates.lunchEndTime) {
        if (
          new Date(updates.lunchStartTime) >= new Date(updates.lunchEndTime)
        ) {
          throw new Error(
            "La hora de inicio de almuerzo debe ser anterior a la hora de fin"
          );
        }
      }

      // Actualizar la sesión
      const updatedSession = await this.sessionRepo.update(sessionId, updates);

      if (!updatedSession) {
        return null;
      }

      // Recalcular totales si se actualizaron tiempos
      if (
        updates.clockInTime ||
        updates.clockOutTime ||
        updates.lunchStartTime ||
        updates.lunchEndTime
      ) {
        await this.recalculateSessionTotals(sessionId);
      }

      return await this.sessionRepo.findById(sessionId);
    } catch (error) {
      console.error(`Error actualizando sesión ${sessionId}:`, error);
      throw error;
    }
  }

  async createSession(
    sessionData: CreateWorkSessionData
  ): Promise<WorkSession> {
    try {
      // Validar datos requeridos
      if (!sessionData.userId || !sessionData.date) {
        throw new Error("userId y date son requeridos");
      }

      // Validar fechas si se proporcionan
      if (sessionData.clockInTime && sessionData.clockOutTime) {
        if (
          new Date(sessionData.clockInTime) >=
          new Date(sessionData.clockOutTime)
        ) {
          throw new Error(
            "La hora de entrada debe ser anterior a la hora de salida"
          );
        }
      }

      // Crear la sesión
      const session = await this.sessionRepo.createSession(sessionData);

      // Recalcular totales si se proporcionaron tiempos
      if (
        sessionData.clockInTime ||
        sessionData.clockOutTime ||
        sessionData.lunchStartTime ||
        sessionData.lunchEndTime
      ) {
        await this.recalculateSessionTotals(session.id);
      }

      return (await this.sessionRepo.findById(session.id)) as WorkSession;
    } catch (error) {
      console.error("Error creando sesión:", error);
      throw error;
    }
  }

  async deleteSession(sessionId: number): Promise<boolean> {
    try {
      // Verificar que la sesión existe
      const session = await this.sessionRepo.findById(sessionId);
      if (!session) {
        return false;
      }

      // Eliminar entradas de tiempo relacionadas (por fecha y usuario)
      await db
        .delete(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, session.userId),
            eq(timeEntries.date, session.date)
          )
        );

      // Eliminar la sesión
      await this.sessionRepo.delete(sessionId);

      return true;
    } catch (error) {
      console.error(`Error eliminando sesión ${sessionId}:`, error);
      return false;
    }
  }

  async revalidateSession(sessionId: number): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      const session = await this.sessionRepo.findById(sessionId);
      if (!session) {
        return {
          success: false,
          message: "Sesión no encontrada",
        };
      }

      // Obtener entradas de tiempo de la sesión (por fecha y usuario)
      const entries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, session.userId),
            eq(timeEntries.date, session.date)
          )
        )
        .orderBy(timeEntries.timestamp);

      // Validar integridad de la sesión
      const validation = await this.validateSessionIntegrity(session, entries);

      // Actualizar estado de validación
      await this.sessionRepo.update(sessionId, {
        isValidSession: validation.isValid,
        validationErrors:
          validation.errors.length > 0 ? validation.errors : null,
      });

      return {
        success: true,
        message: validation.isValid ? "Sesión válida" : "Sesión inválida",
        errors: validation.errors.length > 0 ? validation.errors : undefined,
      };
    } catch (error) {
      console.error(`Error revalidando sesión ${sessionId}:`, error);
      return {
        success: false,
        message: "Error al revalidar sesión",
      };
    }
  }

  async getSessionStatistics(options: {
    startDate?: string;
    endDate?: string;
    userId?: number;
  }): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    invalidSessions: number;
    averageWorkHours: number;
    totalOvertimeHours: number;
  }> {
    try {
      let whereConditions: any[] = [];

      if (options.userId) {
        whereConditions.push(eq(workSessions.userId, options.userId));
      }

      if (options.startDate) {
        whereConditions.push(
          gte(workSessions.date, new Date(options.startDate))
        );
      }

      if (options.endDate) {
        whereConditions.push(lte(workSessions.date, new Date(options.endDate)));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Obtener estadísticas
      const stats = await db
        .select({
          totalSessions: sql<number>`count(*)`,
          activeSessions: sql<number>`count(case when status = 'active' then 1 end)`,
          completedSessions: sql<number>`count(case when status = 'completed' then 1 end)`,
          invalidSessions: sql<number>`count(case when "isValidSession" = false then 1 end)`,
          totalWorkMinutes: sql<number>`coalesce(sum("totalWorkMinutes"), 0)`,
          totalOvertimeMinutes: sql<number>`coalesce(sum("overtimeMinutes"), 0)`,
        })
        .from(workSessions)
        .where(whereClause);

      const result = stats[0];
      const totalSessions = result.totalSessions || 0;
      const averageWorkHours =
        totalSessions > 0
          ? (result.totalWorkMinutes || 0) / 60 / totalSessions
          : 0;

      return {
        totalSessions,
        activeSessions: result.activeSessions || 0,
        completedSessions: result.completedSessions || 0,
        invalidSessions: result.invalidSessions || 0,
        averageWorkHours: Math.round(averageWorkHours * 100) / 100,
        totalOvertimeHours:
          Math.round(((result.totalOvertimeMinutes || 0) / 60) * 100) / 100,
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas de sesiones:", error);
      throw new Error("Error al obtener estadísticas");
    }
  }

  private async recalculateSessionTotals(sessionId: number): Promise<void> {
    try {
      const session = await this.sessionRepo.findById(sessionId);
      if (!session) return;

      let totalWorkMinutes = 0;
      let totalLunchMinutes = 0;

      // Calcular tiempo de trabajo
      if (session.clockInTime && session.clockOutTime) {
        const workStart = new Date(session.clockInTime);
        const workEnd = new Date(session.clockOutTime);
        totalWorkMinutes =
          (workEnd.getTime() - workStart.getTime()) / (1000 * 60);

        // Restar tiempo de almuerzo si existe
        if (session.lunchStartTime && session.lunchEndTime) {
          const lunchStart = new Date(session.lunchStartTime);
          const lunchEnd = new Date(session.lunchEndTime);
          totalLunchMinutes =
            (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
          totalWorkMinutes -= totalLunchMinutes;
        }
      }

      // Calcular horas de trabajo
      const totalWorkHours = `${Math.floor(totalWorkMinutes / 60)}:${String(
        Math.floor(totalWorkMinutes % 60)
      ).padStart(2, "0")}`;

      // Actualizar totales
      await this.sessionRepo.updateSessionTotals(sessionId, {
        totalWorkMinutes: Math.round(totalWorkMinutes),
        totalLunchMinutes: Math.round(totalLunchMinutes),
        totalWorkHours,
      });
    } catch (error) {
      console.error(
        `Error recalculando totales de sesión ${sessionId}:`,
        error
      );
    }
  }

  private async validateSessionIntegrity(
    session: WorkSession,
    entries: any[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validar que hay entradas de tiempo
    if (entries.length === 0) {
      errors.push("No hay entradas de tiempo registradas");
    }

    // Validar secuencia de entradas
    let hasClockIn = false;
    let hasClockOut = false;
    let hasLunchStart = false;
    let hasLunchEnd = false;

    for (const entry of entries) {
      switch (entry.entryType) {
        case "clock_in":
          hasClockIn = true;
          break;
        case "clock_out":
          hasClockOut = true;
          break;
        case "start_lunch":
          hasLunchStart = true;
          break;
        case "resume_shift":
          hasLunchEnd = true;
          break;
      }
    }

    if (!hasClockIn) {
      errors.push("Falta entrada de tiempo (clock_in)");
    }

    if (hasClockOut && !hasClockIn) {
      errors.push("Hay salida sin entrada previa");
    }

    if (hasLunchEnd && !hasLunchStart) {
      errors.push("Hay fin de almuerzo sin inicio previo");
    }

    // Validar tiempos
    if (session.clockInTime && session.clockOutTime) {
      if (new Date(session.clockInTime) >= new Date(session.clockOutTime)) {
        errors.push("Hora de entrada posterior o igual a hora de salida");
      }
    }

    if (session.lunchStartTime && session.lunchEndTime) {
      if (new Date(session.lunchStartTime) >= new Date(session.lunchEndTime)) {
        errors.push(
          "Hora de inicio de almuerzo posterior o igual a hora de fin"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
