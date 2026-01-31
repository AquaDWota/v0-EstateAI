import { NextResponse } from "next/server";
import type {
  AnalyzePropertiesRequest,
  AnalyzePropertiesResponse,
} from "@/lib/types";
import { analyzeProperties } from "@/lib/analysis";

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
    
    // Simulate processing delay (like a real backend would have)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Run analysis
    const { results, summary } = analyzeProperties(
      body.properties,
      body.globalAssumptions,
      body.zipCode
    );
    
    const response: AnalyzePropertiesResponse = {
      results,
      meta: {
        zipCode: body.zipCode,
        summary,
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze properties. Please try again." },
      { status: 500 }
    );
  }
}
