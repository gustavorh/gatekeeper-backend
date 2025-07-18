import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import { startLunch } from "@/lib/time-tracking";

async function startLunchHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const { timestamp } = body;

    // Convertir timestamp si se proporciona
    const lunchTime = timestamp ? new Date(timestamp) : new Date();

    // Ejecutar start-lunch
    const result = await startLunch(user.userId, lunchTime);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
          validationErrors: result.validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      session: result.session,
      entry: result.entry,
      buttonStates: result.buttonStates,
    });
  } catch (error) {
    console.error("Error en endpoint start-lunch:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Combinar middlewares
const startLunchWithAuth = withAuth(startLunchHandler);
const startLunchWithCors = withCors(startLunchWithAuth);

export const POST = startLunchWithCors;
