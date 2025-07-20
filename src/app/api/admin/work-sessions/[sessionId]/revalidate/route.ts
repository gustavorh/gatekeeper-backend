import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TYPES } from "@/types";
import { AdminWorkSessionController } from "@/controllers/AdminWorkSessionController";
import { quickOptions } from "@/lib/cors-helper";

// POST: Revalidar una sesión específica
async function revalidateSessionHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const adminWorkSessionController =
      container.get<AdminWorkSessionController>(
        TYPES.AdminWorkSessionController
      );

    return await adminWorkSessionController.revalidateSession(request);
  } catch (error) {
    console.error(
      "Error en admin/work-sessions/[sessionId]/revalidate route:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("ADMIN-WORK-SESSION-REVALIDATE");

// Solo administradores pueden revalidar sesiones
export const POST = ADMIN_ONLY(revalidateSessionHandler);
