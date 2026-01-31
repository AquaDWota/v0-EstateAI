"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Home, Trash2, Sparkles, ChevronDown } from "lucide-react";
import type { PropertyInput } from "@/lib/types";
import { useState } from "react";

interface PropertyFormProps {
  property: PropertyInput;
  index: number;
  onUpdate: (property: PropertyInput) => void;
  onRemove: () => void;
  onPrefill: () => void;
  canRemove: boolean;
}

export function PropertyForm({
  property,
  index,
  onUpdate,
  onRemove,
  onPrefill,
  canRemove,
}: PropertyFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleChange = (field: keyof PropertyInput, value: string | number) => {
    onUpdate({
      ...property,
      [field]: typeof value === "string" && field !== "nickname" && field !== "address"
        ? Number.parseFloat(value) || 0
        : value,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US");
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Home className="h-5 w-5 text-accent" />
            Property {index + 1}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onPrefill}
              className="text-xs bg-transparent"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Auto-fill
            </Button>
            {canRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`nickname-${property.id}`}>Nickname</Label>
            <Input
              id={`nickname-${property.id}`}
              placeholder="e.g., Duplex on Elm"
              value={property.nickname}
              onChange={(e) => handleChange("nickname", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`address-${property.id}`}>Address</Label>
            <Input
              id={`address-${property.id}`}
              placeholder="123 Main Street"
              value={property.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
        </div>

        {/* Key Financials */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Key Financials</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`listPrice-${property.id}`}>List Price ($)</Label>
              <Input
                id={`listPrice-${property.id}`}
                type="number"
                min="0"
                step="1000"
                value={property.listPrice || ""}
                onChange={(e) => handleChange("listPrice", e.target.value)}
                placeholder="450000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`estimatedRent-${property.id}`}>
                Monthly Rent ($)
              </Label>
              <Input
                id={`estimatedRent-${property.id}`}
                type="number"
                min="0"
                step="50"
                value={property.estimatedRent || ""}
                onChange={(e) => handleChange("estimatedRent", e.target.value)}
                placeholder="3000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`arv-${property.id}`}>After Repair Value ($)</Label>
              <Input
                id={`arv-${property.id}`}
                type="number"
                min="0"
                step="1000"
                value={property.arv || ""}
                onChange={(e) => handleChange("arv", e.target.value)}
                placeholder="500000"
              />
            </div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            Annual Expenses
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`propertyTax-${property.id}`}>
                Property Tax ($/yr)
              </Label>
              <Input
                id={`propertyTax-${property.id}`}
                type="number"
                min="0"
                step="100"
                value={property.propertyTaxPerYear || ""}
                onChange={(e) =>
                  handleChange("propertyTaxPerYear", e.target.value)
                }
                placeholder="5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`insurance-${property.id}`}>
                Insurance ($/yr)
              </Label>
              <Input
                id={`insurance-${property.id}`}
                type="number"
                min="0"
                step="100"
                value={property.insurancePerYear || ""}
                onChange={(e) =>
                  handleChange("insurancePerYear", e.target.value)
                }
                placeholder="1800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`hoa-${property.id}`}>HOA ($/yr)</Label>
              <Input
                id={`hoa-${property.id}`}
                type="number"
                min="0"
                step="100"
                value={property.hoaPerYear || ""}
                onChange={(e) => handleChange("hoaPerYear", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            Monthly Expenses
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`maintenance-${property.id}`}>
                Maintenance ($/mo)
              </Label>
              <Input
                id={`maintenance-${property.id}`}
                type="number"
                min="0"
                step="25"
                value={property.maintenancePerMonth || ""}
                onChange={(e) =>
                  handleChange("maintenancePerMonth", e.target.value)
                }
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`utilities-${property.id}`}>
                Utilities ($/mo)
              </Label>
              <Input
                id={`utilities-${property.id}`}
                type="number"
                min="0"
                step="25"
                value={property.utilitiesPerMonth || ""}
                onChange={(e) =>
                  handleChange("utilitiesPerMonth", e.target.value)
                }
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="text-sm font-medium">Financing & Costs</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isAdvancedOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`downPayment-${property.id}`}>
                  Down Payment (%)
                </Label>
                <Input
                  id={`downPayment-${property.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={property.downPaymentPercent}
                  onChange={(e) =>
                    handleChange("downPaymentPercent", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`interestRate-${property.id}`}>
                  Interest Rate (%)
                </Label>
                <Input
                  id={`interestRate-${property.id}`}
                  type="number"
                  min="0"
                  max="20"
                  step="0.125"
                  value={property.interestRatePercent}
                  onChange={(e) =>
                    handleChange("interestRatePercent", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`loanTerm-${property.id}`}>
                  Loan Term (years)
                </Label>
                <Input
                  id={`loanTerm-${property.id}`}
                  type="number"
                  min="1"
                  max="40"
                  value={property.loanTermYears}
                  onChange={(e) =>
                    handleChange("loanTermYears", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`closingCosts-${property.id}`}>
                  Closing Costs ($)
                </Label>
                <Input
                  id={`closingCosts-${property.id}`}
                  type="number"
                  min="0"
                  step="500"
                  value={property.closingCosts || ""}
                  onChange={(e) =>
                    handleChange("closingCosts", e.target.value)
                  }
                  placeholder="15000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`renovationBudget-${property.id}`}>
                  Renovation Budget ($)
                </Label>
                <Input
                  id={`renovationBudget-${property.id}`}
                  type="number"
                  min="0"
                  step="1000"
                  value={property.renovationBudget || ""}
                  onChange={(e) =>
                    handleChange("renovationBudget", e.target.value)
                  }
                  placeholder="20000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`vacancyRate-${property.id}`}>
                  Vacancy Rate (%)
                </Label>
                <Input
                  id={`vacancyRate-${property.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={property.vacancyRatePercent}
                  onChange={(e) =>
                    handleChange("vacancyRatePercent", e.target.value)
                  }
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quick Summary */}
        {property.listPrice > 0 && property.estimatedRent > 0 && (
          <div className="rounded-md bg-secondary p-4">
            <h4 className="text-sm font-medium text-foreground">
              Quick Estimate
            </h4>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Down Payment:{" "}
                <span className="font-medium text-foreground">
                  ${formatCurrency(
                    Math.round(
                      property.listPrice * (property.downPaymentPercent / 100)
                    )
                  )}
                </span>
              </span>
              <span>
                Total Cash Needed:{" "}
                <span className="font-medium text-foreground">
                  ${formatCurrency(
                    Math.round(
                      property.listPrice * (property.downPaymentPercent / 100) +
                        property.closingCosts +
                        property.renovationBudget
                    )
                  )}
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
