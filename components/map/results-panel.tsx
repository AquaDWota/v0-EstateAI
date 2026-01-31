"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  TrendingUp,
  Eye,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  BarChart3,
  Bot,
} from "lucide-react";
import type { AnalyzePropertiesResponse, PropertyAnalysisResult } from "@/lib/types";
import { PropertyDetailModal } from "@/components/underwrite/property-detail-modal";
import { ComparisonTable } from "@/components/underwrite/comparison-table";
import { AgentBadges } from "@/components/underwrite/agent-badges";
import { cn } from "@/lib/utils";

interface MapResultsPanelProps {
  results: AnalyzePropertiesResponse | null;
  isLoading: boolean;
  isVisible: boolean;
  onClose: () => void;
}

export function MapResultsPanel({
  results,
  isLoading,
  isVisible,
  onClose,
}: MapResultsPanelProps) {
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyAnalysisResult | null>(null);

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
    <div
      className={cn(
        "absolute top-4 right-4 z-20 h-[90vh] w-full max-w-md transform-gpu overflow-hidden rounded-lg border border-border bg-background shadow-lg transition-all duration-300 md:w-1/3",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-foreground">Analysis Results</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          {isLoading && (
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
          )}

          {!isLoading && results && (
            <div className="space-y-6 absolute w-full">
              {/* AI Underwriters Panel */}
              <AgentBadges />

              {/* Summary */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-4 text-accent" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {results.meta.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Best Deal */}
              {(() => {
                const sortedResults = [...results.results].sort(
                  (a, b) => b.overallScore - a.overallScore
                );
                const bestDeal = sortedResults[0];

                return (
                  <>
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

                    {/* All Properties */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        All Properties
                      </h3>
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
                                <p className="text-xs text-muted-foreground">
                                  Cash-on-Cash
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {getRiskBadge(result.metrics.riskLevel)}
                              {getTimingBadge(result.metrics.timingRecommendation)}
                              <span className="ml-auto text-xs text-muted-foreground">
                                Score: {result.overallScore.toFixed(1)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Comparison Table */}
                    <ComparisonTable results={sortedResults} />
                  </>
                );
              })()}
            </div>
          )}
        </ScrollArea>
      </div>

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
          {selectedProperty && <PropertyDetailModal result={selectedProperty} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
