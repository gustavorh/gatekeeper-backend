import { NextResponse } from "next/server";

export interface PaginationMeta {
  currentPage?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    timestamp: string;
    pagination?: PaginationMeta;
    version?: string;
    requestId?: string;
  };
  errors?: Array<{
    field?: string;
    code?: string;
    message: string;
  }>;
}

export class ResponseHelper {
  private static version = "1.0.0";

  /**
   * Respuesta exitosa con datos
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: StandardResponse["meta"],
    status = 200
  ): NextResponse {
    const response: StandardResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.version,
        ...meta,
      },
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Respuesta exitosa con paginación
   */
  static successWithPagination<T>(
    data: T,
    pagination: PaginationMeta,
    message?: string,
    status = 200
  ): NextResponse {
    return this.success(
      data,
      message,
      {
        timestamp: new Date().toISOString(),
        version: this.version,
        pagination,
      },
      status
    );
  }

  /**
   * Respuesta de error genérico
   */
  static error(
    message: string,
    errors?: StandardResponse["errors"],
    status = 400,
    data?: any
  ): NextResponse {
    const response: StandardResponse = {
      success: false,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.version,
      },
      errors,
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Error de validación
   */
  static validationError(
    message: string = "Datos de entrada inválidos",
    validationErrors: Array<{
      field?: string;
      code?: string;
      message: string;
    }> = []
  ): NextResponse {
    return this.error(message, validationErrors, 400);
  }

  /**
   * Error de autorización
   */
  static unauthorizedError(message: string = "No autorizado"): NextResponse {
    return this.error(message, undefined, 401);
  }

  /**
   * Error de permisos insuficientes
   */
  static forbiddenError(
    message: string = "Permisos insuficientes"
  ): NextResponse {
    return this.error(message, undefined, 403);
  }

  /**
   * Recurso no encontrado
   */
  static notFoundError(
    message: string = "Recurso no encontrado"
  ): NextResponse {
    return this.error(message, undefined, 404);
  }

  /**
   * Error de conflicto (recurso ya existe)
   */
  static conflictError(message: string = "El recurso ya existe"): NextResponse {
    return this.error(message, undefined, 409);
  }

  /**
   * Error interno del servidor
   */
  static internalServerError(
    message: string = "Error interno del servidor",
    error?: Error
  ): NextResponse {
    // En producción, no exponer detalles del error
    const isDevelopment = process.env.NODE_ENV === "development";

    const response: StandardResponse = {
      success: false,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.version,
      },
      ...(isDevelopment &&
        error && {
          errors: [
            {
              code: "INTERNAL_ERROR",
              message: error.message,
            },
          ],
        }),
    };

    return NextResponse.json(response, { status: 500 });
  }

  /**
   * Respuesta de operación exitosa sin datos específicos
   */
  static operationSuccess(
    message: string,
    additionalData?: any,
    status = 200
  ): NextResponse {
    return this.success(
      {
        operation: "completed",
        ...additionalData,
      },
      message,
      undefined,
      status
    );
  }

  /**
   * Respuesta para endpoints de creación
   */
  static created<T>(
    data: T,
    message: string = "Recurso creado exitosamente"
  ): NextResponse {
    return this.success(data, message, undefined, 201);
  }

  /**
   * Respuesta para operaciones sin contenido
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }
}
