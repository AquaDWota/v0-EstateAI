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
} from "@/lib/types";
import {
  DEFAULT_ASSUMPTIONS,
  generateMockProperty,
  createEmptyProperty,
} from "@/lib/mock-data";

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
    (id: string) => {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...generateMockProperty(zipCode, prev.indexOf(p)),
                id: p.id,
              }
            : p
        )
      );
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

      const data: AnalyzePropertiesResponse = await response.json();
      setResults(data);
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
              <ResultsPanel results={results} isLoading={isAnalyzing} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
