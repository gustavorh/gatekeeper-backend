import { injectable, inject } from "inversify";
import {
  IValidationUtils,
  ValidationResult,
} from "./interfaces/IValidationUtils";
import type { IDateUtils } from "./interfaces/IDateUtils";
import type { ITimeEntryRepository } from "@/repositories/interfaces/ITimeEntryRepository";
import type { IWorkSessionRepository } from "@/repositories/interfaces/IWorkSessionRepository";
import { TYPES } from "@/types";

@injectable()
export class ValidationUtils implements IValidationUtils {
  constructor(
    @inject(TYPES.DateUtils) private dateUtils: IDateUtils,
    @inject(TYPES.TimeEntryRepository)
    private timeEntryRepo: ITimeEntryRepository,
    @inject(TYPES.WorkSessionRepository)
    private sessionRepo: IWorkSessionRepository
  ) {}

  validateRutDigit(rut: string): boolean {
    // Eliminar puntos y guiones
    const cleanRut = rut.replace(/\./g, "").replace(/\-/g, "");

    if (cleanRut.length < 2) return false;

    const rutBody = cleanRut.slice(0, -1);
    const providedDigit = cleanRut.slice(-1).toLowerCase();

    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;

    for (let i = rutBody.length - 1; i >= 0; i--) {
      sum += parseInt(rutBody[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const expectedDigit =
      remainder === 0
        ? "0"
        : remainder === 1
        ? "k"
        : (11 - remainder).toString();

    return providedDigit === expectedDigit;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): ValidationResult {
    if (password.length < 6) {
      return {
        isValid: false,
        error: "La contraseña debe tener al menos 6 caracteres",
      };
    }

    // Aquí puedes añadir más validaciones según tus requerimientos
    // Por ejemplo: mayúsculas, números, caracteres especiales, etc.

    return { isValid: true };
  }

  async validateTimeEntry(
    userId: number,
    entryType: string,
    timestamp: Date
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      switch (entryType) {
        case "clock_in":
          results.push(await this.validateClockIn(userId, timestamp));
          break;
        case "clock_out":
          results.push(await this.validateClockOut(userId, timestamp));
          break;
        case "start_lunch":
          results.push(this.validateLunchTime(timestamp));
          break;
        case "resume_shift":
          results.push(await this.validateResumeShift(userId, timestamp));
          break;
      }

      // Validaciones generales
      results.push(await this.validateDailyHours(userId, timestamp));
    } catch (error) {
      results.push({
        isValid: false,
        error: "Error al validar entrada de tiempo",
      });
    }

    return results;
  }

  private async validateClockIn(
    userId: number,
    timestamp: Date
  ): Promise<ValidationResult> {
    try {
      // Validar regla de 1 hora desde el último clock-out
      const lastClockOut = await this.timeEntryRepo.findLastEntryByUserAndType(
        userId,
        "clock_out"
      );

      if (lastClockOut) {
        const oneHourLater = new Date(
          lastClockOut.timestamp.getTime() + 60 * 60 * 1000
        );
        if (timestamp < oneHourLater) {
          const remainingMinutes = Math.ceil(
            (oneHourLater.getTime() - timestamp.getTime()) / (1000 * 60)
          );
          return {
            isValid: false,
            error: `Debe esperar al menos 1 hora desde la última salida. Tiempo restante: ${remainingMinutes} minutos`,
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: "Error al validar entrada",
      };
    }
  }

  private async validateClockOut(
    userId: number,
    timestamp: Date
  ): Promise<ValidationResult> {
    try {
      // Verificar que hay una sesión activa
      const todaySession = await this.sessionRepo.findTodaySession(userId);

      if (!todaySession || todaySession.status !== "active") {
        return {
          isValid: false,
          error: "No hay una sesión activa para finalizar",
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: "Error al validar salida",
      };
    }
  }

  private validateLunchTime(timestamp: Date): ValidationResult {
    const hour = timestamp.getHours();

    if (hour < 12 || hour >= 20) {
      return {
        isValid: false,
        error: "El almuerzo solo puede iniciarse entre las 12:00 PM y 8:00 PM",
      };
    }

    return { isValid: true };
  }

  private async validateResumeShift(
    userId: number,
    timestamp: Date
  ): Promise<ValidationResult> {
    try {
      const todaySession = await this.sessionRepo.findTodaySession(userId);

      if (
        !todaySession ||
        todaySession.status !== "on_lunch" ||
        !todaySession.lunchStartTime
      ) {
        return {
          isValid: false,
          error: "No hay un almuerzo activo para resumir",
        };
      }

      // Validar duración del almuerzo
      return this.validateLunchDuration(todaySession.lunchStartTime, timestamp);
    } catch (error) {
      return {
        isValid: false,
        error: "Error al validar reanudación del turno",
      };
    }
  }

  validateLunchDuration(lunchStart: Date, lunchEnd: Date): ValidationResult {
    const durationMs = lunchEnd.getTime() - lunchStart.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes > 120) {
      return {
        isValid: false,
        error: `El almuerzo no puede durar más de 2 horas. Duración actual: ${Math.round(
          durationMinutes
        )} minutos`,
      };
    }

    return { isValid: true };
  }

  validateWorkingHours(clockIn: Date, clockOut: Date): ValidationResult {
    const durationMinutes = this.dateUtils.minutesBetween(clockIn, clockOut);
    const durationHours = durationMinutes / 60;

    if (durationHours > 10) {
      return {
        isValid: false,
        error: `No se pueden exceder 10 horas de trabajo diarias. Duración: ${durationHours.toFixed(
          1
        )} horas`,
      };
    }

    return { isValid: true };
  }

  private async validateDailyHours(
    userId: number,
    date: Date,
    additionalMinutes: number = 0
  ): Promise<ValidationResult> {
    try {
      const session = await this.sessionRepo.findByUserIdAndDate(userId, date);

      if (!session) {
        return { isValid: true }; // No hay sesión previa
      }

      const currentMinutes = session.totalWorkMinutes || 0;
      const totalMinutes = currentMinutes + additionalMinutes;
      const totalHours = totalMinutes / 60;

      if (totalHours > 10) {
        return {
          isValid: false,
          error: `No se pueden exceder 10 horas de trabajo diarias. Total actual: ${totalHours.toFixed(
            1
          )} horas`,
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: "Error al validar horas diarias",
      };
    }
  }
}
