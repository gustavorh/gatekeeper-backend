import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { PermissionController } from "@/controllers/PermissionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener permisos de un usuario específico
async function getUserPermissionsHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.getUserPermissions(request);
  } catch (error) {
    console.error(
      "Error en admin/users/[userId]/permissions GET route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Verificar si un usuario tiene un permiso específico
async function checkUserPermissionHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.checkUserPermission(request);
  } catch (error) {
    console.error(
      "Error en admin/users/[userId]/permissions/check POST route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-USER-PERMISSIONS");

// Solo administradores pueden ver permisos de usuarios
export const GET = ADMIN_ONLY(getUserPermissionsHandler);
export const POST = ADMIN_ONLY(checkUserPermissionHandler);
