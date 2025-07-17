import { NextRequest, NextResponse } from "next/server";
import { withCors } from "@/lib/cors";

async function handler(request: NextRequest) {
  return NextResponse.json({ message: "Hello world!" });
}

export const GET = withCors(handler);
export const OPTIONS = withCors(handler);
