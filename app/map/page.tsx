"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { MapFiltersBar } from "@/components/map/map-filters";
import { MapView } from "@/components/map/map-view";
import { PropertyPanel } from "@/components/map/property-panel";
import { MapResultsPanel } from "@/components/map/results-panel";
import type { MapProperty, MapFilters, MapViewState } from "@/lib/map-types";
import { ZIP_COORDINATES, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/map-types";
import { filterProperties } from "@/lib/map-mock-data";
import type { PropertyInput, AnalyzePropertiesResponse } from "@/lib/types";
import { DEFAULT_ASSUMPTIONS } from "@/lib/mock-data";

export default function MapPage() {
  const [zipCode, setZipCode] = useState("");
  const [filters, setFilters] = useState<MapFilters>({
    priceMin: 100000,
    priceMax: 2000000,
    bedroomsMin: 1,
    bathroomsMin: 1,
    propertyTypes: [],
  });

  const [viewState, setViewState] = useState<MapViewState>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  const [allProperties, setAllProperties] = useState<MapProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalyzePropertiesResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  const fetchProperties = useCallback(
    async (params: Record<string, string | number | undefined>) => {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          query.set(key, String(value));
        }
      }
      setIsLoadingProperties(true);
      try {
        const response = await fetch(`/api/properties?${query.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to load properties");
        }
        const data: MapProperty[] = await response.json();
        setAllProperties(data);
      } catch (error) {
        console.error("Property load error:", error);
        setAllProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    },
    []
  );

  // Try to get user's location on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewState({
            center: { lat: latitude, lng: longitude },
            zoom: DEFAULT_ZOOM,
          });
          fetchProperties({ centerLat: latitude, centerLng: longitude, count: 200 });
        },
        () => {
          // If geolocation fails, use default (Boston)
          fetchProperties({ zipCode: "02134", count: 200 });
        }
      );
    } else {
      // Fallback to Boston
      fetchProperties({ zipCode: "02134", count: 200 });
    }
  }, [fetchProperties]);

  // Handle ZIP code submission
  const handleZipSubmit = useCallback(() => {
    const coords = ZIP_COORDINATES[zipCode];
    if (coords) {
      setViewState({
        center: { lat: coords.lat, lng: coords.lng },
        zoom: 13,
      });
      fetchProperties({ zipCode, count: 200 });
      setSelectedIds([]);
      setShowResults(false);
      setAnalysisResults(null);
    }
  }, [zipCode, fetchProperties]);

  // Filter properties
  const filteredProperties = filterProperties(allProperties, filters);

  // Handle property selection
  const handlePropertyClick = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pid) => pid !== id);
      }
      // Limit to 5 selections
      if (prev.length >= 5) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  // Get selected properties
  const selectedProperties = filteredProperties.filter((p) =>
    selectedIds.includes(p.id)
  );

  // Handle remove property
  const handleRemoveProperty = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((pid) => pid !== id));
  }, []);

  // Handle analysis
  const handleAnalyze = useCallback(async (properties: PropertyInput[]) => {
    setIsAnalyzing(true);
    setShowResults(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: properties[0]?.zipCode || "02134",
          globalAssumptions: DEFAULT_ASSUMPTIONS,
          properties,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setAnalysisResults(data);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <Header />
      <div className="relative flex-1 overflow-hidden">
        {/* Map View */}
        <MapView
          properties={filteredProperties}
          selectedIds={selectedIds}
          onPropertyClick={handlePropertyClick}
          viewState={viewState}
          onViewStateChange={setViewState}
        />

        {/* Filters Bar (top-left) */}
        <MapFiltersBar
          zipCode={zipCode}
          onZipChange={setZipCode}
          onZipSubmit={handleZipSubmit}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Property Panel (left side) */}
        <PropertyPanel
          selectedProperties={selectedProperties}
          onRemoveProperty={handleRemoveProperty}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />

        {/* Results Panel (right side) */}
        <MapResultsPanel
          results={analysisResults}
          isLoading={isAnalyzing}
          isVisible={showResults}
          onClose={() => setShowResults(false)}
        />

        {/* Property Count Badge */}
        {/* <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-card px-3 py-2 text-sm shadow-lg">
          <span className="font-medium text-foreground">
            {isLoadingProperties ? "Loading…" : filteredProperties.length}
          </span>{" "}
          <span className="text-muted-foreground">properties found</span>
        </div> */}
      </div>
    </div>
  );
}
