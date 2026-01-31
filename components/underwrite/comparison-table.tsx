"use client";

import React from "react"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TableIcon } from "lucide-react";
import type { PropertyAnalysisResult } from "@/lib/types";

interface ComparisonTableProps {
  results: PropertyAnalysisResult[];
}

type SortField =
  | "nickname"
  | "capRate"
  | "cashOnCash"
  | "fiveYearRoi"
  | "risk"
  | "timing";

export function ComparisonTable({ results }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>("cashOnCash");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "nickname":
        comparison = a.property.nickname.localeCompare(b.property.nickname);
        break;
      case "capRate":
        comparison = a.metrics.capRatePercent - b.metrics.capRatePercent;
        break;
      case "cashOnCash":
        comparison =
          a.metrics.cashOnCashReturnPercent - b.metrics.cashOnCashReturnPercent;
        break;
      case "fiveYearRoi":
        comparison =
          a.metrics.fiveYearTotalRoiPercent - b.metrics.fiveYearTotalRoiPercent;
        break;
      case "risk":
        const riskOrder = { low: 0, medium: 1, high: 2 };
        comparison =
          riskOrder[a.metrics.riskLevel] - riskOrder[b.metrics.riskLevel];
        break;
      case "timing":
        const timingOrder = { buy_now: 0, watch: 1, avoid: 2 };
        comparison =
          timingOrder[a.metrics.timingRecommendation] -
          timingOrder[b.metrics.timingRecommendation];
        break;
    }
    return sortAsc ? comparison : -comparison;
  });

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low":
        return "bg-success text-success-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "high":
        return "bg-destructive text-destructive-foreground";
    }
  };

  const getTimingColor = (timing: "buy_now" | "watch" | "avoid") => {
    switch (timing) {
      case "buy_now":
        return "bg-success text-success-foreground";
      case "watch":
        return "bg-warning text-warning-foreground";
      case "avoid":
        return "bg-destructive text-destructive-foreground";
    }
  };

  const formatTiming = (timing: "buy_now" | "watch" | "avoid") => {
    switch (timing) {
      case "buy_now":
        return "Buy Now";
      case "watch":
        return "Watch";
      case "avoid":
        return "Avoid";
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TableIcon className="h-5 w-5 text-accent" />
          Comparison Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left">
                  <SortButton field="nickname">Property</SortButton>
                </th>
                <th className="py-2 text-right">
                  <SortButton field="capRate">Cap Rate</SortButton>
                </th>
                <th className="py-2 text-right">
                  <SortButton field="cashOnCash">Cash-on-Cash</SortButton>
                </th>
                <th className="py-2 text-right">
                  <SortButton field="fiveYearRoi">5-Yr ROI</SortButton>
                </th>
                <th className="py-2 text-center">
                  <SortButton field="risk">Risk</SortButton>
                </th>
                <th className="py-2 text-center">
                  <SortButton field="timing">Timing</SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => (
                <tr
                  key={result.property.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3 font-medium text-foreground">
                    {result.property.nickname}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {result.metrics.capRatePercent.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right font-medium text-foreground">
                    {result.metrics.cashOnCashReturnPercent.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {result.metrics.fiveYearTotalRoiPercent.toFixed(0)}%
                  </td>
                  <td className="py-3 text-center">
                    <Badge
                      className={`text-xs ${getRiskColor(result.metrics.riskLevel)}`}
                    >
                      {result.metrics.riskLevel}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge
                      className={`text-xs ${getTimingColor(result.metrics.timingRecommendation)}`}
                    >
                      {formatTiming(result.metrics.timingRecommendation)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
