import { NextResponse } from "next/server";
import type { MapProperty } from "@/lib/map-types";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const backendUrl =
      process.env.BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
    const { id } = await params;
    const response = await fetch(`${backendUrl}/api/properties/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Failed to fetch property." },
        { status: response.status }
      );
    }

    const data: MapProperty = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Property proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property." },
      { status: 500 }
    );
  }
}
