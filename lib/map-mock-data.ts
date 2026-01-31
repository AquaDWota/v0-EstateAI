import type { MapProperty, PropertyType } from "./map-types";
import { ZIP_COORDINATES } from "./map-types";

const PROPERTY_TYPES: PropertyType[] = ["single-family", "multi-family", "condo", "townhouse"];

const STREET_NAMES = [
  "Elm Street",
  "Oak Avenue",
  "Maple Drive",
  "Washington Street",
  "Main Street",
  "Beacon Street",
  "Commonwealth Ave",
  "Park Street",
  "Pleasant Street",
  "School Street",
  "Church Street",
  "Highland Avenue",
  "Centre Street",
  "Summer Street",
  "Winter Street",
  "Spring Street",
  "Forest Avenue",
  "River Road",
  "Lake Street",
  "Hill Road",
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateRandomPropertyNearCoords(
  baseLat: number,
  baseLng: number,
  zipCode: string,
  index: number
): MapProperty {
  // Spread properties within ~2 miles of center
  const latOffset = randomInRange(-0.02, 0.02);
  const lngOffset = randomInRange(-0.02, 0.02);
  
  const propertyType = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
  const bedrooms = propertyType === "condo" ? Math.floor(randomInRange(1, 4)) : Math.floor(randomInRange(2, 6));
  const bathrooms = Math.floor(randomInRange(1, bedrooms));
  
  let basePriceMultiplier = 1;
  if (propertyType === "multi-family") basePriceMultiplier = 1.5;
  if (propertyType === "condo") basePriceMultiplier = 0.8;
  
  const sqft = Math.floor(randomInRange(800, 3500));
  const listPrice = Math.round(
    basePriceMultiplier * 
    sqft * 
    randomInRange(250, 600) // Price per sqft varies
  );
  
  const streetNumber = Math.floor(randomInRange(1, 500));
  const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  
  return {
    id: `map-prop-${zipCode}-${index}`,
    address: `${streetNumber} ${streetName}`,
    zipCode,
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset,
    listPrice,
    bedrooms,
    bathrooms,
    sqft,
    propertyType,
    yearBuilt: Math.floor(randomInRange(1920, 2024)),
    estimatedRent: Math.round(listPrice * 0.006), // ~0.6% of price as monthly rent
    propertyTaxPerYear: Math.round(listPrice * 0.012), // ~1.2% tax rate
    insurancePerYear: Math.round(listPrice * 0.004), // ~0.4% insurance
    hoaPerYear: propertyType === "condo" ? Math.round(randomInRange(2400, 7200)) : 0,
  };
}

export function generatePropertiesForZip(zipCode: string, count: number = 15): MapProperty[] {
  const coords = ZIP_COORDINATES[zipCode];
  
  if (!coords) {
    // For unknown ZIP codes, generate around Boston
    return Array.from({ length: count }, (_, i) =>
      generateRandomPropertyNearCoords(42.3601, -71.0589, zipCode, i)
    );
  }
  
  return Array.from({ length: count }, (_, i) =>
    generateRandomPropertyNearCoords(coords.lat, coords.lng, zipCode, i)
  );
}

export function generatePropertiesForArea(
  centerLat: number,
  centerLng: number,
  count: number = 20
): MapProperty[] {
  // Find nearest known ZIP
  let nearestZip = "02134";
  let minDistance = Infinity;
  
  for (const [zip, coords] of Object.entries(ZIP_COORDINATES)) {
    const distance = Math.sqrt(
      Math.pow(coords.lat - centerLat, 2) + Math.pow(coords.lng - centerLng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestZip = zip;
    }
  }
  
  return Array.from({ length: count }, (_, i) =>
    generateRandomPropertyNearCoords(centerLat, centerLng, nearestZip, i)
  );
}

export function filterProperties(
  properties: MapProperty[],
  filters: {
    priceMin: number;
    priceMax: number;
    bedroomsMin: number;
    bathroomsMin: number;
    propertyTypes: PropertyType[];
  }
): MapProperty[] {
  return properties.filter((p) => {
    if (p.listPrice < filters.priceMin || p.listPrice > filters.priceMax) return false;
    if (p.bedrooms < filters.bedroomsMin) return false;
    if (p.bathrooms < filters.bathroomsMin) return false;
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(p.propertyType)) {
      return false;
    }
    return true;
  });
}
