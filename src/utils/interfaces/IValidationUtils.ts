export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IValidationUtils {
  validateRutDigit(rut: string): boolean;
  validateEmail(email: string): boolean;
  validatePassword(password: string): ValidationResult;
  validateTimeEntry(
    userId: number,
    entryType: string,
    timestamp: Date
  ): Promise<ValidationResult[]>;
  validateLunchDuration(lunchStart: Date, lunchEnd: Date): ValidationResult;
  validateWorkingHours(clockIn: Date, clockOut: Date): ValidationResult;
}
