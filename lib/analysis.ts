import type {
  PropertyInput,
  GlobalAssumptions,
  DealMetrics,
  YearProjection,
  AgentCommentary,
  PropertyAnalysisResult,
} from "./types";

// Calculate monthly mortgage payment using amortization formula
function calculateMonthlyMortgagePayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.round(payment * 100) / 100;
}

// Calculate monthly operating expenses
function calculateMonthlyOperatingExpenses(
  property: PropertyInput,
  assumptions: GlobalAssumptions
): number {
  const monthlyTax = property.propertyTaxPerYear / 12;
  const monthlyInsurance = property.insurancePerYear / 12;
  const monthlyHoa = property.hoaPerYear / 12;
  const maintenance = property.maintenancePerMonth || 
    (property.listPrice * (assumptions.defaultMaintenancePercent / 100) / 12);
  const utilities = property.utilitiesPerMonth;
  const vacancy = property.estimatedRent * (property.vacancyRatePercent / 100);
  
  return monthlyTax + monthlyInsurance + monthlyHoa + maintenance + utilities + vacancy;
}

// Calculate all metrics for a property
function calculateMetrics(
  property: PropertyInput,
  assumptions: GlobalAssumptions
): DealMetrics {
  // Loan calculations
  const downPayment = property.listPrice * (property.downPaymentPercent / 100);
  const loanAmount = property.listPrice - downPayment;
  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
    loanAmount,
    property.interestRatePercent,
    property.loanTermYears
  );
  
  // Operating expenses
  const monthlyOperatingExpenses = calculateMonthlyOperatingExpenses(
    property,
    assumptions
  );
  
  // Income calculations
  const effectiveRent = property.estimatedRent * (1 - property.vacancyRatePercent / 100);
  const monthlyNOI = effectiveRent - (monthlyOperatingExpenses - property.estimatedRent * (property.vacancyRatePercent / 100));
  const actualMonthlyNOI = property.estimatedRent - monthlyOperatingExpenses;
  const monthlyCashFlow = actualMonthlyNOI - monthlyMortgagePayment;
  
  // Key metrics
  const annualNOI = actualMonthlyNOI * 12;
  const capRatePercent = (annualNOI / property.listPrice) * 100;
  
  const totalCashInvested = 
    downPayment + property.closingCosts + property.renovationBudget;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCashReturnPercent = totalCashInvested > 0 
    ? (annualCashFlow / totalCashInvested) * 100 
    : 0;
  
  // 5-year projections (simplified)
  const appreciationRate = assumptions.defaultAppreciationRatePercent / 100;
  let fiveYearEquityBuilt = 0;
  let fiveYearTotalCashFlow = 0;
  
  // Calculate equity from appreciation
  const arvOrPrice = property.arv || property.listPrice;
  for (let year = 1; year <= 5; year++) {
    const appreciatedValue = arvOrPrice * Math.pow(1 + appreciationRate, year);
    const equityFromAppreciation = appreciatedValue - arvOrPrice;
    fiveYearEquityBuilt = equityFromAppreciation;
    fiveYearTotalCashFlow += annualCashFlow;
  }
  
  // Add principal paydown (simplified - roughly 2-3% of loan per year in early years)
  const avgPrincipalPaydown = loanAmount * 0.025 * 5;
  fiveYearEquityBuilt += avgPrincipalPaydown;
  
  const fiveYearTotalRoiPercent = totalCashInvested > 0
    ? ((fiveYearTotalCashFlow + fiveYearEquityBuilt) / totalCashInvested) * 100
    : 0;
  
  // Risk assessment
  let riskLevel: "low" | "medium" | "high";
  if (monthlyCashFlow < 0 || cashOnCashReturnPercent < 3) {
    riskLevel = "high";
  } else if (cashOnCashReturnPercent >= 8) {
    riskLevel = "low";
  } else {
    riskLevel = "medium";
  }
  
  // Timing recommendation
  let timingRecommendation: "buy_now" | "watch" | "avoid";
  if (riskLevel === "high") {
    timingRecommendation = "avoid";
  } else if (monthlyCashFlow > 0 && (riskLevel === "low" || cashOnCashReturnPercent >= 5)) {
    timingRecommendation = "buy_now";
  } else {
    timingRecommendation = "watch";
  }
  
  return {
    monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
    monthlyOperatingExpenses: Math.round(monthlyOperatingExpenses),
    monthlyNOI: Math.round(actualMonthlyNOI),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    capRatePercent: Math.round(capRatePercent * 10) / 10,
    cashOnCashReturnPercent: Math.round(cashOnCashReturnPercent * 10) / 10,
    fiveYearTotalRoiPercent: Math.round(fiveYearTotalRoiPercent * 10) / 10,
    fiveYearEquityBuilt: Math.round(fiveYearEquityBuilt),
    fiveYearTotalCashFlow: Math.round(fiveYearTotalCashFlow),
    riskLevel,
    timingRecommendation,
  };
}

