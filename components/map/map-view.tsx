import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { MapProperty, MapViewState } from "@/lib/map-types";
import "leaflet/dist/leaflet.css";
import { PropertyMarker } from './property-marker';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewProps {
  properties: MapProperty[];
  selectedIds: string[];
  onPropertyClick: (id: string) => void;
  viewState: MapViewState;
  onViewStateChange: (state: MapViewState) => void;
}

// Component to sync map view with viewState
function MapController({ viewState, onViewStateChange }: { viewState: MapViewState; onViewStateChange: (state: MapViewState) => void }) {
  const map = useMap();

  useEffect(() => {
    map.setView([viewState.center.lat, viewState.center.lng], viewState.zoom);
  }, [map, viewState.center.lat, viewState.center.lng, viewState.zoom]);

  useEffect(() => {
    const handleMove = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onViewStateChange({
        center: { lat: center.lat, lng: center.lng },
        zoom,
      });
    };

    map.on("moveend", handleMove);
    map.on("zoomend", handleMove);

    return () => {
      map.off("moveend", handleMove);
      map.off("zoomend", handleMove);
    };
  }, [map, onViewStateChange]);

  return null;
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

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <MapContainer
        center={[viewState.center.lat, viewState.center.lng]}
        zoom={viewState.zoom}
        style={{height: "100%", width: "100%"}}
        className="h-full w-full z-5 overflow-x-hidden overflow-y-hidden"
        zoomControl={false}
      >
        <MapController viewState={viewState} onViewStateChange={onViewStateChange} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
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
              isSelected={selectedIds.includes(property.id)}
              property={property}
              onClick={() => onPropertyClick(property.id)}
              style={{
                left: x,
                top: y,
                pointerEvents: 'auto',
              }}
            />
          )
        })}
      </div>
    </div>
  );
}
