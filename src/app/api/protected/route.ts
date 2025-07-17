import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";

async function protectedHandler(request: NextRequest, user: JWTPayload) {
  return NextResponse.json({
    message: "Acceso exitoso a ruta protegida",
    user: {
      id: user.userId,
      username: user.username,
      email: user.email,
    },
  });
}

export const GET = withAuth(protectedHandler);
