import { NextRequest, NextResponse } from "next/server";
import { protectApi, ADMIN_ONLY } from "@/lib/auth-middleware";
import { getContainer } from "@/config/container-helper";
import { TimeController } from "@/controllers/TimeController";
import { TYPES } from "@/types";
import { JWTPayload } from "@/lib/auth";

async function revalidateSessionsHandler(
  request: NextRequest,
  user?: JWTPayload
) {
  try {
    const container = getContainer();
    const timeController = container.get<TimeController>(TYPES.TimeController);
    return await timeController.revalidateAllSessions(request);
  } catch (error) {
    console.error("Error in revalidate sessions handler:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export const POST = ADMIN_ONLY(revalidateSessionsHandler);
