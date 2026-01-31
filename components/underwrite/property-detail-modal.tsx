"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Shield,
  Clock,
  Wrench,
  FileText,
  TrendingUp,
  Building2,
} from "lucide-react";
import type { PropertyAnalysisResult } from "@/lib/types";

interface PropertyDetailModalProps {
  result: PropertyAnalysisResult;
}

export function PropertyDetailModal({ result }: PropertyDetailModalProps) {
  const { property, metrics, timeline, commentary } = result;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Property Info */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{property.address}</p>
          <p className="text-sm text-muted-foreground">ZIP: {property.zipCode}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getRiskColor(metrics.riskLevel)}>
            {metrics.riskLevel} risk
          </Badge>
          <Badge className={getTimingColor(metrics.timingRecommendation)}>
            {metrics.timingRecommendation.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {metrics.capRatePercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Cap Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {metrics.cashOnCashReturnPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Cash-on-Cash</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {metrics.fiveYearTotalRoiPercent.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">5-Year ROI</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(metrics.monthlyCashFlow)}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Cash Flow</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Details */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-accent" />
            Financial Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">List Price</span>
              <span className="font-medium text-foreground">
                {formatCurrency(property.listPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium text-foreground">
                {formatCurrency(property.estimatedRent)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Mortgage</span>
              <span className="font-medium text-foreground">
                {formatCurrency(metrics.monthlyMortgagePayment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly NOI</span>
              <span className="font-medium text-foreground">
                {formatCurrency(metrics.monthlyNOI)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operating Expenses</span>
              <span className="font-medium text-foreground">
                {formatCurrency(metrics.monthlyOperatingExpenses)}/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">5-Year Equity Built</span>
              <span className="font-medium text-foreground">
                {formatCurrency(metrics.fiveYearEquityBuilt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-Year Timeline */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-accent" />
            5-Year Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">
                    Year
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    Cash Flow
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    Equity
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    Cumulative ROI
                  </th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((year) => (
                  <tr key={year.year} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium text-foreground">
                      Year {year.year}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatCurrency(year.cashFlowThisYear)}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatCurrency(year.equityThisYear)}
                    </td>
                    <td className="py-2 text-right font-medium text-foreground">
                      {year.cumulativeRoiPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Commentary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-accent" />
              Cash Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {commentary.cashFlowSummary}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-accent" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {commentary.riskSummary}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-accent" />
              Market Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {commentary.marketTimingSummary}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4 text-accent" />
              Renovation Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {commentary.renovationSummary}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-accent" />
              Overall Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{commentary.overallSummary}</p>
            <ul className="mt-3 space-y-1">
              {commentary.keyBullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  {bullet}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
