import { injectable, inject } from "inversify";
import type { ITimeTrackingService } from "./interfaces/ITimeTrackingService";
import type { ITimeEntryRepository } from "@/repositories/interfaces/ITimeEntryRepository";
import type { IWorkSessionRepository } from "@/repositories/interfaces/IWorkSessionRepository";
import type { IDateUtils } from "@/utils/interfaces/IDateUtils";
import { TYPES } from "@/types";
import {
  ClockActionResponseDTO,
  CurrentStatusResponseDTO,
  SessionSummaryDTO,
  ActivityDTO,
  SessionsResponseDTO,
  TodaySessionResponseDTO,
  ButtonStatesDTO,
  ButtonStateDTO,
} from "@/models/dtos";
import {
  CreateTimeEntryData,
  CreateWorkSessionData,
  SessionStatus,
} from "@/models/entities";
import { BusinessRuleError, NotFoundError } from "@/utils/exceptions";

@injectable()
export class TimeTrackingService implements ITimeTrackingService {
  constructor(
    @inject(TYPES.TimeEntryRepository)
    private timeEntryRepo: ITimeEntryRepository,
    @inject(TYPES.WorkSessionRepository)
    private sessionRepo: IWorkSessionRepository,
    @inject(TYPES.DateUtils) private dateUtils: IDateUtils
  ) {}

  async clockIn(
    userId: number,
    timestamp?: Date
  ): Promise<ClockActionResponseDTO> {
    const clockInTime = timestamp || this.dateUtils.getCurrentChileTime();

    // Crear entrada de tiempo
    const entryData: CreateTimeEntryData = {
      userId,
      entryType: "clock_in",
      timestamp: clockInTime,
      date: clockInTime,
      isValid: true,
      timezone: "America/Santiago",
    };

    const entry = await this.timeEntryRepo.createEntry(entryData);

    // Crear o actualizar sesión
    const session = await this.getOrCreateWorkSession(userId, clockInTime);

    const updatedSession = await this.sessionRepo.update(session.id, {
      clockInTime: clockInTime,
      status: "active" as SessionStatus,
    });

    if (!updatedSession) {
      throw new BusinessRuleError("No se pudo actualizar la sesión");
    }

    // Actualizar totales
    await this.updateSessionTotals(updatedSession.id);

    // Obtener sesión final actualizada
    const finalSession = await this.sessionRepo.findById(updatedSession.id);

    if (!finalSession) {
      throw new BusinessRuleError("Error al obtener la sesión actualizada");
    }

    // Obtener estados de botones
    const buttonStates = await this.getButtonStates(userId, clockInTime);

    return {
      session: finalSession,
      entry,
      buttonStates,
    };
  }

  async clockOut(
    userId: number,
    timestamp?: Date
  ): Promise<ClockActionResponseDTO> {
    const clockOutTime = timestamp || this.dateUtils.getCurrentChileTime();

    // Crear entrada de tiempo
    const entryData: CreateTimeEntryData = {
      userId,
      entryType: "clock_out",
      timestamp: clockOutTime,
      date: clockOutTime,
      isValid: true,
      timezone: "America/Santiago",
    };

    const entry = await this.timeEntryRepo.createEntry(entryData);

    // Obtener sesión actual
    const session = await this.sessionRepo.findByUserIdAndDate(
      userId,
      clockOutTime
    );

    if (!session) {
      throw new NotFoundError("No se encontró sesión activa");
    }

    // Actualizar sesión
    const updatedSession = await this.sessionRepo.update(session.id, {
      clockOutTime: clockOutTime,
      status: "completed" as SessionStatus,
    });

    if (!updatedSession) {
      throw new BusinessRuleError("No se pudo actualizar la sesión");
    }

    // Actualizar totales
    await this.updateSessionTotals(updatedSession.id);

    // Obtener sesión final actualizada
    const finalSession = await this.sessionRepo.findById(updatedSession.id);

    if (!finalSession) {
      throw new BusinessRuleError("Error al obtener la sesión actualizada");
    }

    // Obtener estados de botones
    const buttonStates = await this.getButtonStates(userId, clockOutTime);

    return {
      session: finalSession,
      entry,
      buttonStates,
    };
  }

  async startLunch(
    userId: number,
    timestamp?: Date
  ): Promise<ClockActionResponseDTO> {
    const lunchTime = timestamp || this.dateUtils.getCurrentChileTime();

    const entryData: CreateTimeEntryData = {
      userId,
      entryType: "start_lunch",
      timestamp: lunchTime,
      date: lunchTime,
      isValid: true,
      timezone: "America/Santiago",
    };

    const entry = await this.timeEntryRepo.createEntry(entryData);
    const session = await this.sessionRepo.findByUserIdAndDate(
      userId,
      lunchTime
    );

    if (!session) {
      throw new NotFoundError("No se encontró sesión activa");
    }

    const updatedSession = await this.sessionRepo.update(session.id, {
      lunchStartTime: lunchTime,
      status: "on_lunch" as SessionStatus,
    });

    if (!updatedSession) {
      throw new BusinessRuleError("No se pudo actualizar la sesión");
    }

    const buttonStates = await this.getButtonStates(userId, lunchTime);

    return {
      session: updatedSession,
      entry,
      buttonStates,
    };
  }

