"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ZipInput } from "@/components/underwrite/zip-input";
import { AssumptionsPanel } from "@/components/underwrite/assumptions-panel";
import { PropertyForm } from "@/components/underwrite/property-form";
import { ResultsPanel } from "@/components/underwrite/results-panel";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, BarChart3 } from "lucide-react";
import type {
  PropertyInput,
  GlobalAssumptions,
  AnalyzePropertiesResponse,
  AgentCommentaryResponse,
  AgentCommentary,
} from "@/lib/types";
import { DEFAULT_ASSUMPTIONS, createEmptyProperty } from "@/lib/mock-data";
import type { MapProperty } from "@/lib/map-types";

const MIN_PROPERTIES = 2;
const MAX_PROPERTIES = 5;

export default function UnderwritePage() {
  const [zipCode, setZipCode] = useState("");
  const [isZipConfirmed, setIsZipConfirmed] = useState(false);
  const [assumptions, setAssumptions] =
    useState<GlobalAssumptions>(DEFAULT_ASSUMPTIONS);
  const [properties, setProperties] = useState<PropertyInput[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzePropertiesResponse | null>(
    null
  );
  const [aiCommentary, setAiCommentary] = useState<AgentCommentary | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleZipConfirm = useCallback(() => {
    if (isZipConfirmed) {
      // Reset
      setIsZipConfirmed(false);
      setProperties([]);
      setResults(null);
    } else {
      setIsZipConfirmed(true);
      // Initialize with 2 empty properties
      setProperties([
        createEmptyProperty(zipCode, 0),
        createEmptyProperty(zipCode, 1),
      ]);
    }
  }, [isZipConfirmed, zipCode]);

  const handleAddProperty = useCallback(() => {
    if (properties.length < MAX_PROPERTIES) {
      setProperties((prev) => [
        ...prev,
        createEmptyProperty(zipCode, prev.length),
      ]);
    }
  }, [properties.length, zipCode]);

  const handleRemoveProperty = useCallback((id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdateProperty = useCallback((updated: PropertyInput) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }, []);

  const handlePrefillProperty = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/properties?zipCode=${zipCode}&count=50`);
        if (!response.ok) {
          throw new Error("Failed to load sample properties.");
        }
        const options: MapProperty[] = await response.json();
        if (options.length === 0) {
          return;
        }
        setProperties((prev) =>
          prev.map((p, index) => {
            if (p.id !== id) return p;
            const pick = options[index % options.length];
            return {
              id: p.id,
              nickname: `${pick.propertyType.charAt(0).toUpperCase() + pick.propertyType.slice(1).replace("-", " ")} - ${pick.address}`,
              address: `${pick.address}, ${pick.zipCode}`,
              zipCode: pick.zipCode,
              listPrice: pick.listPrice,
              estimatedRent: pick.estimatedRent,
              propertyTaxPerYear: pick.propertyTaxPerYear,
              insurancePerYear: pick.insurancePerYear,
              hoaPerYear: pick.hoaPerYear,
              maintenancePerMonth: Math.round(pick.listPrice * 0.001 / 12),
              utilitiesPerMonth: 0,
              vacancyRatePercent: 5,
              downPaymentPercent: 25,
              interestRatePercent: 7.0,
              loanTermYears: 30,
              closingCosts: Math.round(pick.listPrice * 0.03),
              renovationBudget: 0,
              arv: Math.round(pick.listPrice * 1.1),
            };
          })
        );
      } catch (error) {
        console.error("Prefill error:", error);
      }
    },
    [zipCode]
  );

  const validateProperties = useCallback(() => {
    for (const prop of properties) {
      if (!prop.listPrice || prop.listPrice <= 0) {
        return `Please enter a list price for "${prop.nickname || "Property"}"`;
      }
      if (!prop.estimatedRent || prop.estimatedRent <= 0) {
        return `Please enter estimated rent for "${prop.nickname || "Property"}"`;
      }
    }
    return null;
  }, [properties]);

  const handleAnalyze = useCallback(async () => {
    const validationError = validateProperties();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResults(null);
    setAiCommentary(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zipCode,
          globalAssumptions: assumptions,
          properties,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please try again.");
      }

      const data: AgentCommentaryResponse = await response.json();
      setResults(data.analysis);
      setAiCommentary(data.agentCommentary);
    } catch {
      setError("Unable to complete analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [zipCode, assumptions, properties, validateProperties]);

  const canAnalyze =
    isZipConfirmed &&
    properties.length >= MIN_PROPERTIES &&
    !isAnalyzing;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Underwriting Workspace
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter property details and analyze deals across New England
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Inputs */}
            <div className="space-y-6">
              <ZipInput
                zipCode={zipCode}
                onZipChange={setZipCode}
                onZipConfirm={handleZipConfirm}
                isConfirmed={isZipConfirmed}
              />

              {isZipConfirmed && (
                <>
                  <AssumptionsPanel
                    assumptions={assumptions}
                    onAssumptionsChange={setAssumptions}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">
                        Properties ({properties.length}/{MAX_PROPERTIES})
                      </h2>
                      <Button
                        onClick={handleAddProperty}
                        disabled={properties.length >= MAX_PROPERTIES}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Property
                      </Button>
                    </div>

                    {properties.map((property, index) => (
                      <PropertyForm
                        key={property.id}
                        property={property}
                        index={index}
                        onUpdate={handleUpdateProperty}
                        onRemove={() => handleRemoveProperty(property.id)}
                        onPrefill={() => handlePrefillProperty(property.id)}
                        canRemove={properties.length > MIN_PROPERTIES}
                      />
                    ))}
                  </div>

                  {/* Analyze Button */}
                  <div className="sticky bottom-4 z-10">
                    <Button
                      onClick={handleAnalyze}
                      disabled={!canAnalyze}
                      size="lg"
                      className="w-full shadow-lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Consulting AI Underwriters...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-2 h-5 w-5" />
                          Analyze Deals
                        </>
                      )}
                    </Button>
                    {error && (
                      <p className="mt-2 text-center text-sm text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ResultsPanel results={results} aiCommentary={aiCommentary} isLoading={isAnalyzing} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
