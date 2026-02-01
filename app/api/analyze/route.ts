import { NextResponse } from "next/server";
import type {
  AnalyzePropertiesRequest,
  AgentCommentaryResponse,
} from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: AnalyzePropertiesRequest = await request.json();
    
    // Validate request
    if (!body.zipCode || !body.properties || body.properties.length < 2) {
      return NextResponse.json(
        { error: "Invalid request. Please provide ZIP code and at least 2 properties." },
        { status: 400 }
      );
    }
    
    if (body.properties.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 properties allowed per analysis." },
        { status: 400 }
      );
    }
    
    // In production (Vercel), use relative URL for serverless functions
    // In development, use localhost backend
    const backendUrl = process.env.VERCEL_ENV 
      ? "" // Use relative path in Vercel
      : (process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000");
    
    // Call the new agent-commentary endpoint that includes AI commentary
    const backendResponse = await fetch(
      `${backendUrl}/api/agent-commentary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        {
          error:
            errorText ||
            "Backend analysis failed. Please verify the Python API is running.",
        },
        { status: backendResponse.status }
      );
    }

    const response: AgentCommentaryResponse = await backendResponse.json();
    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze properties. Please try again." },
      { status: 500 }
    );
  }
}
