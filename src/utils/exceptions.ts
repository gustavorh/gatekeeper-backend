export class BusinessRuleError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Recurso no encontrado") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string = "Error de validación",
    public validationErrors: Array<{ field?: string; message: string }> = []
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string = "El recurso ya existe") {
    super(message);
    this.name = "ConflictError";
  }
}