  async resumeShift(
    userId: number,
    timestamp?: Date
  ): Promise<ClockActionResponseDTO> {
    const resumeTime = timestamp || this.dateUtils.getCurrentChileTime();

    const entryData: CreateTimeEntryData = {
      userId,
      entryType: "resume_shift",
      timestamp: resumeTime,
      date: resumeTime,
      isValid: true,
      timezone: "America/Santiago",
    };

    const entry = await this.timeEntryRepo.createEntry(entryData);

    const session = await this.sessionRepo.findByUserIdAndDate(
      userId,
      resumeTime
    );

    if (!session) {
      throw new NotFoundError("No se encontró sesión activa");
    }

    if (session.status !== "on_lunch" || !session.lunchStartTime) {
      throw new BusinessRuleError("No hay un almuerzo activo para resumir");
    }

    const updatedSession = await this.sessionRepo.update(session.id, {
      lunchEndTime: resumeTime,
      status: "active" as SessionStatus,
    });

    if (!updatedSession) {
      throw new BusinessRuleError("No se pudo actualizar la sesión");
    }

    // Actualizar totales
    await this.updateSessionTotals(updatedSession.id);

    // Obtener sesión final actualizada
    const finalSession = await this.sessionRepo.findById(updatedSession.id);

    if (!finalSession) {
      throw new BusinessRuleError("Error al obtener la sesión actualizada");
    }

    const buttonStates = await this.getButtonStates(userId, resumeTime);

    return {
      session: finalSession,
      entry,
      buttonStates,
    };
  }

  async getCurrentStatus(
    userId: number,
    currentTime?: Date
  ): Promise<CurrentStatusResponseDTO> {
    const time = currentTime || this.dateUtils.getCurrentChileTime();
    const session = await this.sessionRepo.findByUserIdAndDate(userId, time);
    const buttonStates = await this.getButtonStates(userId, time);

    if (!session) {
      return {
        status: "clocked_out",
        buttonStates,
        canClockIn: buttonStates.clockIn.enabled,
        canClockOut: buttonStates.clockOut.enabled,
        canStartLunch: buttonStates.startLunch.enabled,
        canResumeShift: buttonStates.resumeShift.enabled,
        restrictions: [
          !buttonStates.clockIn.enabled && buttonStates.clockIn.reason,
          !buttonStates.startLunch.enabled && buttonStates.startLunch.reason,
        ].filter(Boolean) as string[],
      };
    }

    let status: "clocked_out" | "clocked_in" | "on_lunch";
    switch (session.status) {
      case "active":
        status = "clocked_in";
        break;
      case "on_lunch":
        status = "on_lunch";
        break;
      case "completed":
      default:
        status = "clocked_out";
        break;
    }

    return {
      status,
      session,
      buttonStates,
      canClockIn: buttonStates.clockIn.enabled,
      canClockOut: buttonStates.clockOut.enabled,
      canStartLunch: buttonStates.startLunch.enabled,
      canResumeShift: buttonStates.resumeShift.enabled,
      restrictions: [],
    };
  }

  async getTodaySession(
    userId: number,
    currentTime?: Date
  ): Promise<TodaySessionResponseDTO> {
    const time = currentTime || this.dateUtils.getCurrentChileTime();
    const session = await this.sessionRepo.findByUserIdAndDate(userId, time);

    if (!session) {
      return {
        session: null,
        workedHours: 0,
        lunchDuration: 0,
        remainingHours: 8,
        status: "clocked_out",
      };
    }

    // Actualizar totales antes de devolverlos
    await this.updateSessionTotals(session.id);
    const updatedSession = await this.sessionRepo.findById(session.id);

    if (!updatedSession) {
      throw new BusinessRuleError("No se pudo actualizar la sesión");
    }

    const remainingHours = Math.max(
      0,
      8 - Number(updatedSession.totalWorkHours)
    );

    let status: "clocked_out" | "clocked_in" | "on_lunch";
    switch (updatedSession.status) {
      case "active":
        status = "clocked_in";
        break;
      case "on_lunch":
        status = "on_lunch";
        break;
      case "completed":
      default:
        status = "clocked_out";
        break;
    }

    const buttonStates = await this.getButtonStates(userId, time);

    return {
      session: updatedSession,
      workedHours: Number(updatedSession.totalWorkHours) || 0,
      lunchDuration: updatedSession.totalLunchMinutes || 0,
      remainingHours,
      status,
      canClockIn: buttonStates.clockIn.enabled,
      canClockOut: buttonStates.clockOut.enabled,
      canStartLunch: buttonStates.startLunch.enabled,
      canResumeShift: buttonStates.resumeShift.enabled,
    };
  }

