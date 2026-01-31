"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { isValidNewEnglandZip, getZipAreaName } from "@/lib/mock-data";

interface ZipInputProps {
  zipCode: string;
  onZipChange: (zip: string) => void;
  onZipConfirm: () => void;
  isConfirmed: boolean;
}

export function ZipInput({
  zipCode,
  onZipChange,
  onZipConfirm,
  isConfirmed,
}: ZipInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!isValidNewEnglandZip(zipCode)) {
      setError(
        "Please enter a valid New England ZIP code (MA, NH, ME, VT, CT, RI)"
      );
      return;
    }
    setError(null);
    onZipConfirm();
  };

  const handleChange = (value: string) => {
    // Only allow digits and max 5 characters
    const cleaned = value.replace(/\D/g, "").slice(0, 5);
    onZipChange(cleaned);
    if (error) setError(null);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-accent" />
          Target Market
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">New England ZIP Code</Label>
            <div className="flex gap-2">
              <Input
                id="zipCode"
                placeholder="02134"
                value={zipCode}
                onChange={(e) => handleChange(e.target.value)}
                className="font-mono"
                maxLength={5}
                disabled={isConfirmed}
              />
              <Button
                onClick={handleConfirm}
                disabled={zipCode.length !== 5 || isConfirmed}
                variant={isConfirmed ? "secondary" : "default"}
              >
                {isConfirmed ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Set
                  </>
                ) : (
                  "Use ZIP"
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isConfirmed && (
            <div className="rounded-md bg-secondary p-3">
              <p className="text-sm text-muted-foreground">
                Analyzing properties in{" "}
                <span className="font-medium text-foreground">
                  {getZipAreaName(zipCode)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  onZipChange("");
                  onZipConfirm();
                }}
                className="mt-1 text-sm text-accent hover:underline"
              >
                Change ZIP
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Supported regions: MA, NH, ME, VT, CT, RI (ZIP codes starting with
            01-06)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
