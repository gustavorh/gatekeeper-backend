import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_ROUTE } from "@/lib/auth-middleware";

async function handler(request: NextRequest) {
  return NextResponse.json({
    message: "Gatekeeper API - Hello world!",
    version: "1.0.0",
    status: "active",
    cors: "enabled",
  });
}

// API root es una ruta pública - CORS manejado por middleware global
export const GET = PUBLIC_ROUTE(handler);
