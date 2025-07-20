import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IAuthService } from "@/services/interfaces/IAuthService";
import { TYPES } from "@/types";
import { LoginRequestDTO, RegisterRequestDTO } from "@/models/dtos";
import { ResponseHelper } from "@/utils/ResponseHelper";

@injectable()
export class AuthController {
  constructor(@inject(TYPES.AuthService) private authService: IAuthService) {}

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const credentials: LoginRequestDTO = await request.json();

      // Validar que se proporcionen rut y password
      if (!credentials.rut || !credentials.password) {
        return ResponseHelper.validationError("RUT y password son requeridos", [
          ...(!credentials.rut
            ? [{ field: "rut", message: "RUT es requerido" }]
            : []),
          ...(!credentials.password
            ? [{ field: "password", message: "Password es requerido" }]
            : []),
        ]);
      }

      // Intentar login através del servicio
      const result = await this.authService.login(credentials);

      if (!result) {
        return ResponseHelper.unauthorizedError("Credenciales inválidas");
      }

      // Devolver respuesta exitosa
      return ResponseHelper.success(
        {
          token: result.token,
          user: result.user,
        },
        "Login exitoso"
      );
    } catch (error) {
      console.error("Error en endpoint login:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }

  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const userData: RegisterRequestDTO = await request.json();

      // Validar que se proporcionen los campos obligatorios
      const validationErrors = [];
      if (!userData.rut)
        validationErrors.push({ field: "rut", message: "RUT es requerido" });
      if (!userData.nombre)
        validationErrors.push({
          field: "nombre",
          message: "Nombre es requerido",
        });
      if (!userData.apellido_paterno)
        validationErrors.push({
          field: "apellido_paterno",
          message: "Apellido paterno es requerido",
        });
      if (!userData.apellido_materno)
        validationErrors.push({
          field: "apellido_materno",
          message: "Apellido materno es requerido",
        });
      if (!userData.password)
        validationErrors.push({
          field: "password",
          message: "Password es requerido",
        });

      if (validationErrors.length > 0) {
        return ResponseHelper.validationError(
          "Campos obligatorios faltantes",
          validationErrors
        );
      }

      // Validar el RUT
      if (!this.authService.validateRutDigit(userData.rut)) {
        return ResponseHelper.validationError(
          "El RUT proporcionado no es válido",
          [
            {
              field: "rut",
              code: "INVALID_FORMAT",
              message: "Formato de RUT inválido",
            },
          ]
        );
      }

      // Intentar registro através del servicio
      const result = await this.authService.register(userData);

      if (!result) {
        // El servicio retorna null si hay errores (usuario existe, email existe, etc.)
        return ResponseHelper.conflictError(
          "No se pudo crear el usuario. Verifique que el RUT y email no estén en uso."
        );
      }

      // Devolver respuesta exitosa
      return ResponseHelper.created(
        {
          token: result.token,
          user: result.user,
        },
        "Usuario registrado exitosamente"
      );
    } catch (error) {
      console.error("Error en endpoint register:", error);
      return ResponseHelper.internalServerError(
        "Error interno del servidor",
        error as Error
      );
    }
  }
}
