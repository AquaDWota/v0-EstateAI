"use client";

import React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MapPin,
  SlidersHorizontal,
  Home,
  Building2,
  Building,
  Search,
  X,
} from "lucide-react";
import { isValidNewEnglandZip, getZipAreaName } from "@/lib/mock-data";
import type { MapFilters, PropertyType } from "@/lib/map-types";

interface MapFiltersBarProps {
  zipCode: string;
  onZipChange: (zip: string) => void;
  onZipSubmit: () => void;
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

const PROPERTY_TYPE_OPTIONS: { type: PropertyType; label: string; icon: React.ReactNode }[] = [
  { type: "single-family", label: "Single Family", icon: <Home className="h-4 w-4" /> },
  { type: "multi-family", label: "Multi-Family", icon: <Building2 className="h-4 w-4" /> },
  { type: "condo", label: "Condo", icon: <Building className="h-4 w-4" /> },
  { type: "townhouse", label: "Townhouse", icon: <Home className="h-4 w-4" /> },
];

export function MapFiltersBar({
  zipCode,
  onZipChange,
  onZipSubmit,
  filters,
  onFiltersChange,
}: MapFiltersBarProps) {
  const [zipError, setZipError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isZipErrorOpen, setIsZipErrorOpen] = useState(false);

  const handleZipSubmit = () => {
    if (!zipCode || zipCode.length !== 5) {
      setZipError("Enter a 5-digit ZIP code");
      setIsZipErrorOpen(true);
      return;
    }
    if (!isValidNewEnglandZip(zipCode)) {
      setZipError("Enter a valid New England ZIP (MA, NH, ME, VT, CT, RI)");
      setIsZipErrorOpen(true);
      return;
    }

    setZipError(null);
    setIsZipErrorOpen(false);
    onZipSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleZipSubmit();
    }
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const togglePropertyType = (type: PropertyType) => {
    const newTypes = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((t) => t !== type)
      : [...filters.propertyTypes, type];
    onFiltersChange({ ...filters, propertyTypes: newTypes });
  };

  const activeFiltersCount =
    (filters.priceMin > 100000 ? 1 : 0) +
    (filters.priceMax < 2000000 ? 1 : 0) +
    (filters.bedroomsMin > 1 ? 1 : 0) +
    (filters.bathroomsMin > 1 ? 1 : 0) +
    (filters.propertyTypes.length > 0 && filters.propertyTypes.length < 4 ? 1 : 0);

  return (
    <div className="absolute left-4 top-4 z-10 flex w-96 flex-col gap-3">
      {/* ZIP Code Input */}
      <div className="flex items-center gap-2 rounded-lg bg-card p-2 shadow-lg">
        <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter ZIP Code"
          value={zipCode}
          onChange={(e) => onZipChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={5}
          className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={handleZipSubmit}
            size="sm"
            className="h-9 flex-shrink-0"
          >
            Search
          </Button>
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex-shrink-0 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Filters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs text-muted-foreground"
                    onClick={() =>
                      onFiltersChange({
                        priceMin: 100000,
                        priceMax: 2000000,
                        bedroomsMin: 1,
                        bathroomsMin: 1,
                        propertyTypes: [],
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-sm">Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={[filters.priceMin, filters.priceMax]}
                      min={100000}
                      max={2000000}
                      step={25000}
                      onValueChange={([min, max]) =>
                        onFiltersChange({ ...filters, priceMin: min, priceMax: max })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatPrice(filters.priceMin)}</span>
                    <span>{formatPrice(filters.priceMax)}</span>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="space-y-2">
                  <Label className="text-sm">Minimum Bedrooms</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        size="sm"
                        variant={filters.bedroomsMin === num ? "default" : "outline"}
                        className={filters.bedroomsMin !== num ? "bg-transparent" : ""}
                        onClick={() =>
                          onFiltersChange({ ...filters, bedroomsMin: num })
                        }
                      >
                        {num}+
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="space-y-2">
                  <Label className="text-sm">Minimum Bathrooms</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <Button
                        key={num}
                        size="sm"
                        variant={filters.bathroomsMin === num ? "default" : "outline"}
                        className={filters.bathroomsMin !== num ? "bg-transparent" : ""}
                        onClick={() =>
                          onFiltersChange({ ...filters, bathroomsMin: num })
                        }
                      >
                        {num}+
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Property Types */}
                <div className="space-y-2">
                  <Label className="text-sm">Property Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPE_OPTIONS.map(({ type, label, icon }) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={
                          filters.propertyTypes.includes(type) ? "default" : "outline"
                        }
                        className={`gap-1 ${!filters.propertyTypes.includes(type) ? "bg-transparent" : ""}`}
                        onClick={() => togglePropertyType(type)}
                      >
                        {icon}
                        {label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filters.propertyTypes.length === 0
                      ? "All types shown"
                      : `${filters.propertyTypes.length} selected`}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Error Message */}
        {zipError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <X className="h-4 w-4" />
            {zipError}
          </div>
        )}

        {/* Current Area Badge */}
        {zipCode.length === 5 && isValidNewEnglandZip(zipCode) && (
          <Badge
            variant="secondary"
            className="w-fit bg-card text-foreground shadow-md"
          >
            <MapPin className="mr-1 h-3 w-3" />
            {getZipAreaName(zipCode)}
          </Badge>
        )}
      </div>
    </div>
  );
}
