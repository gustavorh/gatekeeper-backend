import { NextRequest, NextResponse } from "next/server";
import { injectable, inject } from "inversify";
import type { IAuthService } from "@/services/interfaces/IAuthService";
import { TYPES } from "@/types";
import { LoginRequestDTO, RegisterRequestDTO } from "@/models/dtos";

@injectable()
export class AuthController {
  constructor(@inject(TYPES.AuthService) private authService: IAuthService) {}

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const credentials: LoginRequestDTO = await request.json();

      // Validar que se proporcionen rut y password
      if (!credentials.rut || !credentials.password) {
        return NextResponse.json(
          { error: "RUT y password son requeridos" },
          { status: 400 }
        );
      }

      // Intentar login através del servicio
      const result = await this.authService.login(credentials);

      if (!result) {
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        );
      }

      // Devolver respuesta exitosa
      return NextResponse.json({
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("Error en endpoint login:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }

  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const userData: RegisterRequestDTO = await request.json();

      // Validar que se proporcionen los campos obligatorios
      if (
        !userData.rut ||
        !userData.nombre ||
        !userData.apellido_paterno ||
        !userData.apellido_materno ||
        !userData.password
      ) {
        return NextResponse.json(
          {
            error:
              "RUT, nombre, apellido paterno, apellido materno y password son requeridos",
          },
          { status: 400 }
        );
      }

      // Validar el RUT
      if (!this.authService.validateRutDigit(userData.rut)) {
        return NextResponse.json(
          { error: "El RUT proporcionado no es válido" },
          { status: 400 }
        );
      }

      // Intentar registro através del servicio
      const result = await this.authService.register(userData);

      if (!result) {
        // El servicio retorna null si hay errores (usuario existe, email existe, etc.)
        return NextResponse.json(
          {
            error:
              "No se pudo crear el usuario. Verifique que el RUT y email no estén en uso.",
          },
          { status: 409 }
        );
      }

      // Devolver respuesta exitosa
      return NextResponse.json({
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("Error en endpoint register:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }
}
