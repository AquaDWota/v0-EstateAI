"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Home,
  X,
  ChevronDown,
  BedDouble,
  Bath,
  Ruler,
  Calendar,
  Building2,
  Sparkles,
} from "lucide-react";
import type { MapProperty } from "@/lib/map-types";
import type { PropertyInput } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PropertyPanelProps {
  selectedProperties: MapProperty[];
  onRemoveProperty: (id: string) => void;
  onAnalyze: (properties: PropertyInput[]) => void;
  isAnalyzing: boolean;
}

function mapPropertyToInput(mp: MapProperty): PropertyInput {
  return {
    id: mp.id,
    nickname: `${mp.propertyType.charAt(0).toUpperCase() + mp.propertyType.slice(1).replace("-", " ")} - ${mp.address}`,
    address: `${mp.address}, ${mp.zipCode}`,
    zipCode: mp.zipCode,
    listPrice: mp.listPrice,
    estimatedRent: mp.estimatedRent,
    propertyTaxPerYear: mp.propertyTaxPerYear,
    insurancePerYear: mp.insurancePerYear,
    hoaPerYear: mp.hoaPerYear,
    maintenancePerMonth: Math.round(mp.listPrice * 0.001 / 12), // 0.1% annually / 12
    utilitiesPerMonth: 0,
    vacancyRatePercent: 5,
    downPaymentPercent: 25,
    interestRatePercent: 7.0,
    loanTermYears: 30,
    closingCosts: Math.round(mp.listPrice * 0.03),
    renovationBudget: 0,
    arv: Math.round(mp.listPrice * 1.1),
  };
}

const propertyTypeLabels: Record<string, string> = {
  "single-family": "Single Family",
  "multi-family": "Multi-Family",
  "condo": "Condo",
  "townhouse": "Townhouse",
};

function PropertyCard({
  property,
  onRemove,
  onUpdate,
  propertyInput,
}: {
  property: MapProperty;
  onRemove: () => void;
  onUpdate: (updated: PropertyInput) => void;
  propertyInput: PropertyInput;
}) {
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US");
  };

  const handleInputChange = (field: keyof PropertyInput, value: string | number) => {
    onUpdate({
      ...propertyInput,
      [field]:
        typeof value === "string" && field !== "nickname" && field !== "address"
          ? Number.parseFloat(value) || 0
          : value,
    });
  };

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <CardTitle className="text-base truncate">{property.address}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {propertyTypeLabels[property.propertyType]}
              </Badge>
              <span className="text-lg font-bold text-foreground">
                ${formatPrice(property.listPrice)}
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Details */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span>{property.bedrooms} bed</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Bath className="h-4 w-4" />
            <span>{property.bathrooms} bath</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{property.yearBuilt}</span>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Monthly Rent ($)</Label>
            <Input
              type="number"
              value={propertyInput.estimatedRent || ""}
              onChange={(e) => handleInputChange("estimatedRent", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">After Repair Value ($)</Label>
            <Input
              type="number"
              value={propertyInput.arv || ""}
              onChange={(e) => handleInputChange("arv", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Annual Expenses */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Tax ($/yr)</Label>
            <Input
              type="number"
              value={propertyInput.propertyTaxPerYear || ""}
              onChange={(e) => handleInputChange("propertyTaxPerYear", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Insurance ($/yr)</Label>
            <Input
              type="number"
              value={propertyInput.insurancePerYear || ""}
              onChange={(e) => handleInputChange("insurancePerYear", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">HOA ($/yr)</Label>
            <Input
              type="number"
              value={propertyInput.hoaPerYear || ""}
              onChange={(e) => handleInputChange("hoaPerYear", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Financing Section */}
        <Collapsible open={isFinancingOpen} onOpenChange={setIsFinancingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-xs font-medium">Financing & Costs</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isFinancingOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Down Payment (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={propertyInput.downPaymentPercent}
                  onChange={(e) => handleInputChange("downPaymentPercent", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Interest Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.125}
                  value={propertyInput.interestRatePercent}
                  onChange={(e) => handleInputChange("interestRatePercent", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Loan Term (yrs)</Label>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={propertyInput.loanTermYears}
                  onChange={(e) => handleInputChange("loanTermYears", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Closing Costs ($)</Label>
                <Input
                  type="number"
                  value={propertyInput.closingCosts || ""}
                  onChange={(e) => handleInputChange("closingCosts", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Renovation Budget ($)</Label>
                <Input
                  type="number"
                  value={propertyInput.renovationBudget || ""}
                  onChange={(e) => handleInputChange("renovationBudget", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export function PropertyPanel({
  selectedProperties,
  onRemoveProperty,
  onAnalyze,
  isAnalyzing,
}: PropertyPanelProps) {
  const [propertyInputs, setPropertyInputs] = useState<Record<string, PropertyInput>>({});

  // Sync property inputs when selectedProperties changes
  useEffect(() => {
    setPropertyInputs((prev) => {
      const next: Record<string, PropertyInput> = {};
      for (const prop of selectedProperties) {
        // Keep existing input if available, otherwise create new
        next[prop.id] = prev[prop.id] || mapPropertyToInput(prop);
      }
      return next;
    });
  }, [selectedProperties]);

  // Get property input with fallback
  const getPropertyInput = useCallback((property: MapProperty): PropertyInput => {
    return propertyInputs[property.id] || mapPropertyToInput(property);
  }, [propertyInputs]);

  const handleUpdateProperty = (id: string, updated: PropertyInput) => {
    setPropertyInputs((prev) => ({ ...prev, [id]: updated }));
  };

  const handleAnalyze = () => {
    const inputs = selectedProperties.map((p) => getPropertyInput(p));
    onAnalyze(inputs);
  };

  if (selectedProperties.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-4 top-24 z-10 flex max-h-[calc(100vh-12rem)] w-96 max-w-[calc(100vw-2rem)] flex-col rounded-lg bg-background/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Selected Properties ({selectedProperties.length})
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4 pr-4">
          {selectedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              propertyInput={getPropertyInput(property)}
              onRemove={() => onRemoveProperty(property.id)}
              onUpdate={(updated) => handleUpdateProperty(property.id, updated)}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <Button
          className="w-full"
          size="lg"
          onClick={handleAnalyze}
          disabled={isAnalyzing || selectedProperties.length < 2}
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze {selectedProperties.length} Properties
            </>
          )}
        </Button>
        {selectedProperties.length < 2 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Select at least 2 properties to compare
          </p>
        )}
      </div>
    </div>
  );
}
