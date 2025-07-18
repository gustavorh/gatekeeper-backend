import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, generateToken } from "@/lib/auth";
import { withCors } from "@/lib/cors";

async function registerHandler(request: NextRequest) {
  try {
    const { rut, nombre, apellido_paterno, apellido_materno, password, email } =
      await request.json();

    // Validar que se proporcionen los campos obligatorios
    if (
      !rut ||
      !nombre ||
      !apellido_paterno ||
      !apellido_materno ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "RUT, nombre, apellido paterno, apellido materno y password son requeridos",
        },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.rut, rut))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 409 }
      );
    }

    // Verificar si el email ya existe (si se proporciona)
    if (email) {
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 409 }
        );
      }
    }

    // Encriptar la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear el usuario
    const newUser = await db.insert(users).values({
      rut,
      nombre,
      apellido_paterno,
      apellido_materno,
      password: hashedPassword,
      email: email || null,
    });

    // Obtener el usuario creado
    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.rut, rut))
      .limit(1);

    if (createdUser.length === 0) {
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 }
      );
    }

    const user = createdUser[0];

    // Generar el token JWT
    const token = generateToken({
      userId: user.id,
      rut: user.rut,
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno,
      apellido_materno: user.apellido_materno,
      email: user.email || undefined,
    });

    // Devolver el token y la información del usuario (sin password)
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          rut: user.rut,
          nombre: user.nombre,
          apellido_paterno: user.apellido_paterno,
          apellido_materno: user.apellido_materno,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export const POST = withCors(registerHandler);
export const OPTIONS = withCors(registerHandler);
