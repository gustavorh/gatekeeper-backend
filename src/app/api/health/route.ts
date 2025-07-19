import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_ROUTE } from "@/lib/auth-middleware";
import { quickOptions } from "@/lib/cors-helper";

async function healthHandler(request: NextRequest) {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "gatekeeper-backend",
    version: "1.0.0",
  });
}

// OPTIONS handler usando el helper reutilizable
export const OPTIONS = quickOptions("HEALTH");

// Health check es una ruta pública
export const GET = PUBLIC_ROUTE(healthHandler);
