import { NextRequest, NextResponse } from "next/server";
import appConfig from "./config";

/**
 * Helper reutilizable para crear headers CORS consistentes
 */
export function createCorsHeaders(
  request: NextRequest
): Record<string, string> {
  const origin = request.headers.get("origin");
  const { allowedOrigins, allowedMethods, allowedHeaders, credentials } =
    appConfig.cors;

  let allowedOrigin = allowedOrigins[0]; // Fallback default

  if (origin && allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
  } else if (appConfig.environment === "development" && origin) {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):(\d+)$/;
    if (localhostPattern.test(origin)) {
      allowedOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Allow-Credentials": credentials.toString(),
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Genera un OPTIONS handler reutilizable para cualquier ruta
 * @param routeName - Nombre descriptivo de la ruta para logs
 */
export function createOptionsHandler(routeName: string) {
  return async function OPTIONS(request: NextRequest) {
    console.log(
      `🎯 [${routeName}] Explicit OPTIONS handler for: ${request.url}`
    );

    const corsHeaders = createCorsHeaders(request);
    const response = new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });

    console.log(`📤 [${routeName}] OPTIONS response:`, {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return response;
  };
}

/**
 * Shorthand para crear un OPTIONS handler rápido
 * Uso: export const OPTIONS = quickOptions("ROUTE-NAME");
 */
export const quickOptions = (routeName: string) =>
  createOptionsHandler(routeName);
