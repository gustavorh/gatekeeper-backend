import { NextRequest, NextResponse } from "next/server";

import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY, PUBLIC_ROUTE } from "@/lib/auth-middleware";

import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminController } from "@/controllers/AdminController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener roles de un usuario específico
async function getUserRolesHandler(request: NextRequest, user?: JWTPayload) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const adminController = container.get<AdminController>(
      TYPES.AdminController
    );

    // Delegar al controlador
    return await adminController.getUserRoles(request);
  } catch (error) {
    console.error("Error en admin/users/[userId]/roles GET route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Asignar rol a un usuario
async function assignRoleHandler(request: NextRequest, user?: JWTPayload) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const adminController = container.get<AdminController>(
      TYPES.AdminController
    );

    // Delegar al controlador - user!.userId es quien asigna el rol
    return await adminController.assignUserRole(request, user!.userId);
  } catch (error) {
    console.error("Error en admin/users/[userId]/roles POST route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Revocar rol de un usuario
async function revokeRoleHandler(request: NextRequest, user?: JWTPayload) {
  try {
    // Obtener el controlador del contenedor de inversify
    const container = getContainer();
    const adminController = container.get<AdminController>(
      TYPES.AdminController
    );

    // Delegar al controlador
    return await adminController.removeUserRole(request);
  } catch (error) {
    console.error("Error en admin/users/[userId]/roles DELETE route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-USER-ROLES");

// Solo administradores pueden gestionar roles de usuarios
export const GET = ADMIN_ONLY(getUserRolesHandler);
export const POST = ADMIN_ONLY(assignRoleHandler);
export const DELETE = ADMIN_ONLY(revokeRoleHandler);
