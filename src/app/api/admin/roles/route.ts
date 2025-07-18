import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { db } from "@/lib/db";
import { roles } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET: Listar todos los roles disponibles
async function getRolesHandler(request: NextRequest, user: JWTPayload) {
  try {
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissions: roles.permissions,
        isActive: roles.isActive,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .where(eq(roles.isActive, true));

    return NextResponse.json({
      roles: allRoles,
      total: allRoles.length,
    });
  } catch (error) {
    console.error("Error obteniendo roles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Solo administradores pueden ver los roles
const getRolesWithAuth = withRoles(["admin"])(getRolesHandler);
const getRolesWithCors = withCors(getRolesWithAuth);

export const GET = getRolesWithCors;
export const OPTIONS = getRolesWithCors;
