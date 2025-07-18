import { db } from "./db";
import {
  timeEntries,
  workSessions,
  NewTimeEntry,
  NewWorkSession,
  TimeEntry,
  WorkSession,
} from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  validateBusinessRules,
  ValidationResult,
  validateLunchDuration,
  getButtonStates,
  ButtonStates,
} from "./validators";

export interface TimeTrackingResult {
  success: boolean;
  message: string;
  session?: WorkSession;
  entry?: TimeEntry;
  validationErrors?: string[];
  buttonStates?: ButtonStates;
}

export interface SessionSummary {
  session: WorkSession;
  totalWorkedHours: number;
  totalLunchMinutes: number;
  currentStatus: "clocked_out" | "clocked_in" | "on_lunch";
  canClockIn: boolean;
  canClockOut: boolean;
  canStartLunch: boolean;
  canResumeShift: boolean;
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
 * Crea una nueva entrada de tiempo
 */
async function createTimeEntry(
  userId: number,
  entryType: "clock_in" | "clock_out" | "start_lunch" | "resume_shift",
  timestamp: Date = getCurrentChileTime()
): Promise<TimeEntry> {
  const entry: NewTimeEntry = {
    userId,
    entryType,
    timestamp,
    date: timestamp,
    timezone: "America/Santiago",
  };

  const result = await db.insert(timeEntries).values(entry);

  // Obtener la entrada creada
  const createdEntry = await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.id, Number(result[0].insertId)))
    .limit(1);

  return createdEntry[0];
}

/**
 * Obtiene o crea una sesión de trabajo para el día actual
 */
async function getOrCreateWorkSession(
  userId: number,
  date: Date = getCurrentChileTime()
): Promise<WorkSession> {
  const dateStr = date.toISOString().split("T")[0];

  // Buscar sesión existente
  const existingSession = await db
    .select()
    .from(workSessions)
    .where(
      and(
        eq(workSessions.userId, userId),
        sql`DATE(${workSessions.date}) = ${dateStr}`
      )
    )
    .limit(1);

  if (existingSession.length > 0) {
    return existingSession[0];
  }

  // Crear nueva sesión
  const newSession: NewWorkSession = {
    userId,
    date: date,
    status: "active",
  };

  const result = await db.insert(workSessions).values(newSession);

  const createdSession = await db
    .select()
    .from(workSessions)
    .where(eq(workSessions.id, Number(result[0].insertId)))
    .limit(1);

  return createdSession[0];
}

/**
 * Actualiza los totales de una sesión de trabajo
 */
async function updateSessionTotals(sessionId: number): Promise<void> {
  const session = await db
    .select()
    .from(workSessions)
    .where(eq(workSessions.id, sessionId))
    .limit(1);

  if (session.length === 0) return;

  const currentSession = session[0];
  let totalWorkMinutes = 0;
  let totalLunchMinutes = 0;

  // Calcular tiempo trabajado
  if (currentSession.clockInTime && currentSession.clockOutTime) {
    const workStart = new Date(currentSession.clockInTime);
    const workEnd = new Date(currentSession.clockOutTime);
    const totalMinutes =
      (workEnd.getTime() - workStart.getTime()) / (1000 * 60);

    // Restar tiempo de almuerzo si existe
    if (currentSession.lunchStartTime && currentSession.lunchEndTime) {
      const lunchStart = new Date(currentSession.lunchStartTime);
      const lunchEnd = new Date(currentSession.lunchEndTime);
      totalLunchMinutes =
        (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
    }

    totalWorkMinutes = totalMinutes - totalLunchMinutes;
  } else if (currentSession.clockInTime) {
    // Sesión en progreso
    const workStart = new Date(currentSession.clockInTime);
    const now = getCurrentChileTime();
    const totalMinutes = (now.getTime() - workStart.getTime()) / (1000 * 60);

    // Restar tiempo de almuerzo si existe
    if (currentSession.lunchStartTime && currentSession.lunchEndTime) {
      const lunchStart = new Date(currentSession.lunchStartTime);
      const lunchEnd = new Date(currentSession.lunchEndTime);
      totalLunchMinutes =
        (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
    } else if (
      currentSession.lunchStartTime &&
      currentSession.status === "on_lunch"
    ) {
      // Almuerzo en progreso
      const lunchStart = new Date(currentSession.lunchStartTime);
      totalLunchMinutes = (now.getTime() - lunchStart.getTime()) / (1000 * 60);
    }

    totalWorkMinutes = Math.max(0, totalMinutes - totalLunchMinutes);
  }

  // Actualizar totales
  await db
    .update(workSessions)
    .set({
      totalWorkMinutes: Math.round(totalWorkMinutes),
      totalLunchMinutes: Math.round(totalLunchMinutes),
      totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
    })
    .where(eq(workSessions.id, sessionId));
}

/**
 * Registra entrada al trabajo (Clock In)
 */
export async function clockIn(
  userId: number,
  timestamp: Date = getCurrentChileTime()
): Promise<TimeTrackingResult> {
  try {
    // Validar reglas de negocio
    const validations = await validateBusinessRules(
      userId,
      "clock_in",
      timestamp
    );
    const errors = validations.filter((v) => !v.isValid).map((v) => v.error!);

    if (errors.length > 0) {
      return {
        success: false,
        message: "Validación fallida",
        validationErrors: errors,
      };
    }

    // Crear entrada de tiempo
    const entry = await createTimeEntry(userId, "clock_in", timestamp);

    // Crear o actualizar sesión
    const session = await getOrCreateWorkSession(userId, timestamp);

    await db
      .update(workSessions)
      .set({
        clockInTime: timestamp,
        status: "active",
      })
      .where(eq(workSessions.id, session.id));

    // Actualizar totales
    await updateSessionTotals(session.id);

    // Obtener sesión actualizada
    const updatedSession = await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.id, session.id))
      .limit(1);

    // Obtener estados de botones
    const buttonStates = await getButtonStates(userId, timestamp);

    return {
      success: true,
      message: "Entrada registrada exitosamente",
      session: updatedSession[0],
      entry,
      buttonStates,
    };
  } catch (error) {
    console.error("Error en clock-in:", error);
    return {
      success: false,
      message: "Error interno del servidor",
    };
  }
}

