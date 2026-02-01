import { MapProperty, PropertyType } from "@/lib/map-types";

export function filterProperties(
  properties: MapProperty[],
  filters: {
    priceMin: number;
    priceMax: number;
    bedroomsMin: number;
    bathroomsMin: number;
    propertyTypes: PropertyType[];
  }
) {
  return properties.filter((p) => {
    //filter based on the given filters
    return (
      p.listPrice >= filters.priceMin &&
      p.listPrice <= filters.priceMax &&
      p.bedrooms >= filters.bedroomsMin &&
      p.bathrooms >= filters.bathroomsMin &&
      (filters.propertyTypes.length === 0 ||
        filters.propertyTypes.includes(p.propertyType)));
  });
}
