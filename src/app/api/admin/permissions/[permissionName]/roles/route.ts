import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { PermissionController } from "@/controllers/PermissionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener roles que tienen un permiso específico
async function getRolesWithPermissionHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.getRolesWithPermission(request);
  } catch (error) {
    console.error(
      "Error en admin/permissions/[permissionName]/roles route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-PERMISSION-ROLES");

// Solo administradores pueden ver roles con permisos
export const GET = ADMIN_ONLY(getRolesWithPermissionHandler);
