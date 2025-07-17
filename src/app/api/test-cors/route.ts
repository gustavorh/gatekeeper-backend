import { NextRequest, NextResponse } from "next/server";
import { withCors } from "@/lib/cors";

async function testCorsHandler(request: NextRequest) {
  const origin = request.headers.get("origin");
  const userAgent = request.headers.get("user-agent");

  return NextResponse.json({
    success: true,
    message: "CORS is working correctly!",
    origin: origin,
    userAgent: userAgent,
    timestamp: new Date().toISOString(),
    method: request.method,
  });
}

export const GET = withCors(testCorsHandler);
export const POST = withCors(testCorsHandler);
export const OPTIONS = withCors(testCorsHandler);
