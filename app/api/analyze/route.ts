import { NextResponse } from "next/server";
import type {
  AnalyzePropertiesRequest,
  AgentCommentaryResponse,
} from "@/lib/types";
import { analyzeProperties } from "@/lib/analysis-logic";

// FastAPI backend URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

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

    // Run analysis using Next.js implementation (for metrics calculation)
    const results = analyzeProperties(
      body.properties,
      body.globalAssumptions,
      body.zipCode
    );
    
    // Sort by overall score
    results.sort((a, b) => b.overallScore - a.overallScore);

    const top = results[0];
    const summary = `Analyzed ${results.length} properties in ZIP ${body.zipCode}. Top pick: ${top.property.nickname} with ${top.metrics.cashOnCashReturnPercent.toFixed(1)}% cash-on-cash return and ${top.metrics.riskLevel} risk profile.`;

    // Call FastAPI backend to get AI agent commentary
    let agentCommentary;
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/agent-commentary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000), // 90 second timeout for agent processing
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        agentCommentary = backendData.agentCommentary;
        console.log("✅ Received AI agent commentary from backend");
      } else {
        console.warn("⚠️ Backend agent call failed, using fallback commentary");
        throw new Error("Backend unavailable");
      }
    } catch (error) {
      console.warn("⚠️ Could not reach backend agents, using fallback commentary:", error);
      // Fallback to mock commentary if backend/agents are unavailable
      agentCommentary = {
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
    }

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
