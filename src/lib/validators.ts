import { db } from "./db";
import { timeEntries, workSessions, validationRules } from "./schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: string;
}

export interface ButtonStates {
  clockIn: {
    enabled: boolean;
    reason?: string;
  };
  clockOut: {
    enabled: boolean;
    reason?: string;
  };
  startLunch: {
    enabled: boolean;
    reason?: string;
  };
  resumeShift: {
    enabled: boolean;
    reason?: string;
  };
}

/**
 * Valida que haya pasado al menos 1 hora desde el último clock-out
 */
export async function validateOneHourRule(
  userId: number,
  currentTime: Date = new Date()
): Promise<ValidationResult> {
  try {
    // Buscar la última salida del usuario
    const lastClockOut = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.entryType, "clock_out")
        )
      )
      .orderBy(desc(timeEntries.timestamp))
      .limit(1);

    if (lastClockOut.length === 0) {
      return { isValid: true }; // No hay clock-out previo
    }

    const lastClockOutTime = new Date(lastClockOut[0].timestamp);
    const oneHourLater = new Date(lastClockOutTime.getTime() + 60 * 60 * 1000);

    if (currentTime < oneHourLater) {
      const remainingMinutes = Math.ceil(
        (oneHourLater.getTime() - currentTime.getTime()) / (1000 * 60)
      );
      return {
        isValid: false,
        error: "Debe esperar al menos 1 hora desde la última salida",
        details: `Tiempo restante: ${remainingMinutes} minutos`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating one hour rule:", error);
    return {
      isValid: false,
      error: "Error al validar regla de 1 hora",
    };
  }
}

/**
 * Valida que el horario de almuerzo esté entre 12:00 PM y 8:00 PM
 */
export function validateLunchTime(timestamp: Date): ValidationResult {
  const hour = timestamp.getHours();

  if (hour < 12 || hour >= 20) {
    return {
      isValid: false,
      error: "El almuerzo solo puede iniciarse entre las 12:00 PM y 8:00 PM",
    };
  }

  return { isValid: true };
}

/**
 * Valida que la duración del almuerzo no exceda 2 horas
 */
export function validateLunchDuration(
  startTime: Date,
  endTime: Date
): ValidationResult {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  if (durationMinutes > 120) {
    return {
      isValid: false,
      error: "El almuerzo no puede durar más de 2 horas",
      details: `Duración actual: ${Math.round(durationMinutes)} minutos`,
    };
  }

  return { isValid: true };
}

/**
 * Valida que las horas diarias no excedan 10 horas
 */