/**
 * Registra salida del trabajo (Clock Out)
 */
export async function clockOut(
  userId: number,
  timestamp: Date = getCurrentChileTime()
): Promise<TimeTrackingResult> {
  try {
    // Validar reglas de negocio
    const validations = await validateBusinessRules(
      userId,
      "clock_out",
      timestamp
    );
    const errors = validations.filter((v) => !v.isValid).map((v) => v.error!);

    if (errors.length > 0) {
      return {
        success: false,
        message: "Validación fallida",
        validationErrors: errors,
      };
    }

    // Crear entrada de tiempo
    const entry = await createTimeEntry(userId, "clock_out", timestamp);

    // Obtener sesión actual
    const dateStr = timestamp.toISOString().split("T")[0];
    const session = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) = ${dateStr}`
        )
      )
      .limit(1);

    if (session.length === 0) {
      return {
        success: false,
        message: "No se encontró sesión activa",
      };
    }

    // Actualizar sesión
    await db
      .update(workSessions)
      .set({
        clockOutTime: timestamp,
        status: "completed",
      })
      .where(eq(workSessions.id, session[0].id));

    // Actualizar totales
    await updateSessionTotals(session[0].id);

    // Obtener sesión actualizada
    const updatedSession = await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.id, session[0].id))
      .limit(1);

    // Obtener estados de botones
    const buttonStates = await getButtonStates(userId, timestamp);

    return {
      success: true,
      message: "Salida registrada exitosamente",
      session: updatedSession[0],
      entry,
      buttonStates,
    };
  } catch (error) {
    console.error("Error en clock-out:", error);
    return {
      success: false,
      message: "Error interno del servidor",
    };
  }
}

/**
 * Inicia almuerzo (Start Lunch)
 */
export async function startLunch(
  userId: number,
  timestamp: Date = getCurrentChileTime()
): Promise<TimeTrackingResult> {
  try {
    // Validar reglas de negocio
    const validations = await validateBusinessRules(
      userId,
      "start_lunch",
      timestamp
    );
    const errors = validations.filter((v) => !v.isValid).map((v) => v.error!);

    if (errors.length > 0) {
      return {
        success: false,
        message: "Validación fallida",
        validationErrors: errors,
      };
    }

    // Crear entrada de tiempo
    const entry = await createTimeEntry(userId, "start_lunch", timestamp);

    // Obtener sesión actual
    const dateStr = timestamp.toISOString().split("T")[0];
    const session = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) = ${dateStr}`
        )
      )
      .limit(1);

    if (session.length === 0) {
      return {
        success: false,
        message: "No se encontró sesión activa",
      };
    }

    // Actualizar sesión
    await db
      .update(workSessions)
      .set({
        lunchStartTime: timestamp,
        status: "on_lunch",
      })
      .where(eq(workSessions.id, session[0].id));

    // Actualizar totales
    await updateSessionTotals(session[0].id);

    // Obtener sesión actualizada
    const updatedSession = await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.id, session[0].id))
      .limit(1);

    // Obtener estados de botones
    const buttonStates = await getButtonStates(userId, timestamp);

    return {
      success: true,
      message: "Almuerzo iniciado exitosamente",
      session: updatedSession[0],
      entry,
      buttonStates,
    };
  } catch (error) {
    console.error("Error en start-lunch:", error);
    return {
      success: false,
      message: "Error interno del servidor",
    };
  }
}

/**
 * Reanuda el turno después del almuerzo (Resume Shift)
 */
