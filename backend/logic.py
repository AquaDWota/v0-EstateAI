from __future__ import annotations

from dataclasses import dataclass
from hashlib import md5
from math import pow
from typing import List, Literal

from .models import (
    AgentCommentary,
    DealMetrics,
    GlobalAssumptions,
    PropertyAnalysisResult,
    PropertyInput,
    YearProjection,
)


@dataclass
class ZipDefaults:
    tax_per_year: float
    insurance_per_year: float
    utilities_per_month: float


def _stable_variation(seed_text: str) -> float:
    digest = md5(seed_text.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16) / 0xFFFFFFFF
    return 0.9 + value * 0.2


def _zip_defaults(zip_code: str) -> ZipDefaults:
    zip_prefix = zip_code[:3] if zip_code else "000"
    base = sum(ord(ch) for ch in zip_prefix) % 7
    tax = 4200 + base * 180
    insurance = 1200 + base * 70
    utilities = 160 + base * 18
    return ZipDefaults(tax_per_year=tax, insurance_per_year=insurance, utilities_per_month=utilities)


def _mortgage_payment(principal: float, interest_rate_percent: float, term_years: int) -> float:
    if principal <= 0 or term_years <= 0:
        return 0.0
    monthly_rate = (interest_rate_percent / 100) / 12
    payments = term_years * 12
    if monthly_rate == 0:
        return principal / payments
    factor = pow(1 + monthly_rate, payments)
    return principal * monthly_rate * factor / (factor - 1)


def _remaining_balance(
    principal: float, interest_rate_percent: float, term_years: int, payments_made: int
) -> float:
    if principal <= 0 or term_years <= 0:
        return 0.0
    monthly_rate = (interest_rate_percent / 100) / 12
    total_payments = term_years * 12
    if monthly_rate == 0:
        remaining = principal - (principal / total_payments) * payments_made
        return max(0.0, remaining)
    factor = pow(1 + monthly_rate, total_payments)
    balance = principal * (factor - pow(1 + monthly_rate, payments_made)) / (factor - 1)
    return max(0.0, balance)


def _risk_level(cash_on_cash: float, monthly_cash_flow: float) -> Literal["low", "medium", "high"]:
    if monthly_cash_flow < 0 or cash_on_cash < 3:
        return "high"
    if cash_on_cash < 8:
        return "medium"
    return "low"


def _timing_recommendation(
    risk_level: str, monthly_cash_flow: float
) -> Literal["buy_now", "watch", "avoid"]:
    if risk_level in {"low", "medium"} and monthly_cash_flow > 0:
        return "buy_now"
    if risk_level in {"low", "medium"}:
        return "watch"
    return "avoid"


def _generate_cash_flow_summary(metrics: DealMetrics) -> str:
    if metrics.monthlyCashFlow > 0 and metrics.capRatePercent > 6:
        return "This property generates strong positive cash flow with an above-average cap rate."
    if metrics.monthlyCashFlow > 0:
        return "This property produces positive cash flow, though the cap rate is closer to market average."
    return "This property runs negative cash flow and relies more on appreciation than income."


def _generate_risk_summary(metrics: DealMetrics) -> str:
    if metrics.riskLevel == "low":
        return "Risk looks contained with healthy cash-on-cash returns and a solid buffer."
    if metrics.riskLevel == "medium":
        return "Risk is moderate; returns are acceptable but sensitive to small expense swings."
    return "Risk is elevated due to thin returns or negative cash flow."


def _generate_market_timing_summary(metrics: DealMetrics, five_year_roi: float) -> str:
    if metrics.timingRecommendation == "buy_now":
        return "Current pricing and returns justify moving forward at today’s rates."
    if metrics.timingRecommendation == "watch":
        return "Monitor this deal; modest price or rate improvements would materially improve ROI."
    return f"Returns are weak at current terms, with projected 5-year ROI near {five_year_roi:.1f}%."


def _generate_renovation_summary(prop: PropertyInput) -> str:
    if prop.renovationBudget <= 0:
        return "No significant renovation planned; capital stack stays lean."
    ratio = prop.renovationBudget / max(prop.listPrice, 1)
    if ratio < 0.05:
        return "Light renovation scope should improve livability without heavy capital risk."
    if ratio < 0.12:
        return "Moderate renovation budget signals meaningful updates with balanced risk."
    return "Heavy renovation budget raises execution risk; verify contractor bids and contingencies."


def _generate_overall_summary(
    prop: PropertyInput, metrics: DealMetrics
) -> str:
    if metrics.timingRecommendation == "buy_now" and metrics.riskLevel == "low":
        return f"{prop.nickname} is a strong buy with balanced income and appreciation upside."
    if metrics.timingRecommendation == "buy_now":
        return f"{prop.nickname} is viable with acceptable returns for the risk profile."
    if metrics.timingRecommendation == "watch":
        return f"{prop.nickname} has potential but needs improved terms to clear target returns."
    return f"{prop.nickname} does not meet return thresholds at current pricing."


def _generate_key_bullets(
    metrics: DealMetrics, timing: str
) -> List[str]:
    bullets = [
        f"Monthly cash flow: ${metrics.monthlyCashFlow:.0f}",
        f"Cap rate: {metrics.capRatePercent:.1f}%",
        f"Cash-on-cash: {metrics.cashOnCashReturnPercent:.1f}%",
        f"Risk: {metrics.riskLevel}",
        f"Timing: {timing.replace('_', ' ')}",
    ]
    return bullets[:5]


