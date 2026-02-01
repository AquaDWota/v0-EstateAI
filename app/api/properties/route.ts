import { NextResponse } from "next/server";
import type { MapProperty } from "@/lib/map-types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // In production (Vercel), use relative URL for serverless functions
    // In development, use localhost backend
    const backendUrl = process.env.VERCEL_ENV 
      ? "" // Use relative path in Vercel
      : (process.env.BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000");

    const response = await fetch(
      `${backendUrl}/api/properties/${searchParams.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Failed to fetch properties." },
        { status: response.status }
      );
    }

    const data: MapProperty[] = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Properties proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties." },
      { status: 500 }
    );
  }
}
