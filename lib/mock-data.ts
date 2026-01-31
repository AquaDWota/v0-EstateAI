import type { PropertyInput, GlobalAssumptions } from "./types";

// Mock property data based on ZIP code
const ZIP_BASED_DEFAULTS: Record<
  string,
  { avgListPrice: number; avgRent: number; avgTax: number; area: string }
> = {
  "01": {
    avgListPrice: 425000,
    avgRent: 2800,
    avgTax: 4500,
    area: "Massachusetts (Western)",
  },
  "02": {
    avgListPrice: 550000,
    avgRent: 3200,
    avgTax: 6000,
    area: "Massachusetts (Eastern)",
  },
  "03": {
    avgListPrice: 380000,
    avgRent: 2400,
    avgTax: 5200,
    area: "New Hampshire",
  },
  "04": { avgListPrice: 320000, avgRent: 1900, avgTax: 3800, area: "Maine" },
  "05": { avgListPrice: 350000, avgRent: 2100, avgTax: 4200, area: "Vermont" },
  "06": {
    avgListPrice: 480000,
    avgRent: 2900,
    avgTax: 5500,
    area: "Connecticut",
  },
};

const PROPERTY_NICKNAMES = [
  "Duplex on Elm",
  "Victorian Triple-Decker",
  "Colonial Multi-Family",
  "Renovated Brownstone",
  "Corner Lot Duplex",
  "Downtown Triplex",
  "Garden District Four-Plex",
  "Historic Row House",
];

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
];

export function generateMockProperty(
  zipCode: string,
  existingCount: number
): PropertyInput {
  const prefix = zipCode.substring(0, 2);
  const defaults = ZIP_BASED_DEFAULTS[prefix] || ZIP_BASED_DEFAULTS["02"];

  // Add some randomness
  const priceVariance = 0.8 + Math.random() * 0.4; // 80% to 120%
  const rentVariance = 0.85 + Math.random() * 0.3; // 85% to 115%

  const listPrice = Math.round(defaults.avgListPrice * priceVariance);
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  const streetName =
    STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];

  return {
    id: `prop-${Date.now()}-${existingCount}`,
    nickname:
      PROPERTY_NICKNAMES[existingCount % PROPERTY_NICKNAMES.length] ||
      `Property ${existingCount + 1}`,
    address: `${streetNumber} ${streetName}`,
    zipCode: zipCode,
    listPrice: listPrice,
    estimatedRent: Math.round(defaults.avgRent * rentVariance),
    propertyTaxPerYear: Math.round(defaults.avgTax * priceVariance),
    insurancePerYear: Math.round(listPrice * 0.004), // ~0.4% of price
    hoaPerYear: Math.random() > 0.7 ? Math.round(1200 + Math.random() * 2400) : 0,
    maintenancePerMonth: Math.round(100 + Math.random() * 150),
    utilitiesPerMonth: Math.random() > 0.5 ? Math.round(100 + Math.random() * 150) : 0,
    vacancyRatePercent: 5,
    downPaymentPercent: 25,
    interestRatePercent: 7.0,
    loanTermYears: 30,
    closingCosts: Math.round(listPrice * 0.03),
    renovationBudget: Math.round(Math.random() * 30000),
    arv: Math.round(listPrice * (1.05 + Math.random() * 0.15)),
  };
}

export function createEmptyProperty(
  zipCode: string,
  existingCount: number
): PropertyInput {
  return {
    id: `prop-${Date.now()}-${existingCount}`,
    nickname: `Property ${existingCount + 1}`,
    address: "",
    zipCode: zipCode,
    listPrice: 0,
    estimatedRent: 0,
    propertyTaxPerYear: 0,
    insurancePerYear: 0,
    hoaPerYear: 0,
    maintenancePerMonth: 0,
    utilitiesPerMonth: 0,
    vacancyRatePercent: 5,
    downPaymentPercent: 25,
    interestRatePercent: 7.0,
    loanTermYears: 30,
    closingCosts: 0,
    renovationBudget: 0,
    arv: 0,
  };
}

export const DEFAULT_ASSUMPTIONS: GlobalAssumptions = {
  defaultVacancyRatePercent: 5,
  defaultAppreciationRatePercent: 3,
  defaultMaintenancePercent: 1,
};

export function isValidNewEnglandZip(zip: string): boolean {
  if (!/^\d{5}$/.test(zip)) return false;
  const prefix = zip.substring(0, 2);
  return ["01", "02", "03", "04", "05", "06"].includes(prefix);
}

export function getZipAreaName(zip: string): string {
  const prefix = zip.substring(0, 2);
  return ZIP_BASED_DEFAULTS[prefix]?.area || "Unknown Area";
}
