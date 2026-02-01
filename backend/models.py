from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class GlobalAssumptions(BaseModel):
    defaultVacancyRatePercent: float = Field(5, ge=0, le=100)
    defaultAppreciationRatePercent: float = Field(3, ge=0, le=20)
    defaultMaintenancePercent: float = Field(1, ge=0, le=30)


class PropertyInput(BaseModel):
    id: str
    nickname: str
    address: str
    zipCode: str
    listPrice: float
    estimatedRent: float
    propertyTaxPerYear: float
    insurancePerYear: float
    hoaPerYear: float
    maintenancePerMonth: float
    utilitiesPerMonth: float
    vacancyRatePercent: float
    downPaymentPercent: float
    interestRatePercent: float
    loanTermYears: int
    closingCosts: float
    renovationBudget: float
    arv: float


class DealMetrics(BaseModel):
    monthlyMortgagePayment: float
    monthlyOperatingExpenses: float
    monthlyNOI: float
    monthlyCashFlow: float
    capRatePercent: float
    cashOnCashReturnPercent: float
    fiveYearTotalRoiPercent: float
    fiveYearEquityBuilt: float
    fiveYearTotalCashFlow: float
    riskLevel: Literal["low", "medium", "high"]
    timingRecommendation: Literal["buy_now", "watch", "avoid"]


class YearProjection(BaseModel):
    year: int
    cashFlowThisYear: float
    equityThisYear: float
    cumulativeCashFlow: float
    cumulativeEquity: float
    cumulativeRoiPercent: float


class AgentCommentary(BaseModel):
    cashFlowSummary: str
    riskSummary: str
    marketTimingSummary: str
    renovationSummary: str
    overallSummary: str
    keyBullets: List[str]


class PropertyAnalysisResult(BaseModel):
    property: PropertyInput
    metrics: DealMetrics
    timeline: List[YearProjection]
    commentary: AgentCommentary
    overallScore: float


class AnalyzePropertiesRequest(BaseModel):
    zipCode: str
    globalAssumptions: GlobalAssumptions
    properties: List[PropertyInput]


class AnalyzePropertiesResponse(BaseModel):
    results: List[PropertyAnalysisResult]
    meta: Dict[str, str]


class MapProperty(BaseModel):
    id: str
    address: str
    zipCode: str
    lat: float
    lng: float
    listPrice: float
    bedrooms: int
    bathrooms: int
    sqft: int
    propertyType: Literal["single-family", "multi-family", "condo", "townhouse"]
    yearBuilt: int
    estimatedRent: float
    propertyTaxPerYear: float
    insurancePerYear: float
    hoaPerYear: float
    imageUrl: Optional[str] = None

