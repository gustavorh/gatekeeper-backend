import { NextRequest, NextResponse } from "next/server";
import { withCors } from "@/lib/cors";
import { db } from "@/lib/db";

async function healthHandler(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Test database connectivity
    await db.execute("SELECT 1");
    const dbStatus = "connected";

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      responseTime: `${responseTime}ms`,
      version: "1.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        responseTime: `${responseTime}ms`,
        version: "1.0.0",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

export const GET = withCors(healthHandler);
export const OPTIONS = withCors(healthHandler);
