"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { MapProperty, MapViewState } from "@/lib/map-types";
import "leaflet/dist/leaflet.css";

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
  // Custom icon for selected properties
  const selectedIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[viewState.center.lat, viewState.center.lng]}
        zoom={viewState.zoom}
        style={{height: "100vh", width: "100%"}}
        className="h-full w-full z-5"
        zoomControl={true}
      >
        <MapController viewState={viewState} onViewStateChange={onViewStateChange} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.lat, property.lng]}
            icon={selectedIds.includes(property.id) ? selectedIcon : new L.Icon.Default()}
            eventHandlers={{
              click: () => onPropertyClick(property.id),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{property.address}</h3>
                <p className="text-sm">${property.listPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {property.bedrooms} bed, {property.bathrooms} bath
                </p>
                <p className="text-xs text-muted-foreground">{property.sqft} sqft</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
