import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { comparePassword, generateTokenWithRoles } from "@/lib/auth";
import { withCors } from "@/lib/cors";

async function loginHandler(request: NextRequest) {
  try {
    const { rut, password } = await request.json();

    // Validar que se proporcionen rut y password
    if (!rut || !password) {
      return NextResponse.json(
        { error: "RUT y password son requeridos" },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos
    const user = await db
      .select()
      .from(users)
      .where(eq(users.rut, rut))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const foundUser = user[0];

    // Verificar la contraseña
    const isPasswordValid = await comparePassword(password, foundUser.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Generar el token JWT con roles
    const token = await generateTokenWithRoles({
      userId: foundUser.id,
      rut: foundUser.rut,
      nombre: foundUser.nombre,
      apellido_paterno: foundUser.apellido_paterno,
      apellido_materno: foundUser.apellido_materno,
      email: foundUser.email || undefined,
    });

    // Devolver el token y la información del usuario (sin password)
    return NextResponse.json({
      token,
      user: {
        id: foundUser.id,
        rut: foundUser.rut,
        nombre: foundUser.nombre,
        apellido_paterno: foundUser.apellido_paterno,
        apellido_materno: foundUser.apellido_materno,
        email: foundUser.email,
        createdAt: foundUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export const POST = withCors(loginHandler);
export const OPTIONS = withCors(loginHandler);