def _apply_defaults(prop: PropertyInput, assumptions: GlobalAssumptions, zip_code: str) -> PropertyInput:
    defaults = _zip_defaults(zip_code)
    variation = _stable_variation(f"{prop.id}:{zip_code}")

    vacancy_rate = prop.vacancyRatePercent or assumptions.defaultVacancyRatePercent
    maintenance = prop.maintenancePerMonth or (
        prop.listPrice * (assumptions.defaultMaintenancePercent / 100) / 12
    )
    tax = prop.propertyTaxPerYear or defaults.tax_per_year * variation
    insurance = prop.insurancePerYear or defaults.insurance_per_year * variation
    utilities = prop.utilitiesPerMonth or defaults.utilities_per_month * variation

    return prop.model_copy(
        update={
            "vacancyRatePercent": vacancy_rate,
            "maintenancePerMonth": maintenance,
            "propertyTaxPerYear": tax,
            "insurancePerYear": insurance,
            "utilitiesPerMonth": utilities,
        }
    )


def analyze_property(
    prop: PropertyInput, assumptions: GlobalAssumptions, zip_code: str
) -> PropertyAnalysisResult:
    prop = _apply_defaults(prop, assumptions, zip_code)

    loan_amount = prop.listPrice - (prop.listPrice * (prop.downPaymentPercent / 100))
    mortgage_payment = _mortgage_payment(
        loan_amount, prop.interestRatePercent, prop.loanTermYears
    )

    vacancy_reserve = prop.estimatedRent * (prop.vacancyRatePercent / 100)
    monthly_expenses = (
        (prop.propertyTaxPerYear + prop.insurancePerYear + prop.hoaPerYear) / 12
        + prop.maintenancePerMonth
        + prop.utilitiesPerMonth
        + vacancy_reserve
    )
    monthly_noi = prop.estimatedRent - monthly_expenses
    monthly_cash_flow = monthly_noi - mortgage_payment

    cap_rate = (monthly_noi * 12 / prop.listPrice) * 100 if prop.listPrice else 0
    down_payment = prop.listPrice * (prop.downPaymentPercent / 100)
    total_cash_invested = down_payment + prop.closingCosts + prop.renovationBudget
    annual_cash_flow = monthly_cash_flow * 12
    cash_on_cash = (annual_cash_flow / total_cash_invested) * 100 if total_cash_invested else 0

    appreciation_rate = assumptions.defaultAppreciationRatePercent / 100
    base_value = prop.arv if prop.arv > 0 else prop.listPrice

    timeline: List[YearProjection] = []
    cumulative_cash_flow = 0.0
    cumulative_equity = 0.0

    for year in range(1, 6):
        value_year = base_value * pow(1 + appreciation_rate, year)
        balance_start = _remaining_balance(
            loan_amount, prop.interestRatePercent, prop.loanTermYears, (year - 1) * 12
        )
        balance_end = _remaining_balance(
            loan_amount, prop.interestRatePercent, prop.loanTermYears, year * 12
        )
        principal_paid = max(0.0, balance_start - balance_end)
        equity_this_year = principal_paid + (value_year - base_value) / 5

        cash_flow_this_year = annual_cash_flow
        cumulative_cash_flow += cash_flow_this_year
        cumulative_equity += equity_this_year
        cumulative_roi = (
            (cumulative_cash_flow + cumulative_equity) / total_cash_invested * 100
            if total_cash_invested
            else 0
        )
        timeline.append(
            YearProjection(
                year=year,
                cashFlowThisYear=cash_flow_this_year,
                equityThisYear=equity_this_year,
                cumulativeCashFlow=cumulative_cash_flow,
                cumulativeEquity=cumulative_equity,
                cumulativeRoiPercent=cumulative_roi,
            )
        )

    five_year_total_cash_flow = cumulative_cash_flow
    five_year_equity = cumulative_equity
    five_year_roi = (
        (five_year_total_cash_flow + five_year_equity) / total_cash_invested * 100
        if total_cash_invested
        else 0
    )

    risk = _risk_level(cash_on_cash, monthly_cash_flow)
    timing = _timing_recommendation(risk, monthly_cash_flow)

    metrics = DealMetrics(
        monthlyMortgagePayment=round(mortgage_payment, 2),
        monthlyOperatingExpenses=round(monthly_expenses, 2),
        monthlyNOI=round(monthly_noi, 2),
        monthlyCashFlow=round(monthly_cash_flow, 2),
        capRatePercent=round(cap_rate, 2),
        cashOnCashReturnPercent=round(cash_on_cash, 2),
        fiveYearTotalRoiPercent=round(five_year_roi, 2),
        fiveYearEquityBuilt=round(five_year_equity, 2),
        fiveYearTotalCashFlow=round(five_year_total_cash_flow, 2),
        riskLevel=risk,
        timingRecommendation=timing,
    )

    commentary = AgentCommentary(
        cashFlowSummary=_generate_cash_flow_summary(metrics),
        riskSummary=_generate_risk_summary(metrics),
        marketTimingSummary=_generate_market_timing_summary(metrics, five_year_roi),
        renovationSummary=_generate_renovation_summary(prop),
        overallSummary=_generate_overall_summary(prop, metrics),
        keyBullets=_generate_key_bullets(metrics, timing),
    )

    base_score = metrics.cashOnCashReturnPercent * 0.6 + metrics.capRatePercent * 0.4
    if risk == "high":
        base_score -= 10
    overall_score = base_score + (metrics.fiveYearTotalRoiPercent / 20)

    return PropertyAnalysisResult(
        property=prop,
        metrics=metrics,
        timeline=timeline,
        commentary=commentary,
        overallScore=round(overall_score, 2),
    )


def analyze_properties(
    properties: List[PropertyInput], assumptions: GlobalAssumptions, zip_code: str
) -> List[PropertyAnalysisResult]:
    return [analyze_property(prop, assumptions, zip_code) for prop in properties]

