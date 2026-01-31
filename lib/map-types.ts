export type PropertyType = "single-family" | "multi-family" | "condo" | "townhouse";

export type MapProperty = {
  id: string;
  address: string;
  zipCode: string;
  lat: number;
  lng: number;
  listPrice: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: PropertyType;
  yearBuilt: number;
  estimatedRent: number;
  propertyTaxPerYear: number;
  insurancePerYear: number;
  hoaPerYear: number;
  imageUrl?: string;
};

export type MapFilters = {
  priceMin: number;
  priceMax: number;
  bedroomsMin: number;
  bathroomsMin: number;
  propertyTypes: PropertyType[];
};

export type MapViewState = {
  center: { lat: number; lng: number };
  zoom: number;
};

// ZIP code coordinates for New England
export const ZIP_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  "02134": { lat: 42.3554, lng: -71.1317, name: "Allston, MA" },
  "02138": { lat: 42.3770, lng: -71.1167, name: "Cambridge, MA" },
  "02139": { lat: 42.3647, lng: -71.1042, name: "Cambridge, MA" },
  "02140": { lat: 42.3932, lng: -71.1322, name: "Cambridge, MA" },
  "02115": { lat: 42.3424, lng: -71.0878, name: "Boston, MA" },
  "02116": { lat: 42.3503, lng: -71.0758, name: "Boston, MA" },
  "02118": { lat: 42.3388, lng: -71.0726, name: "Boston, MA" },
  "02119": { lat: 42.3223, lng: -71.0855, name: "Roxbury, MA" },
  "02120": { lat: 42.3328, lng: -71.0971, name: "Roxbury, MA" },
  "02121": { lat: 42.3067, lng: -71.0855, name: "Dorchester, MA" },
  "02122": { lat: 42.2865, lng: -71.0508, name: "Dorchester, MA" },
  "02124": { lat: 42.2879, lng: -71.0726, name: "Dorchester, MA" },
  "02125": { lat: 42.3178, lng: -71.0508, name: "Dorchester, MA" },
  "02126": { lat: 42.2723, lng: -71.0971, name: "Mattapan, MA" },
  "02127": { lat: 42.3373, lng: -71.0358, name: "South Boston, MA" },
  "02128": { lat: 42.3647, lng: -71.0258, name: "East Boston, MA" },
  "02129": { lat: 42.3817, lng: -71.0626, name: "Charlestown, MA" },
  "02130": { lat: 42.3092, lng: -71.1147, name: "Jamaica Plain, MA" },
  "02131": { lat: 42.2835, lng: -71.1267, name: "Roslindale, MA" },
  "02132": { lat: 42.2794, lng: -71.1597, name: "West Roxbury, MA" },
  "02135": { lat: 42.3505, lng: -71.1527, name: "Brighton, MA" },
  "02136": { lat: 42.2538, lng: -71.1287, name: "Hyde Park, MA" },
  "02141": { lat: 42.3749, lng: -71.0837, name: "Cambridge, MA" },
  "02142": { lat: 42.3647, lng: -71.0837, name: "Cambridge, MA" },
  "02143": { lat: 42.3817, lng: -71.1017, name: "Somerville, MA" },
  "02144": { lat: 42.4003, lng: -71.1227, name: "Somerville, MA" },
  "02145": { lat: 42.3932, lng: -71.0837, name: "Somerville, MA" },
  "02148": { lat: 42.4256, lng: -71.0508, name: "Malden, MA" },
  "02149": { lat: 42.4085, lng: -71.0558, name: "Everett, MA" },
  "02150": { lat: 42.3932, lng: -71.0358, name: "Chelsea, MA" },
  "02151": { lat: 42.4087, lng: -70.9893, name: "Revere, MA" },
  "02152": { lat: 42.3735, lng: -70.9744, name: "Winthrop, MA" },
  "02155": { lat: 42.4188, lng: -71.1067, name: "Medford, MA" },
  "02163": { lat: 42.3770, lng: -71.1167, name: "Harvard, MA" },
  "01801": { lat: 42.4871, lng: -71.1967, name: "Woburn, MA" },
  "01810": { lat: 42.6545, lng: -71.1372, name: "Andover, MA" },
  "01830": { lat: 42.7796, lng: -71.0773, name: "Haverhill, MA" },
  "01840": { lat: 42.7070, lng: -71.1632, name: "Lawrence, MA" },
  "01841": { lat: 42.7070, lng: -71.1632, name: "Lawrence, MA" },
  "01843": { lat: 42.7070, lng: -71.1632, name: "Lawrence, MA" },
  "01850": { lat: 42.6334, lng: -71.3162, name: "Lowell, MA" },
  "01851": { lat: 42.6334, lng: -71.3162, name: "Lowell, MA" },
  "01852": { lat: 42.6334, lng: -71.3162, name: "Lowell, MA" },
  "01854": { lat: 42.6334, lng: -71.3162, name: "Lowell, MA" },
  "01880": { lat: 42.4871, lng: -71.0747, name: "Wakefield, MA" },
  "01890": { lat: 42.4526, lng: -71.2260, name: "Winchester, MA" },
  "03031": { lat: 42.8651, lng: -71.6084, name: "Amherst, NH" },
  "03060": { lat: 42.7654, lng: -71.4676, name: "Nashua, NH" },
  "03101": { lat: 42.9956, lng: -71.4548, name: "Manchester, NH" },
  "03102": { lat: 42.9956, lng: -71.4548, name: "Manchester, NH" },
  "03103": { lat: 42.9956, lng: -71.4548, name: "Manchester, NH" },
  "03104": { lat: 42.9956, lng: -71.4548, name: "Manchester, NH" },
  "03301": { lat: 43.2081, lng: -71.5376, name: "Concord, NH" },
  "03820": { lat: 43.1979, lng: -70.8737, name: "Dover, NH" },
  "03801": { lat: 43.0718, lng: -70.7626, name: "Portsmouth, NH" },
  "04101": { lat: 43.6591, lng: -70.2568, name: "Portland, ME" },
  "04102": { lat: 43.6591, lng: -70.2568, name: "Portland, ME" },
  "04103": { lat: 43.6591, lng: -70.2568, name: "Portland, ME" },
  "04210": { lat: 44.1004, lng: -70.2148, name: "Auburn, ME" },
  "04240": { lat: 44.1004, lng: -70.0846, name: "Lewiston, ME" },
  "04401": { lat: 44.8012, lng: -68.7778, name: "Bangor, ME" },
  "05401": { lat: 44.4759, lng: -73.2121, name: "Burlington, VT" },
  "05402": { lat: 44.4759, lng: -73.2121, name: "Burlington, VT" },
  "05403": { lat: 44.4759, lng: -73.2121, name: "South Burlington, VT" },
  "05404": { lat: 44.4906, lng: -73.1846, name: "Winooski, VT" },
  "05452": { lat: 44.5411, lng: -73.0996, name: "Essex Junction, VT" },
  "05701": { lat: 43.6106, lng: -72.9726, name: "Rutland, VT" },
  "05753": { lat: 44.0153, lng: -73.1674, name: "Middlebury, VT" },
  "05301": { lat: 42.8509, lng: -72.5579, name: "Brattleboro, VT" },
  "06010": { lat: 41.6743, lng: -72.9407, name: "Bristol, CT" },
  "06032": { lat: 41.7182, lng: -72.8268, name: "Farmington, CT" },
  "06040": { lat: 41.7758, lng: -72.5215, name: "Manchester, CT" },
  "06051": { lat: 41.6693, lng: -72.7823, name: "New Britain, CT" },
  "06103": { lat: 41.7658, lng: -72.6734, name: "Hartford, CT" },
  "06105": { lat: 41.7658, lng: -72.6734, name: "Hartford, CT" },
  "06106": { lat: 41.7658, lng: -72.6734, name: "Hartford, CT" },
  "06108": { lat: 41.7837, lng: -72.6206, name: "East Hartford, CT" },
  "06111": { lat: 41.6870, lng: -72.7307, name: "Newington, CT" },
  "06114": { lat: 41.7307, lng: -72.7007, name: "Hartford, CT" },
  "06118": { lat: 41.7307, lng: -72.6206, name: "East Hartford, CT" },
  "06460": { lat: 41.2307, lng: -73.0551, name: "Milford, CT" },
  "06470": { lat: 41.4148, lng: -73.3107, name: "Newtown, CT" },
  "06510": { lat: 41.3083, lng: -72.9279, name: "New Haven, CT" },
  "06511": { lat: 41.3083, lng: -72.9279, name: "New Haven, CT" },
  "06512": { lat: 41.2707, lng: -72.8807, name: "East Haven, CT" },
  "06513": { lat: 41.3207, lng: -72.8507, name: "New Haven, CT" },
  "06515": { lat: 41.3207, lng: -72.9607, name: "New Haven, CT" },
  "06516": { lat: 41.2707, lng: -72.9607, name: "West Haven, CT" },
  "06604": { lat: 41.1865, lng: -73.1951, name: "Bridgeport, CT" },
  "06605": { lat: 41.1565, lng: -73.2151, name: "Bridgeport, CT" },
  "06606": { lat: 41.2065, lng: -73.2051, name: "Bridgeport, CT" },
  "06607": { lat: 41.1765, lng: -73.1751, name: "Bridgeport, CT" },
  "06608": { lat: 41.1965, lng: -73.1751, name: "Bridgeport, CT" },
  "06610": { lat: 41.2265, lng: -73.2251, name: "Bridgeport, CT" },
  "06702": { lat: 41.5582, lng: -73.0515, name: "Waterbury, CT" },
  "06704": { lat: 41.5782, lng: -73.0315, name: "Waterbury, CT" },
  "06705": { lat: 41.5382, lng: -73.0215, name: "Waterbury, CT" },
  "06706": { lat: 41.5382, lng: -73.0615, name: "Waterbury, CT" },
  "06708": { lat: 41.5682, lng: -73.0715, name: "Waterbury, CT" },
  "06810": { lat: 41.3948, lng: -73.4540, name: "Danbury, CT" },
  "06820": { lat: 41.0534, lng: -73.4690, name: "Darien, CT" },
  "06830": { lat: 41.0262, lng: -73.6288, name: "Greenwich, CT" },
  "06840": { lat: 41.1476, lng: -73.4973, name: "New Canaan, CT" },
  "06850": { lat: 41.1176, lng: -73.4073, name: "Norwalk, CT" },
  "06851": { lat: 41.1376, lng: -73.4273, name: "Norwalk, CT" },
  "06854": { lat: 41.0876, lng: -73.4073, name: "Norwalk, CT" },
  "06855": { lat: 41.0676, lng: -73.3873, name: "Norwalk, CT" },
  "06880": { lat: 41.1340, lng: -73.3579, name: "Westport, CT" },
  "06901": { lat: 41.0534, lng: -73.5387, name: "Stamford, CT" },
  "06902": { lat: 41.0534, lng: -73.5587, name: "Stamford, CT" },
  "06903": { lat: 41.1034, lng: -73.5587, name: "Stamford, CT" },
  "06905": { lat: 41.0734, lng: -73.5187, name: "Stamford, CT" },
  "06906": { lat: 41.0634, lng: -73.5387, name: "Stamford, CT" },
  "06907": { lat: 41.0834, lng: -73.5487, name: "Stamford, CT" },
};

// Default center (Boston area)
export const DEFAULT_CENTER = { lat: 42.3601, lng: -71.0589 };
export const DEFAULT_ZOOM = 12;
