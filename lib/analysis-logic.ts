import type {
  PropertyInput,
  GlobalAssumptions,
  PropertyAnalysisResult,
  DealMetrics,
  YearProjection,
  AgentCommentary,
} from "./types";
import { createHash } from "crypto";

interface ZipDefaults {
  taxPerYear: number;
  insurancePerYear: number;
  utilitiesPerMonth: number;
}

function stableVariation(seedText: string): number {
  const hash = createHash("md5").update(seedText).digest("hex");
  const value = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  return 0.9 + value * 0.2;
}

function zipDefaults(zipCode: string): ZipDefaults {
  const zipPrefix = zipCode?.substring(0, 3) || "000";
  const base = (zipPrefix.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % 7;
  const tax = 4200 + base * 180;
  const insurance = 1200 + base * 70;
  const utilities = 160 + base * 18;
  return {
    taxPerYear: tax,
    insurancePerYear: insurance,
    utilitiesPerMonth: utilities,
  };
}

function mortgagePayment(
  principal: number,
  interestRatePercent: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const monthlyRate = interestRatePercent / 100 / 12;
  const payments = termYears * 12;
  if (monthlyRate === 0) return principal / payments;
  const factor = Math.pow(1 + monthlyRate, payments);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function remainingBalance(
  principal: number,
  interestRatePercent: number,
  termYears: number,
  paymentsMade: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const monthlyRate = interestRatePercent / 100 / 12;
  const totalPayments = termYears * 12;
  if (monthlyRate === 0) {
    const remaining = principal - (principal / totalPayments) * paymentsMade;
    return Math.max(0, remaining);
  }
  const factor = Math.pow(1 + monthlyRate, totalPayments);
  const balance =
    (principal * (factor - Math.pow(1 + monthlyRate, paymentsMade))) / (factor - 1);
  return Math.max(0, balance);
}

function riskLevel(
  cashOnCash: number,
  monthlyCashFlow: number
): "low" | "medium" | "high" {
  if (monthlyCashFlow < 0 || cashOnCash < 3) return "high";
  if (cashOnCash < 8) return "medium";
  return "low";
}

function timingRecommendation(
  risk: string,
  monthlyCashFlow: number
): "buy_now" | "watch" | "avoid" {
  if ((risk === "low" || risk === "medium") && monthlyCashFlow > 0) return "buy_now";
  if (risk === "low" || risk === "medium") return "watch";
  return "avoid";
}

function generateCashFlowSummary(metrics: DealMetrics): string {
  if (metrics.monthlyCashFlow > 0 && metrics.capRatePercent > 6) {
    return "This property generates strong positive cash flow with an above-average cap rate.";
  }
  if (metrics.monthlyCashFlow > 0) {
    return "This property produces positive cash flow, though the cap rate is closer to market average.";
  }
  return "This property runs negative cash flow and relies more on appreciation than income.";
}

function generateRiskSummary(metrics: DealMetrics): string {
  if (metrics.riskLevel === "low") {
    return "Risk looks contained with healthy cash-on-cash returns and a solid buffer.";
  }
  if (metrics.riskLevel === "medium") {
    return "Risk is moderate; returns are acceptable but sensitive to small expense swings.";
  }
  return "Risk is elevated due to thin returns or negative cash flow.";
}

function generateMarketTimingSummary(
  metrics: DealMetrics,
  fiveYearRoi: number
): string {
  if (metrics.timingRecommendation === "buy_now") {
    return "Current pricing and returns justify moving forward at today's rates.";
  }
  if (metrics.timingRecommendation === "watch") {
    return "Monitor this deal; modest price or rate improvements would materially improve ROI.";
  }
  return `Returns are weak at current terms, with projected 5-year ROI near ${fiveYearRoi.toFixed(1)}%.`;
}

function generateRenovationSummary(prop: PropertyInput): string {
  if (prop.renovationBudget <= 0) {
    return "No significant renovation planned; capital stack stays lean.";
  }
  const ratio = prop.renovationBudget / Math.max(prop.listPrice, 1);
  if (ratio < 0.05) {
    return "Light renovation scope should improve livability without heavy capital risk.";
  }
  if (ratio < 0.12) {
    return "Moderate renovation budget signals meaningful updates with balanced risk.";
  }
  return "Heavy renovation budget raises execution risk; verify contractor bids and contingencies.";
}

function generateOverallSummary(
  prop: PropertyInput,
  metrics: DealMetrics
): string {
  if (metrics.timingRecommendation === "buy_now" && metrics.riskLevel === "low") {
    return `${prop.nickname} is a strong buy with balanced income and appreciation upside.`;
  }
  if (metrics.timingRecommendation === "buy_now") {
    return `${prop.nickname} is viable with acceptable returns for the risk profile.`;
  }
  if (metrics.timingRecommendation === "watch") {
    return `${prop.nickname} has potential but needs improved terms to clear target returns.`;
  }
  return `${prop.nickname} does not meet return thresholds at current pricing.`;
}

function generateKeyBullets(metrics: DealMetrics, timing: string): string[] {
  return [
    `Monthly cash flow: $${metrics.monthlyCashFlow.toFixed(0)}`,
    `Cap rate: ${metrics.capRatePercent.toFixed(1)}%`,
    `Cash-on-cash: ${metrics.cashOnCashReturnPercent.toFixed(1)}%`,
    `Risk: ${metrics.riskLevel}`,
    `Timing: ${timing.replace("_", " ")}`,
  ].slice(0, 5);
}

function applyDefaults(
  prop: PropertyInput,
  assumptions: GlobalAssumptions,
  zipCode: string
): PropertyInput {
  const defaults = zipDefaults(zipCode);
  const variation = stableVariation(`${prop.id}:${zipCode}`);

  const vacancyRate = prop.vacancyRatePercent || assumptions.defaultVacancyRatePercent;
  const maintenance =
    prop.maintenancePerMonth ||
    (prop.listPrice * (assumptions.defaultMaintenancePercent / 100)) / 12;
  const tax = prop.propertyTaxPerYear || defaults.taxPerYear * variation;
  const insurance = prop.insurancePerYear || defaults.insurancePerYear * variation;
  const utilities = prop.utilitiesPerMonth || defaults.utilitiesPerMonth * variation;

  return {
    ...prop,
    vacancyRatePercent: vacancyRate,
    maintenancePerMonth: maintenance,
    propertyTaxPerYear: tax,
    insurancePerYear: insurance,
    utilitiesPerMonth: utilities,
  };
}

export function analyzeProperty(
  prop: PropertyInput,
  assumptions: GlobalAssumptions,
  zipCode: string
): PropertyAnalysisResult {
  prop = applyDefaults(prop, assumptions, zipCode);

  const loanAmount = prop.listPrice - prop.listPrice * (prop.downPaymentPercent / 100);
  const mortgagePaymentAmount = mortgagePayment(
    loanAmount,
    prop.interestRatePercent,
    prop.loanTermYears
  );

  const vacancyReserve = prop.estimatedRent * (prop.vacancyRatePercent / 100);
  const monthlyExpenses =
    (prop.propertyTaxPerYear + prop.insurancePerYear + prop.hoaPerYear) / 12 +
    prop.maintenancePerMonth +
    prop.utilitiesPerMonth +
    vacancyReserve;
  const monthlyNoi = prop.estimatedRent - monthlyExpenses;
  const monthlyCashFlow = monthlyNoi - mortgagePaymentAmount;

  const capRate = prop.listPrice ? (monthlyNoi * 12 / prop.listPrice) * 100 : 0;
  const downPayment = prop.listPrice * (prop.downPaymentPercent / 100);
  const totalCashInvested = downPayment + prop.closingCosts + prop.renovationBudget;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCash = totalCashInvested
    ? (annualCashFlow / totalCashInvested) * 100
    : 0;

  const appreciationRate = assumptions.defaultAppreciationRatePercent / 100;
  const baseValue = prop.arv > 0 ? prop.arv : prop.listPrice;

  const timeline: YearProjection[] = [];
  let cumulativeCashFlow = 0;
  let cumulativeEquity = 0;

  for (let year = 1; year <= 5; year++) {
    const valueYear = baseValue * Math.pow(1 + appreciationRate, year);
    const balanceStart = remainingBalance(
      loanAmount,
      prop.interestRatePercent,
      prop.loanTermYears,
      (year - 1) * 12
    );
    const balanceEnd = remainingBalance(
      loanAmount,
      prop.interestRatePercent,
      prop.loanTermYears,
      year * 12
    );
    const principalPaid = Math.max(0, balanceStart - balanceEnd);
    const equityThisYear = principalPaid + (valueYear - baseValue) / 5;

    const cashFlowThisYear = annualCashFlow;
    cumulativeCashFlow += cashFlowThisYear;
    cumulativeEquity += equityThisYear;
    const cumulativeRoi = totalCashInvested
      ? ((cumulativeCashFlow + cumulativeEquity) / totalCashInvested) * 100
      : 0;

    timeline.push({
      year,
      cashFlowThisYear,
      equityThisYear,
      cumulativeCashFlow,
      cumulativeEquity,
      cumulativeRoiPercent: cumulativeRoi,
    });
  }

  const fiveYearTotalCashFlow = cumulativeCashFlow;
  const fiveYearEquity = cumulativeEquity;
  const fiveYearRoi = totalCashInvested
    ? ((fiveYearTotalCashFlow + fiveYearEquity) / totalCashInvested) * 100
    : 0;

  const risk = riskLevel(cashOnCash, monthlyCashFlow);
  const timing = timingRecommendation(risk, monthlyCashFlow);

  const metrics: DealMetrics = {
    monthlyMortgagePayment: Math.round(mortgagePaymentAmount * 100) / 100,
    monthlyOperatingExpenses: Math.round(monthlyExpenses * 100) / 100,
    monthlyNOI: Math.round(monthlyNoi * 100) / 100,
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    capRatePercent: Math.round(capRate * 100) / 100,
    cashOnCashReturnPercent: Math.round(cashOnCash * 100) / 100,
    fiveYearTotalRoiPercent: Math.round(fiveYearRoi * 100) / 100,
    fiveYearEquityBuilt: Math.round(fiveYearEquity * 100) / 100,
    fiveYearTotalCashFlow: Math.round(fiveYearTotalCashFlow * 100) / 100,
    riskLevel: risk,
    timingRecommendation: timing,
  };

  const commentary: AgentCommentary = {
    cashFlowSummary: generateCashFlowSummary(metrics),
    riskSummary: generateRiskSummary(metrics),
    marketTimingSummary: generateMarketTimingSummary(metrics, fiveYearRoi),
    renovationSummary: generateRenovationSummary(prop),
    overallSummary: generateOverallSummary(prop, metrics),
    keyBullets: generateKeyBullets(metrics, timing),
  };

  let baseScore = metrics.cashOnCashReturnPercent * 0.6 + metrics.capRatePercent * 0.4;
  if (risk === "high") baseScore -= 10;
  const overallScore = baseScore + metrics.fiveYearTotalRoiPercent / 20;

  return {
    property: prop,
    metrics,
    timeline,
    commentary,
    overallScore: Math.round(overallScore * 100) / 100,
  };
}

export function analyzeProperties(
  properties: PropertyInput[],
  assumptions: GlobalAssumptions,
  zipCode: string
): PropertyAnalysisResult[] {
  return properties.map((prop) => analyzeProperty(prop, assumptions, zipCode));
}
