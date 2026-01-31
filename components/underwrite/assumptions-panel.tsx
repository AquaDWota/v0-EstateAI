"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import type { GlobalAssumptions } from "@/lib/types";

interface AssumptionsPanelProps {
  assumptions: GlobalAssumptions;
  onAssumptionsChange: (assumptions: GlobalAssumptions) => void;
}

export function AssumptionsPanel({
  assumptions,
  onAssumptionsChange,
}: AssumptionsPanelProps) {
  const handleChange = (
    field: keyof GlobalAssumptions,
    value: string
  ) => {
    const numValue = Number.parseFloat(value) || 0;
    onAssumptionsChange({
      ...assumptions,
      [field]: numValue,
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5 text-accent" />
          Global Assumptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vacancyRate">Default Vacancy Rate (%)</Label>
            <Input
              id="vacancyRate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={assumptions.defaultVacancyRatePercent}
              onChange={(e) =>
                handleChange("defaultVacancyRatePercent", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appreciationRate">Annual Appreciation (%)</Label>
            <Input
              id="appreciationRate"
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={assumptions.defaultAppreciationRatePercent}
              onChange={(e) =>
                handleChange("defaultAppreciationRatePercent", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenancePercent">Maintenance (% of value)</Label>
            <Input
              id="maintenancePercent"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={assumptions.defaultMaintenancePercent}
              onChange={(e) =>
                handleChange("defaultMaintenancePercent", e.target.value)
              }
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          These defaults will be applied to new properties. Individual property
          values can be customized.
        </p>
      </CardContent>
    </Card>
  );
}
