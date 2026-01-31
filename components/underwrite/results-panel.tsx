"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Eye,
  XCircle,
  BarChart3,
  Bot,
} from "lucide-react";
import type { AnalyzePropertiesResponse, PropertyAnalysisResult } from "@/lib/types";
import { PropertyDetailModal } from "./property-detail-modal";
import { ComparisonTable } from "./comparison-table";
import { AgentBadges } from "./agent-badges";

interface ResultsPanelProps {
  results: AnalyzePropertiesResponse | null;
  isLoading: boolean;
}

export function ResultsPanel({ results, isLoading }: ResultsPanelProps) {
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyAnalysisResult | null>(null);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-12 w-12 animate-pulse rounded-full bg-secondary" />
          <p className="text-lg font-medium text-foreground">
            Analyzing Properties...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Our AI underwriters are reviewing your deals
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Cash-Flow", "Risk", "Market", "Renovation", "Summary"].map(
              (agent) => (
                <Badge
                  key={agent}
                  variant="secondary"
                  className="animate-pulse"
                >
                  <Bot className="mr-1 h-3 w-3" />
                  {agent}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium text-foreground">
            No Analysis Yet
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter property details and click &quot;Analyze Deals&quot; to see
            results
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedResults = [...results.results].sort(
    (a, b) => b.overallScore - a.overallScore
  );
  const bestDeal = sortedResults[0];

  const getRiskBadge = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Low Risk
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Medium Risk
          </Badge>
        );
      case "high":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            High Risk
          </Badge>
        );
    }
  };

  const getTimingBadge = (timing: "buy_now" | "watch" | "avoid") => {
    switch (timing) {
      case "buy_now":
        return (
          <Badge className="bg-success text-success-foreground">
            <TrendingUp className="mr-1 h-3 w-3" />
            Buy Now
          </Badge>
        );
      case "watch":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Eye className="mr-1 h-3 w-3" />
            Watch
          </Badge>
        );
      case "avoid":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Avoid
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Underwriters Panel */}
      <AgentBadges />

      {/* Summary Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-accent" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{results.meta.summary}</p>
        </CardContent>
      </Card>

      {/* Best Deal Highlight */}
      {bestDeal && (
        <Card className="border-2 border-accent bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-accent text-accent-foreground">
                Best Deal
              </Badge>
              <span className="text-sm text-muted-foreground">
                Score: {bestDeal.overallScore.toFixed(1)}
              </span>
            </div>
            <CardTitle className="mt-2 text-xl">
              {bestDeal.property.nickname}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {bestDeal.property.address}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {bestDeal.metrics.capRatePercent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Cap Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {bestDeal.metrics.cashOnCashReturnPercent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Cash-on-Cash</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {bestDeal.metrics.fiveYearTotalRoiPercent.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">5-Year ROI</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {getRiskBadge(bestDeal.metrics.riskLevel)}
              {getTimingBadge(bestDeal.metrics.timingRecommendation)}
            </div>
            <p className="text-sm text-muted-foreground">
              {bestDeal.commentary.overallSummary}
            </p>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setSelectedProperty(bestDeal)}
            >
              View Full Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ranked List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">All Properties</h3>
        {sortedResults.map((result, index) => (
          <Card
            key={result.property.id}
            className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary/50"
            onClick={() => setSelectedProperty(result)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-foreground">
                      {result.property.nickname}
                    </h4>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.property.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {result.metrics.cashOnCashReturnPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Cash-on-Cash</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {getRiskBadge(result.metrics.riskLevel)}
                {getTimingBadge(result.metrics.timingRecommendation)}
                <span className="ml-auto text-xs text-muted-foreground">
                  Score: {result.overallScore.toFixed(1)}
                </span>
              </div>

              <ul className="mt-3 space-y-1">
                {result.commentary.keyBullets.slice(0, 2).map((bullet, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <ComparisonTable results={sortedResults} />

      {/* Detail Modal */}
      <Dialog
        open={!!selectedProperty}
        onOpenChange={() => setSelectedProperty(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProperty?.property.nickname} - Full Analysis
            </DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <PropertyDetailModal result={selectedProperty} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