export async function validateDailyHours(
  userId: number,
  date: Date,
  additionalMinutes: number = 0
): Promise<ValidationResult> {
  try {
    const dateStr = date.toISOString().split("T")[0];

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
      return { isValid: true }; // No hay sesión previa
    }

    const currentMinutes = session[0].totalWorkMinutes || 0;
    const totalMinutes = currentMinutes + additionalMinutes;
    const totalHours = totalMinutes / 60;

    if (totalHours > 10) {
      return {
        isValid: false,
        error: "No se pueden exceder 10 horas de trabajo diarias",
        details: `Total actual: ${totalHours.toFixed(1)} horas`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating daily hours:", error);
    return {
      isValid: false,
      error: "Error al validar horas diarias",
    };
  }
}

/**
 * Valida que las horas semanales no excedan 45 horas
 */
export async function validateWeeklyHours(
  userId: number,
  date: Date,
  additionalMinutes: number = 0
): Promise<ValidationResult> {
  try {
    // Calcular el inicio de la semana (lunes)
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startDateStr = startOfWeek.toISOString().split("T")[0];
    const endDateStr = endOfWeek.toISOString().split("T")[0];

    const sessions = await db
      .select()
      .from(workSessions)
      .where(
        and(
          eq(workSessions.userId, userId),
          sql`DATE(${workSessions.date}) >= ${startDateStr}`,
          sql`DATE(${workSessions.date}) <= ${endDateStr}`
        )
      );

    const totalMinutes =
      sessions.reduce(
        (sum, session) => sum + (session.totalWorkMinutes || 0),
        0
      ) + additionalMinutes;

    const totalHours = totalMinutes / 60;

    if (totalHours > 45) {
      return {
        isValid: false,
        error: "No se pueden exceder 45 horas de trabajo semanales",
        details: `Total semanal actual: ${totalHours.toFixed(1)} horas`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating weekly hours:", error);
    return {
      isValid: false,
      error: "Error al validar horas semanales",
    };
  }
}

/**
 * Valida la secuencia de acciones (clock_in -> start_lunch -> resume_shift -> clock_out)
 */
export async function validateSequence(
  userId: number,
  nextAction: "clock_in" | "clock_out" | "start_lunch" | "resume_shift",
  currentTime: Date = new Date()
): Promise<ValidationResult> {
  try {
    const dateStr = currentTime.toISOString().split("T")[0];

    // Obtener la sesión actual
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

    const currentSession = session[0];

    switch (nextAction) {
      case "clock_in":
        if (currentSession && currentSession.status !== "completed") {
          return {
            isValid: false,
            error: "Ya tienes una sesión activa",
          };
        }
        break;

      case "clock_out":
        if (!currentSession || currentSession.status === "completed") {
          return {
            isValid: false,
            error: "No tienes una sesión activa para cerrar",
          };
        }
        break;

      case "start_lunch":
        if (!currentSession || currentSession.status !== "active") {
          return {
            isValid: false,
            error: "Debes estar en sesión activa para iniciar almuerzo",
          };
        }
        break;

      case "resume_shift":
        if (!currentSession || currentSession.status !== "on_lunch") {
          return {
            isValid: false,
            error: "Debes estar en almuerzo para reanudar el turno",
          };
        }
        break;
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating sequence:", error);
    return {
      isValid: false,
      error: "Error al validar secuencia",
    };
  }
}

/**
 * Obtiene el estado de los botones para el dashboard
 */
export async function getButtonStates(
  userId: number,
  currentTime: Date = new Date()
): Promise<ButtonStates> {
  try {
    const dateStr = currentTime.toISOString().split("T")[0];

    // Obtener la sesión actual
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

    const currentSession = session[0];
    const status = currentSession?.status || "completed";

    // Validar regla de 1 hora para clock-in
    const oneHourValidation = await validateOneHourRule(userId, currentTime);

    // Validar horario de almuerzo
    const lunchTimeValidation = validateLunchTime(currentTime);

    const buttonStates: ButtonStates = {
      clockIn: {
        enabled: status === "completed" && oneHourValidation.isValid,
        reason: !oneHourValidation.isValid
          ? oneHourValidation.error
          : undefined,
      },
      clockOut: {
        enabled: status === "active" || status === "on_lunch",
      },
      startLunch: {
        enabled: status === "active" && lunchTimeValidation.isValid,
        reason: !lunchTimeValidation.isValid
          ? lunchTimeValidation.error
          : undefined,
      },
      resumeShift: {
        enabled: status === "on_lunch",
      },
    };

    return buttonStates;
  } catch (error) {
    console.error("Error getting button states:", error);
    return {
      clockIn: { enabled: false, reason: "Error del sistema" },
      clockOut: { enabled: false, reason: "Error del sistema" },
      startLunch: { enabled: false, reason: "Error del sistema" },
      resumeShift: { enabled: false, reason: "Error del sistema" },
    };
  }
}

/**
 * Valida múltiples reglas de negocio
 */
export async function validateBusinessRules(
  userId: number,
  action: "clock_in" | "clock_out" | "start_lunch" | "resume_shift",
  currentTime: Date = new Date()
): Promise<ValidationResult[]> {
  const validations: ValidationResult[] = [];

  // Validar secuencia
  const sequenceValidation = await validateSequence(
    userId,
    action,
    currentTime
  );
  validations.push(sequenceValidation);

  // Validaciones específicas por acción
  switch (action) {
    case "clock_in":
      const oneHourValidation = await validateOneHourRule(userId, currentTime);
      validations.push(oneHourValidation);
      break;

    case "start_lunch":
      const lunchTimeValidation = validateLunchTime(currentTime);
      validations.push(lunchTimeValidation);
      break;

    case "clock_out":
      const dailyHoursValidation = await validateDailyHours(
        userId,
        currentTime
      );
      validations.push(dailyHoursValidation);
      break;
  }

  return validations;
}
