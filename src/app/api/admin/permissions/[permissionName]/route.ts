import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { PermissionController } from "@/controllers/PermissionController";
import { quickOptions } from "@/lib/cors-helper";

// DELETE: Eliminar un permiso
async function deletePermissionHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.deletePermission(request);
  } catch (error) {
    console.error(
      "Error en admin/permissions/[permissionName] DELETE route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-PERMISSION");

// Solo administradores pueden eliminar permisos
export const DELETE = ADMIN_ONLY(deletePermissionHandler);
