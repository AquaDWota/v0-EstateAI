// Property input structure
export type PropertyInput = {
  id: string;
  nickname: string;
  address: string;
  zipCode: string;
  listPrice: number;
  estimatedRent: number;
  propertyTaxPerYear: number;
  insurancePerYear: number;
  hoaPerYear: number;
  maintenancePerMonth: number;
  utilitiesPerMonth: number;
  vacancyRatePercent: number;
  downPaymentPercent: number;
  interestRatePercent: number;
  loanTermYears: number;
  closingCosts: number;
  renovationBudget: number;
  arv: number; // after repair value
};

// Derived metrics structure
export type DealMetrics = {
  monthlyMortgagePayment: number;
  monthlyOperatingExpenses: number;
  monthlyNOI: number;
  monthlyCashFlow: number;
  capRatePercent: number;
  cashOnCashReturnPercent: number;
  fiveYearTotalRoiPercent: number;
  fiveYearEquityBuilt: number;
  fiveYearTotalCashFlow: number;
  riskLevel: "low" | "medium" | "high";
  timingRecommendation: "buy_now" | "watch" | "avoid";
};

// Timeline structure
export type YearProjection = {
  year: number;
  cashFlowThisYear: number;
  equityThisYear: number;
  cumulativeCashFlow: number;
  cumulativeEquity: number;
  cumulativeRoiPercent: number;
};

// AI commentary structure
export type AgentCommentary = {
  cashFlowSummary: string;
  riskSummary: string;
  marketTimingSummary: string;
  renovationSummary: string;
  overallSummary: string;
  keyBullets: string[];
};

// Full result for each property
export type PropertyAnalysisResult = {
  property: PropertyInput;
  metrics: DealMetrics;
  timeline: YearProjection[];
  commentary: AgentCommentary;
  overallScore: number;
};

// Global assumptions
export type GlobalAssumptions = {
  defaultVacancyRatePercent: number;
  defaultAppreciationRatePercent: number;
  defaultMaintenancePercent: number;
};

// API Request/Response types
export type AnalyzePropertiesRequest = {
  zipCode: string;
  globalAssumptions: GlobalAssumptions;
  properties: PropertyInput[];
};

export type AnalyzePropertiesResponse = {
  results: PropertyAnalysisResult[];
  meta: {
    zipCode: string;
    summary: string;
  };
};

// Agent types for UI display
export type AgentType = 
  | "cash-flow"
  | "risk"
  | "market-timing"
  | "renovation"
  | "summary";

export const AGENT_LABELS: Record<AgentType, string> = {
  "cash-flow": "Cash-Flow Agent",
  "risk": "Risk Agent",
  "market-timing": "Market-Timing Agent",
  "renovation": "Renovation Agent",
  "summary": "Summary Agent",
};

// New England states for ZIP validation
export const NEW_ENGLAND_ZIP_PREFIXES = ["01", "02", "03", "04", "05", "06"];
