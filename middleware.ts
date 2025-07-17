import { NextRequest, NextResponse } from "next/server";
import appConfig from "./src/lib/config";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = appConfig.cors.allowedOrigins;

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin":
          origin && allowedOrigins.includes(origin)
            ? origin
            : allowedOrigins[0],
        "Access-Control-Allow-Methods":
          appConfig.cors.allowedMethods.join(", "),
        "Access-Control-Allow-Headers":
          appConfig.cors.allowedHeaders.join(", "),
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // For all other requests, add CORS headers
  const response = NextResponse.next();

  // Set the correct origin header
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    appConfig.cors.allowedMethods.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    appConfig.cors.allowedHeaders.join(", ")
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
