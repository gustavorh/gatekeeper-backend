import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { comparePassword, generateToken } from "@/lib/auth";
import { withCors } from "@/lib/cors";

async function loginHandler(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validar que se proporcionen username y password
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username y password son requeridos" },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
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

    // Generar el token JWT
    const token = generateToken({
      userId: foundUser.id,
      username: foundUser.username,
      email: foundUser.email || undefined,
    });

    // Devolver el token y la información del usuario (sin password)
    return NextResponse.json({
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username,
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
