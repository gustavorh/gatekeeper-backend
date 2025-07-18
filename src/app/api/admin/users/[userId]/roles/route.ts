import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { db } from "@/lib/db";
import { userRoles, roles, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// GET: Obtener roles de un usuario específico
async function getUserRolesHandler(request: NextRequest, user: JWTPayload) {
  try {
    const url = new URL(request.url);
    const userId = parseInt(url.pathname.split("/")[3]);

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener roles del usuario
    const userRoleData = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
        permissions: roles.permissions,
        assignedAt: userRoles.assignedAt,
        isActive: userRoles.isActive,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)));

    return NextResponse.json({
      userId,
      roles: userRoleData,
    });
  } catch (error) {
    console.error("Error obteniendo roles del usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Asignar rol a un usuario
async function assignRoleHandler(request: NextRequest, user: JWTPayload) {
  try {
    const url = new URL(request.url);
    const userId = parseInt(url.pathname.split("/")[3]);
    const { roleId } = await request.json();

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    if (!roleId || isNaN(roleId)) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el rol existe
    const roleExists = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (roleExists.length === 0) {
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    }

    // Verificar si el usuario ya tiene ese rol
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: "El usuario ya tiene este rol asignado" },
        { status: 409 }
      );
    }

    // Asignar el rol
    await db.insert(userRoles).values({
      userId,
      roleId,
      assignedBy: user.userId,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Rol asignado exitosamente",
      userId,
      roleId,
      assignedBy: user.userId,
    });
  } catch (error) {
    console.error("Error asignando rol:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Remover rol de un usuario
async function removeRoleHandler(request: NextRequest, user: JWTPayload) {
  try {
    const url = new URL(request.url);
    const userId = parseInt(url.pathname.split("/")[3]);
    const { roleId } = await request.json();

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    if (!roleId || isNaN(roleId)) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario-rol existe
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        )
      )
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json(
        { error: "El usuario no tiene este rol asignado" },
        { status: 404 }
      );
    }

    // Desactivar el rol (no eliminar por auditoría)
    await db
      .update(userRoles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

    return NextResponse.json({
      success: true,
      message: "Rol removido exitosamente",
      userId,
      roleId,
      removedBy: user.userId,
    });
  } catch (error) {
    console.error("Error removiendo rol:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Solo administradores pueden gestionar roles
const getUserRolesWithAuth = withRoles(["admin"])(getUserRolesHandler);
const assignRoleWithAuth = withRoles(["admin"])(assignRoleHandler);
const removeRoleWithAuth = withRoles(["admin"])(removeRoleHandler);

const getUserRolesWithCors = withCors(getUserRolesWithAuth);
const assignRoleWithCors = withCors(assignRoleWithAuth);
const removeRoleWithCors = withCors(removeRoleWithAuth);

export const GET = getUserRolesWithCors;
export const POST = assignRoleWithCors;
export const DELETE = removeRoleWithCors;
export const OPTIONS = getUserRolesWithCors;
