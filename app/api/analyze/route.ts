import { NextResponse } from "next/server";
import type {
  AnalyzePropertiesRequest,
  AgentCommentaryResponse,
} from "@/lib/types";
import { analyzeProperties } from "@/lib/analysis-logic";

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

    // Run analysis using Next.js implementation
    const results = analyzeProperties(
      body.properties,
      body.globalAssumptions,
      body.zipCode
    );
    
    // Sort by overall score
    results.sort((a, b) => b.overallScore - a.overallScore);

    const top = results[0];
    const summary = `Analyzed ${results.length} properties in ZIP ${body.zipCode}. Top pick: ${top.property.nickname} with ${top.metrics.cashOnCashReturnPercent.toFixed(1)}% cash-on-cash return and ${top.metrics.riskLevel} risk profile.`;

    // Mock agent commentary (replace with actual agent call if needed)
    const agentCommentary = {
      cashFlowSummary: `Analysis of ${results.length} properties completed`,
      riskSummary: "Risk assessment based on market conditions",
      marketTimingSummary: "Current market analysis",
      renovationSummary: "Renovation recommendations",
      overallSummary: summary,
      keyBullets: [
        "Property analysis complete",
        `Top property: ${top.property.nickname}`,
        `Overall score: ${top.overallScore.toFixed(2)}`,
      ],
    };

    const response: AgentCommentaryResponse = {
      analysis: {
        results,
        meta: {
          zipCode: body.zipCode,
          summary,
        },
      },
      agentCommentary,
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
