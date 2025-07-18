import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { db } from "@/lib/db";
import { users, userRoles, roles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// GET: Listar todos los usuarios con sus roles
async function getUsersHandler(request: NextRequest, user: JWTPayload) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50; // Máximo 100
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Obtener usuarios con paginación
    const allUsers = await db
      .select({
        id: users.id,
        rut: users.rut,
        nombre: users.nombre,
        apellido_paterno: users.apellido_paterno,
        apellido_materno: users.apellido_materno,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .limit(limit)
      .offset(offset);

    // Obtener roles para cada usuario
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const userRoleData = await db
          .select({
            roleId: roles.id,
            roleName: roles.name,
            roleDescription: roles.description,
            assignedAt: userRoles.assignedAt,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(
            and(
              eq(userRoles.userId, user.id),
              eq(userRoles.isActive, true),
              eq(roles.isActive, true)
            )
          );

        return {
          ...user,
          roles: userRoleData,
        };
      })
    );

    return NextResponse.json({
      users: usersWithRoles,
      pagination: {
        limit,
        offset,
        total: usersWithRoles.length,
      },
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Solo administradores pueden ver la lista de usuarios
const getUsersWithAuth = withRoles(["admin"])(getUsersHandler);
const getUsersWithCors = withCors(getUsersWithAuth);

export const GET = getUsersWithCors;
export const OPTIONS = getUsersWithCors;