export async function resumeShift(
  userId: number,
  timestamp: Date = getCurrentChileTime()
): Promise<TimeTrackingResult> {
  try {
    // Validar reglas de negocio
    const validations = await validateBusinessRules(
      userId,
      "resume_shift",
      timestamp
    );
    const errors = validations.filter((v) => !v.isValid).map((v) => v.error!);

    if (errors.length > 0) {
      return {
        success: false,
        message: "Validación fallida",
        validationErrors: errors,
      };
    }

    // Obtener sesión actual
    const dateStr = timestamp.toISOString().split("T")[0];
    const session = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) = ${dateStr}`
        )
      )
      .limit(1);

    if (session.length === 0) {
      return {
        success: false,
        message: "No se encontró sesión activa",
      };
    }

    // Validar duración del almuerzo
    if (session[0].lunchStartTime) {
      const lunchStart = new Date(session[0].lunchStartTime);
      const lunchValidation = validateLunchDuration(lunchStart, timestamp);

      if (!lunchValidation.isValid) {
        return {
          success: false,
          message: lunchValidation.error!,
          validationErrors: [lunchValidation.error!],
        };
      }
    }

    // Crear entrada de tiempo
    const entry = await createTimeEntry(userId, "resume_shift", timestamp);

    // Actualizar sesión
    await db
      .update(workSessions)
      .set({
        lunchEndTime: timestamp,
        status: "active",
      })
      .where(eq(workSessions.id, session[0].id));

    // Actualizar totales
    await updateSessionTotals(session[0].id);

    // Obtener sesión actualizada
    const updatedSession = await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.id, session[0].id))
      .limit(1);

    // Obtener estados de botones
    const buttonStates = await getButtonStates(userId, timestamp);

    return {
      success: true,
      message: "Turno reanudado exitosamente",
      session: updatedSession[0],
      entry,
      buttonStates,
    };
  } catch (error) {
    console.error("Error en resume-shift:", error);
    return {
      success: false,
      message: "Error interno del servidor",
    };
  }
}

/**
 * Obtiene el estado actual del usuario
 */
export async function getCurrentStatus(
  userId: number,
  currentTime: Date = getCurrentChileTime()
): Promise<{
  status: "clocked_out" | "clocked_in" | "on_lunch";
  session?: WorkSession;
  buttonStates: ButtonStates;
}> {
  try {
    const dateStr = currentTime.toISOString().split("T")[0];

    const session = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) = ${dateStr}`
        )
      )
      .limit(1);

    const buttonStates = await getButtonStates(userId, currentTime);

    if (session.length === 0) {
      return {
        status: "clocked_out",
        buttonStates,
      };
    }

    const currentSession = session[0];
    let status: "clocked_out" | "clocked_in" | "on_lunch";

    switch (currentSession.status) {
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
      session: currentSession,
      buttonStates,
    };
  } catch (error) {
    console.error("Error obteniendo estado actual:", error);
    return {
      status: "clocked_out",
      buttonStates: {
        clockIn: { enabled: false, reason: "Error del sistema" },
        clockOut: { enabled: false, reason: "Error del sistema" },
        startLunch: { enabled: false, reason: "Error del sistema" },
        resumeShift: { enabled: false, reason: "Error del sistema" },
      },
    };
  }
}

/**
 * Obtiene la sesión del día actual
 */
export async function getTodaySession(
  userId: number,
  currentTime: Date = getCurrentChileTime()
): Promise<SessionSummary | null> {
  try {
    const dateStr = currentTime.toISOString().split("T")[0];

    const session = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) = ${dateStr}`
        )
      )
      .limit(1);

    if (session.length === 0) {
      return null;
    }

    const currentSession = session[0];

    // Actualizar totales antes de devolverlos
    await updateSessionTotals(currentSession.id);

    // Obtener sesión actualizada
    const updatedSession = await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.id, currentSession.id))
      .limit(1);

    const sessionData = updatedSession[0];
    const buttonStates = await getButtonStates(userId, currentTime);

    let currentStatus: "clocked_out" | "clocked_in" | "on_lunch";
    switch (sessionData.status) {
      case "active":
        currentStatus = "clocked_in";
        break;
      case "on_lunch":
        currentStatus = "on_lunch";
        break;
      case "completed":
      default:
        currentStatus = "clocked_out";
        break;
    }

    return {
      session: sessionData,
      totalWorkedHours: Number(sessionData.totalWorkHours) || 0,
      totalLunchMinutes: sessionData.totalLunchMinutes || 0,
      currentStatus,
      canClockIn: buttonStates.clockIn.enabled,
      canClockOut: buttonStates.clockOut.enabled,
      canStartLunch: buttonStates.startLunch.enabled,
      canResumeShift: buttonStates.resumeShift.enabled,
    };
  } catch (error) {
    console.error("Error obteniendo sesión de hoy:", error);
    return null;
  }
}

/**
 * Obtiene las actividades recientes del usuario
 */
export async function getRecentActivities(
  userId: number,
  limit: number = 5
): Promise<TimeEntry[]> {
  try {
    const activities = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.timestamp))
      .limit(limit);

    return activities;
  } catch (error) {
    console.error("Error obteniendo actividades recientes:", error);
    return [];
  }
}
