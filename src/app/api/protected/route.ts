import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { JWTPayload } from "@/lib/auth";
import { withCors } from "@/lib/cors";

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

// Combine auth and CORS middleware
const protectedWithAuth = withAuth(protectedHandler);
const protectedWithCors = withCors(protectedWithAuth);

export const GET = protectedWithCors;
export const OPTIONS = withCors(async (req: NextRequest) => {
  return new NextResponse(null, { status: 200 });
});