// Generate 5-year timeline projections
function generateTimeline(
  property: PropertyInput,
  metrics: DealMetrics,
  assumptions: GlobalAssumptions
): YearProjection[] {
  const timeline: YearProjection[] = [];
  const appreciationRate = assumptions.defaultAppreciationRatePercent / 100;
  const arvOrPrice = property.arv || property.listPrice;
  const loanAmount = property.listPrice * (1 - property.downPaymentPercent / 100);
  const totalCashInvested = 
    property.listPrice * (property.downPaymentPercent / 100) +
    property.closingCosts +
    property.renovationBudget;
  
  let cumulativeCashFlow = 0;
  let cumulativeEquity = 0;
  
  for (let year = 1; year <= 5; year++) {
    const cashFlowThisYear = metrics.monthlyCashFlow * 12;
    
    // Appreciation equity
    const currentValue = arvOrPrice * Math.pow(1 + appreciationRate, year);
    const previousValue = year === 1 ? arvOrPrice : arvOrPrice * Math.pow(1 + appreciationRate, year - 1);
    const appreciationEquity = currentValue - previousValue;
    
    // Principal paydown (simplified - increases slightly each year)
    const principalPaydown = loanAmount * (0.02 + year * 0.002);
    
    const equityThisYear = appreciationEquity + principalPaydown;
    
    cumulativeCashFlow += cashFlowThisYear;
    cumulativeEquity += equityThisYear;
    
    const cumulativeRoiPercent = totalCashInvested > 0
      ? ((cumulativeCashFlow + cumulativeEquity) / totalCashInvested) * 100
      : 0;
    
    timeline.push({
      year,
      cashFlowThisYear: Math.round(cashFlowThisYear),
      equityThisYear: Math.round(equityThisYear),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      cumulativeEquity: Math.round(cumulativeEquity),
      cumulativeRoiPercent: Math.round(cumulativeRoiPercent * 10) / 10,
    });
  }
  
  return timeline;
}