  async getSessionSummary(
    userId: number,
    date?: Date
  ): Promise<SessionSummaryDTO | null> {
    // Implementation placeholder
    return null;
  }

  async getRecentActivities(userId: number, limit = 5): Promise<ActivityDTO[]> {
    const activities = await this.timeEntryRepo.getRecentActivities(
      userId,
      limit
    );

    return activities.map((activity) => ({
      id: activity.id,
      type: activity.entryType,
      timestamp: activity.timestamp,
      date: activity.date,
      timezone: activity.timezone,
      isValid: activity.isValid,
    }));
  }

  async getUserSessions(
    userId: number,
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string
  ): Promise<SessionsResponseDTO> {
    const result = await this.sessionRepo.findByUserId(userId, {
      page,
      limit,
      startDate,
      endDate,
    });

    return {
      sessions: result.data,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.page,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    };
  }

  async getButtonStates(
    userId: number,
    currentTime?: Date
  ): Promise<ButtonStatesDTO> {
    const time = currentTime || this.dateUtils.getCurrentChileTime();
    const session = await this.sessionRepo.findByUserIdAndDate(userId, time);

    // Lógica simplificada para estados de botones
    if (!session) {
      return {
        clockIn: { enabled: true },
        clockOut: { enabled: false, reason: "No hay sesión activa" },
        startLunch: { enabled: false, reason: "Debe hacer clock-in primero" },
        resumeShift: { enabled: false, reason: "No hay almuerzo activo" },
      };
    }

    switch (session.status) {
      case "active":
        return {
          clockIn: { enabled: false, reason: "Ya tiene una sesión activa" },
          clockOut: { enabled: true },
          startLunch: { enabled: true },
          resumeShift: { enabled: false, reason: "No está en almuerzo" },
        };
      case "on_lunch":
        return {
          clockIn: { enabled: false, reason: "Está en almuerzo" },
          clockOut: {
            enabled: false,
            reason: "Debe terminar el almuerzo primero",
          },
          startLunch: { enabled: false, reason: "Ya está en almuerzo" },
          resumeShift: { enabled: true },
        };
      case "completed":
      default:
        return {
          clockIn: { enabled: true },
          clockOut: { enabled: false, reason: "Sesión ya completada" },
          startLunch: { enabled: false, reason: "Sesión no activa" },
          resumeShift: { enabled: false, reason: "No hay almuerzo activo" },
        };
    }
  }

  // Métodos auxiliares privados
  private async getOrCreateWorkSession(userId: number, date: Date) {
    let session = await this.sessionRepo.findByUserIdAndDate(userId, date);

    if (!session) {
      const sessionData: CreateWorkSessionData = {
        userId,
        date,
        status: "active",
        totalWorkMinutes: 0,
        totalLunchMinutes: 0,
        totalWorkHours: "0.00",
      };
      session = await this.sessionRepo.createSession(sessionData);
    }

    return session;
  }

  private async updateSessionTotals(sessionId: number): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) return;

    let totalWorkMinutes = 0;
    let totalLunchMinutes = 0;

    // Calcular tiempo trabajado
    if (session.clockInTime && session.clockOutTime) {
      const workStart = new Date(session.clockInTime);
      const workEnd = new Date(session.clockOutTime);
      const totalMinutes = this.dateUtils.minutesBetween(workStart, workEnd);

      // Restar tiempo de almuerzo si existe
      if (session.lunchStartTime && session.lunchEndTime) {
        const lunchStart = new Date(session.lunchStartTime);
        const lunchEnd = new Date(session.lunchEndTime);
        totalLunchMinutes = this.dateUtils.minutesBetween(lunchStart, lunchEnd);
      }

      totalWorkMinutes = totalMinutes - totalLunchMinutes;
    } else if (session.clockInTime) {
      // Sesión en progreso
      const workStart = new Date(session.clockInTime);
      const now = this.dateUtils.getCurrentChileTime();
      const totalMinutes = this.dateUtils.minutesBetween(workStart, now);

      // Restar tiempo de almuerzo si existe
      if (session.lunchStartTime && session.lunchEndTime) {
        const lunchStart = new Date(session.lunchStartTime);
        const lunchEnd = new Date(session.lunchEndTime);
        totalLunchMinutes = this.dateUtils.minutesBetween(lunchStart, lunchEnd);
      } else if (session.lunchStartTime && session.status === "on_lunch") {
        // Almuerzo en progreso
        const lunchStart = new Date(session.lunchStartTime);
        totalLunchMinutes = this.dateUtils.minutesBetween(lunchStart, now);
      }

      totalWorkMinutes = Math.max(0, totalMinutes - totalLunchMinutes);
    }

    // Actualizar totales
    await this.sessionRepo.updateSessionTotals(sessionId, {
      totalWorkMinutes: Math.round(totalWorkMinutes),
      totalLunchMinutes: Math.round(totalLunchMinutes),
      totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
    });
  }
}
