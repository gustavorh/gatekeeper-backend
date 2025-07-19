import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AuthController } from "@/controllers/AuthController";
import { PUBLIC_ROUTE } from "@/lib/auth-middleware";
import { quickOptions } from "@/lib/cors-helper";

async function registerHandler(request: NextRequest) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const authController = container.get<AuthController>(TYPES.AuthController);

    // Delegar al controlador
    return await authController.register(request);
  } catch (error) {
    console.error("Error en register route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("REGISTER");

// Register es una ruta pública (no requiere autenticación)
export const POST = PUBLIC_ROUTE(registerHandler);
