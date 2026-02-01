import { NextResponse } from "next/server";
import type { MapProperty } from "@/lib/map-types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode') || searchParams.toString();
    // In production (Vercel), use /backend-api prefix for serverless functions
    // In development, use localhost backend
    const backendUrl = process.env.VERCEL_ENV 
      ? "/backend-api" // Use Vercel serverless path
      : (process.env.BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000");

    const response = await fetch(
      `${backendUrl}/api/properties/${zipCode}`
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
