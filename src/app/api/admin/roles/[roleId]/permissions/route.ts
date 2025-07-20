import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { PermissionController } from "@/controllers/PermissionController";
import { quickOptions } from "@/lib/cors-helper";

// GET: Obtener permisos de un rol específico
async function getRolePermissionsHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.getRolePermissions(request);
  } catch (error) {
    console.error(
      "Error en admin/roles/[roleId]/permissions GET route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Asignar permisos a un rol
async function assignPermissionsToRoleHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.assignPermissionsToRole(request);
  } catch (error) {
    console.error(
      "Error en admin/roles/[roleId]/permissions POST route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Remover permisos de un rol
async function removePermissionsFromRoleHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const permissionController = container.get<PermissionController>(
      TYPES.PermissionController
    );

    return await permissionController.removePermissionsFromRole(request);
  } catch (error) {
    console.error(
      "Error en admin/roles/[roleId]/permissions DELETE route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-ROLE-PERMISSIONS");

// Solo administradores pueden gestionar permisos de roles
export const GET = ADMIN_ONLY(getRolePermissionsHandler);
export const POST = ADMIN_ONLY(assignPermissionsToRoleHandler);
export const DELETE = ADMIN_ONLY(removePermissionsFromRoleHandler);
