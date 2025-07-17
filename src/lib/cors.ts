import { NextRequest, NextResponse } from "next/server";
import config from "./config";

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

const defaultCorsOptions: CorsOptions = {
  origin: config.cors.allowedOrigins,
  methods: config.cors.allowedMethods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: config.cors.credentials,
};

export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: CorsOptions = defaultCorsOptions
) {
  return async (request: NextRequest) => {
    const origin = request.headers.get("origin");
    const allowedOrigins = options.origin
      ? Array.isArray(options.origin)
        ? options.origin
        : [options.origin]
      : [];

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 200 });

      // Set appropriate origin header
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
      } else if (allowedOrigins.length > 0) {
        response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
      }

      if (options.methods) {
        response.headers.set(
          "Access-Control-Allow-Methods",
          options.methods.join(", ")
        );
      }

      if (options.allowedHeaders) {
        response.headers.set(
          "Access-Control-Allow-Headers",
          options.allowedHeaders.join(", ")
        );
      }

      if (options.credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }

      return response;
    }

    // Handle actual requests
    const response = await handler(request);

    // Set appropriate origin header
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (allowedOrigins.length > 0) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
    }

    if (options.methods) {
      response.headers.set(
        "Access-Control-Allow-Methods",
        options.methods.join(", ")
      );
    }

    if (options.allowedHeaders) {
      response.headers.set(
        "Access-Control-Allow-Headers",
        options.allowedHeaders.join(", ")
      );
    }

    if (options.credentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  };
}

// Helper function to create a simple CORS response
export function createCorsResponse(
  request: NextRequest,
  data: any = null,
  status: number = 200
) {
  const origin = request.headers.get("origin");
  const allowedOrigins = config.cors.allowedOrigins;

  const response = NextResponse.json(data, { status });

  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    config.cors.allowedMethods.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    config.cors.allowedHeaders.join(", ")
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}