// Generate AI-style commentary
function generateCommentary(
  property: PropertyInput,
  metrics: DealMetrics
): AgentCommentary {
  // Cash flow summary
  let cashFlowSummary: string;
  if (metrics.monthlyCashFlow > 500) {
    cashFlowSummary = `This property generates strong positive cash flow of $${metrics.monthlyCashFlow}/month with an above-average cap rate of ${metrics.capRatePercent}%. The rent-to-price ratio is favorable for this market.`;
  } else if (metrics.monthlyCashFlow > 0) {
    cashFlowSummary = `This property generates modest positive cash flow of $${metrics.monthlyCashFlow}/month. While not exceptional, it provides stable income with room for rent increases.`;
  } else {
    cashFlowSummary = `This property runs negative cash flow of $${metrics.monthlyCashFlow}/month, relying heavily on appreciation rather than income. Consider whether the market appreciation prospects justify the monthly outlay.`;
  }
  
  // Risk summary
  let riskSummary: string;
  if (metrics.riskLevel === "low") {
    riskSummary = `Risk profile is low with strong cash-on-cash returns of ${metrics.cashOnCashReturnPercent}%. The property shows resilient fundamentals that should weather market fluctuations.`;
  } else if (metrics.riskLevel === "medium") {
    riskSummary = `Risk profile is moderate. Cash-on-cash return of ${metrics.cashOnCashReturnPercent}% is acceptable but leaves limited margin for unexpected expenses or vacancy.`;
  } else {
    riskSummary = `Risk profile is elevated due to ${metrics.monthlyCashFlow < 0 ? "negative cash flow" : "low returns"}. This deal requires optimistic assumptions about appreciation or rent growth to perform well.`;
  }
  
  // Market timing summary
  let marketTimingSummary: string;
  if (metrics.timingRecommendation === "buy_now") {
    marketTimingSummary = "Current market conditions and property metrics support moving forward with this acquisition. The numbers work at today's prices and interest rates.";
  } else if (metrics.timingRecommendation === "watch") {
    marketTimingSummary = "Consider monitoring this property for 3-6 months. A price reduction of 5-10% or improvement in interest rates would significantly improve returns.";
  } else {
    marketTimingSummary = "Current metrics do not support acquisition at this time. The risk-adjusted returns are below acceptable thresholds for this market.";
  }
  
  // Renovation summary
  let renovationSummary: string;
  if (property.renovationBudget > 0) {
    const arvLift = property.arv - property.listPrice;
    if (arvLift > property.renovationBudget * 1.5) {
      renovationSummary = `The $${property.renovationBudget.toLocaleString()} renovation budget appears well-positioned to create value, with projected ARV indicating a ${Math.round((arvLift / property.renovationBudget) * 100)}% return on renovation investment.`;
    } else if (arvLift > property.renovationBudget) {
      renovationSummary = `Renovation economics are acceptable but not exceptional. The projected value-add roughly covers the renovation cost with modest upside.`;
    } else {
      renovationSummary = `Renovation ROI appears marginal. Consider reducing scope or negotiating a lower purchase price to improve deal economics.`;
    }
  } else {
    renovationSummary = "No significant renovation is planned. The property appears move-in ready or requires only cosmetic updates.";
  }
  
  // Overall summary
  let overallSummary: string;
  if (metrics.timingRecommendation === "buy_now" && metrics.riskLevel === "low") {
    overallSummary = `Strong investment opportunity with favorable risk-adjusted returns. This property represents a solid addition to a rental portfolio with immediate positive cash flow and good appreciation potential.`;
  } else if (metrics.timingRecommendation === "buy_now") {
    overallSummary = `Viable investment opportunity with acceptable returns. While not without risk, the property offers a reasonable balance of income and growth potential.`;
  } else if (metrics.timingRecommendation === "watch") {
    overallSummary = `This property shows potential but current pricing doesn't fully justify the risk. Worth monitoring for price adjustments or changing market conditions.`;
  } else {
    overallSummary = `This property does not meet investment criteria at current terms. The risk-return profile is unfavorable without significant changes to deal structure or pricing.`;
  }
  
  // Key bullets
  const keyBullets: string[] = [];
  
  if (metrics.monthlyCashFlow > 0) {
    keyBullets.push(`Positive monthly cash flow of $${metrics.monthlyCashFlow}`);
  } else {
    keyBullets.push(`Negative monthly cash flow of $${Math.abs(metrics.monthlyCashFlow)}`);
  }
  
  keyBullets.push(`${metrics.capRatePercent}% cap rate (${metrics.capRatePercent >= 6 ? "above" : "below"} market average)`);
  keyBullets.push(`5-year projected ROI of ${metrics.fiveYearTotalRoiPercent}%`);
  
  if (metrics.riskLevel === "low") {
    keyBullets.push("Strong fundamentals with low risk profile");
  } else if (metrics.riskLevel === "high") {
    keyBullets.push("Elevated risk requires careful consideration");
  }
  
  if (property.renovationBudget > 0 && property.arv > property.listPrice) {
    keyBullets.push(`Value-add opportunity with $${(property.arv - property.listPrice).toLocaleString()} potential uplift`);
  }
  
  return {
    cashFlowSummary,
    riskSummary,
    marketTimingSummary,
    renovationSummary,
    overallSummary,
    keyBullets: keyBullets.slice(0, 5),
  };
}

// Calculate overall score for ranking
function calculateOverallScore(metrics: DealMetrics): number {
  // Base score from returns
  let score = metrics.cashOnCashReturnPercent * 0.6 + metrics.capRatePercent * 0.4;
  
  // Risk penalty
  if (metrics.riskLevel === "high") {
    score -= 3;
  } else if (metrics.riskLevel === "medium") {
    score -= 1;
  }
  
  // Bonus for strong 5-year ROI
  if (metrics.fiveYearTotalRoiPercent > 50) {
    score += 2;
  } else if (metrics.fiveYearTotalRoiPercent > 30) {
    score += 1;
  }
  
  // Penalty for negative cash flow
  if (metrics.monthlyCashFlow < 0) {
    score -= 2;
  }
  
  return Math.round(score * 10) / 10;
}

// Main analysis function
export function analyzeProperties(
  properties: PropertyInput[],
  assumptions: GlobalAssumptions,
  zipCode: string
): { results: PropertyAnalysisResult[]; summary: string } {
  const results: PropertyAnalysisResult[] = properties.map((property) => {
    const metrics = calculateMetrics(property, assumptions);
    const timeline = generateTimeline(property, metrics, assumptions);
    const commentary = generateCommentary(property, metrics);
    const overallScore = calculateOverallScore(metrics);
    
    return {
      property,
      metrics,
      timeline,
      commentary,
      overallScore,
    };
  });
  
  // Sort by score
  results.sort((a, b) => b.overallScore - a.overallScore);
  
  // Generate summary
  const bestDeal = results[0];
  const summary = `Analyzed ${properties.length} properties in ZIP ${zipCode}. Top pick: ${bestDeal.property.nickname} with ${bestDeal.metrics.cashOnCashReturnPercent}% cash-on-cash return and ${bestDeal.metrics.riskLevel} risk profile.`;
  
  return { results, summary };
}
