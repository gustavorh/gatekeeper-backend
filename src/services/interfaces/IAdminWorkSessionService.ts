import {
  WorkSession,
  CreateWorkSessionData,
  SessionStatus,
} from "@/models/entities/WorkSession";
import { PaginatedResponse } from "@/types";

export interface IAdminWorkSessionService {
  // Obtener todas las sesiones con filtros
  getAllSessions(options: {
    page?: number;
    limit?: number;
    userId?: number;
    status?: SessionStatus;
    startDate?: string;
    endDate?: string;
    isValidSession?: boolean;
  }): Promise<PaginatedResponse<WorkSession>>;

  // Obtener una sesión específica
  getSessionById(sessionId: number): Promise<WorkSession | null>;

  // Obtener sesiones de un usuario específico
  getUserSessions(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      status?: SessionStatus;
    }
  ): Promise<PaginatedResponse<WorkSession>>;

  // Actualizar una sesión
  updateSession(
    sessionId: number,
    updates: Partial<CreateWorkSessionData>
  ): Promise<WorkSession | null>;

  // Crear una sesión manualmente
  createSession(sessionData: CreateWorkSessionData): Promise<WorkSession>;

  // Eliminar una sesión
  deleteSession(sessionId: number): Promise<boolean>;

  // Revalidar una sesión específica
  revalidateSession(sessionId: number): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }>;

  // Obtener estadísticas de sesiones
  getSessionStatistics(options: {
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
  }>;
}
