import { NextRequest, NextResponse } from "next/server";

import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY, PUBLIC_ROUTE } from "@/lib/auth-middleware";

import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminController } from "@/controllers/AdminController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener todos los roles disponibles
async function getRolesHandler(request: NextRequest, user?: JWTPayload) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const adminController = container.get<AdminController>(
      TYPES.AdminController
    );

    // Delegar al controlador
    return await adminController.getRoles(request);
  } catch (error) {
    console.error("Error en admin/roles route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-ROLES");

// Solo administradores pueden ver los roles
export const GET = ADMIN_ONLY(getRolesHandler);
