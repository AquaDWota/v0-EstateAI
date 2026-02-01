"use client";

import React from "react"

import { cn } from "@/lib/utils";
import type { MapProperty } from "@/lib/map-types";

interface PropertyMarkerProps {
  property: MapProperty;
  isSelected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}

export function PropertyMarker({
  property,
  isSelected,
  onClick,
  style,
}: PropertyMarkerProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(price / 1000)}K`;
  };
return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-8",
        "group"
      )}
    >
      <div
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold shadow-lg transition-all",
          "hover:scale-110 hover:z-50",
          isSelected
            ? "bg-accent text-accent-foreground scale-110 z-50"
            : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {formatPrice(property.listPrice)}
      </div>
      
      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg">
          {property.bedrooms} bed / {property.bathrooms} bath
        </div>
      </div>
    </button>
  );
}
