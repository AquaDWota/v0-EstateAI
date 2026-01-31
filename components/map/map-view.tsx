"use client";

import React from "react"

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { PropertyMarker } from "./property-marker";
import type { MapProperty, MapViewState } from "@/lib/map-types";

interface MapViewProps {
  properties: MapProperty[];
  selectedIds: string[];
  onPropertyClick: (id: string) => void;
  viewState: MapViewState;
  onViewStateChange: (state: MapViewState) => void;
}

export function MapView({
  properties,
  selectedIds,
  onPropertyClick,
  viewState,
  onViewStateChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Convert lat/lng to pixel positions based on view state
  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      const scale = Math.pow(2, viewState.zoom);
      const worldSize = 256 * scale;

      // Mercator projection
      const x = ((lng + 180) / 360) * worldSize;
      const latRad = (lat * Math.PI) / 180;
      const y =
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        worldSize;

      // Center coordinates
      const centerX = ((viewState.center.lng + 180) / 360) * worldSize;
      const centerLatRad = (viewState.center.lat * Math.PI) / 180;
      const centerY =
        ((1 -
          Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) /
            Math.PI) /
          2) *
        worldSize;

      // Convert to screen coordinates
      const screenX = x - centerX + dimensions.width / 2;
      const screenY = y - centerY + dimensions.height / 2;

      return { x: screenX, y: screenY };
    },
    [viewState.center, viewState.zoom, dimensions]
  );

  // Pan/zoom handling
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const newZoom = Math.max(8, Math.min(18, viewState.zoom - e.deltaY * 0.002));
      onViewStateChange({ ...viewState, zoom: newZoom });
    },
    [viewState, onViewStateChange]
  );

  // Simple drag to pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startCenter = { ...viewState.center };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        // Convert pixel delta to lat/lng delta
        const scale = Math.pow(2, viewState.zoom);
        const metersPerPixel = (156543.03392 * Math.cos((startCenter.lat * Math.PI) / 180)) / scale;
        
        const lngDelta = (-dx * metersPerPixel) / 111320;
        const latDelta = (dy * metersPerPixel) / 110540;

        onViewStateChange({
          ...viewState,
          center: {
            lat: startCenter.lat + latDelta,
            lng: startCenter.lng + lngDelta,
          },
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [viewState, onViewStateChange]
  );

  // Generate map tiles URL
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Calculate visible tiles
  const tiles = useMemo(() => {
    const z = Math.floor(viewState.zoom);
    const numTiles = Math.pow(2, z);
    
    // Convert center to tile coordinates
    const centerTileX = ((viewState.center.lng + 180) / 360) * numTiles;
    const centerLatRad = (viewState.center.lat * Math.PI) / 180;
    const centerTileY =
      ((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2) *
      numTiles;

    // Calculate tiles needed based on container size
    const tilesX = Math.ceil(dimensions.width / 256) + 2;
    const tilesY = Math.ceil(dimensions.height / 256) + 2;
    
    const result: { x: number; y: number; z: number; key: string }[] = [];
    
    for (let dx = -Math.floor(tilesX / 2); dx <= Math.ceil(tilesX / 2); dx++) {
      for (let dy = -Math.floor(tilesY / 2); dy <= Math.ceil(tilesY / 2); dy++) {
        const tileX = Math.floor(centerTileX + dx);
        const tileY = Math.floor(centerTileY + dy);
        
        if (tileX >= 0 && tileX < numTiles && tileY >= 0 && tileY < numTiles) {
          result.push({
            x: tileX,
            y: tileY,
            z,
            key: `${z}-${tileX}-${tileY}`,
          });
        }
      }
    }
    
    return result;
  }, [viewState.center, viewState.zoom, dimensions]);

  // Calculate tile positions
  const getTilePosition = useCallback(
    (tile: { x: number; y: number; z: number }) => {
      const z = tile.z;
      const numTiles = Math.pow(2, z);
      const tileSize = 256 * Math.pow(2, viewState.zoom - z);
      
      const centerTileX = ((viewState.center.lng + 180) / 360) * numTiles;
      const centerLatRad = (viewState.center.lat * Math.PI) / 180;
      const centerTileY =
        ((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2) *
        numTiles;
      
      const offsetX = (tile.x - centerTileX) * tileSize + dimensions.width / 2;
      const offsetY = (tile.y - centerTileY) * tileSize + dimensions.height / 2;
      
      return { offsetX, offsetY, tileSize };
    },
    [viewState.center, viewState.zoom, dimensions]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-muted cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Map Tiles Layer */}
      <div className="absolute inset-0">
        {tiles.map((tile) => {
          const { offsetX, offsetY, tileSize } = getTilePosition(tile);
          
          const subdomains = ["a", "b", "c"];
          const subdomain = subdomains[(tile.x + tile.y) % 3];
          const url = tileUrl
            .replace("{s}", subdomain)
            .replace("{z}", String(tile.z))
            .replace("{x}", String(tile.x))
            .replace("{y}", String(tile.y));
          
          return (
            <img
              key={tile.key}
              src={url || "/placeholder.svg"}
              alt=""
              className="absolute select-none"
              style={{
                left: offsetX,
                top: offsetY,
                width: tileSize,
                height: tileSize,
              }}
              draggable={false}
            />
          );
        })}
      </div>

      {/* Property Markers Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {properties.map((property) => {
          const { x, y } = latLngToPixel(property.lat, property.lng);

          // Only render if in viewport
          if (x < -50 || x > dimensions.width + 50 || y < -50 || y > dimensions.height + 50) {
            return null;
          }

          return (
            <PropertyMarker
              key={property.id}
              property={property}
              isSelected={selectedIds.includes(property.id)}
              onClick={() => onPropertyClick(property.id)}
              style={{
                left: x,
                top: y,
                pointerEvents: "auto",
              }}
            />
          );
        })}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() =>
            onViewStateChange({
              ...viewState,
              zoom: Math.min(18, viewState.zoom + 1),
            })
          }
          className="flex h-10 w-10 items-center justify-center rounded-t-md bg-card text-foreground shadow-md hover:bg-secondary"
        >
          +
        </button>
        <button
          type="button"
          onClick={() =>
            onViewStateChange({
              ...viewState,
              zoom: Math.max(8, viewState.zoom - 1),
            })
          }
          className="flex h-10 w-10 items-center justify-center rounded-b-md bg-card text-foreground shadow-md hover:bg-secondary"
        >
          -
        </button>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground">
        Map data from OpenStreetMap
      </div>
    </div>
  );
}
