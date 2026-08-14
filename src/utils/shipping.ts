import { RateBand, CountryRateBands } from '../types';

export const DEFAULT_RATE_BANDS: CountryRateBands = {
  'USA': [
    { id: 'usa-1', minWeight: 0, maxWeight: 0.5, rate: 1150 },
    { id: 'usa-2', minWeight: 0.5, maxWeight: 2, rate: 996 },
    { id: 'usa-3', minWeight: 2, maxWeight: 5, rate: 920 },
    { id: 'usa-4', minWeight: 5, maxWeight: 10, rate: 850 },
    { id: 'usa-5', minWeight: 10, maxWeight: 999, rate: 780 },
  ],
  'UK': [
    { id: 'uk-1', minWeight: 0, maxWeight: 0.5, rate: 980 },
    { id: 'uk-2', minWeight: 0.5, maxWeight: 2, rate: 830 },
    { id: 'uk-3', minWeight: 2, maxWeight: 5, rate: 760 },
    { id: 'uk-4', minWeight: 5, maxWeight: 10, rate: 700 },
    { id: 'uk-5', minWeight: 10, maxWeight: 999, rate: 640 },
  ],
  'Canada': [
    { id: 'can-1', minWeight: 0, maxWeight: 0.5, rate: 1080 },
    { id: 'can-2', minWeight: 0.5, maxWeight: 2, rate: 913 },
    { id: 'can-3', minWeight: 2, maxWeight: 5, rate: 840 },
    { id: 'can-4', minWeight: 5, maxWeight: 10, rate: 780 },
    { id: 'can-5', minWeight: 10, maxWeight: 999, rate: 720 },
  ],
  'Australia': [
    { id: 'aus-1', minWeight: 0, maxWeight: 0.5, rate: 1250 },
    { id: 'aus-2', minWeight: 0.5, maxWeight: 2, rate: 1079 },
    { id: 'aus-3', minWeight: 2, maxWeight: 5, rate: 990 },
    { id: 'aus-4', minWeight: 5, maxWeight: 10, rate: 910 },
    { id: 'aus-5', minWeight: 10, maxWeight: 999, rate: 840 },
  ],
  'UAE': [
    { id: 'uae-1', minWeight: 0, maxWeight: 0.5, rate: 780 },
    { id: 'uae-2', minWeight: 0.5, maxWeight: 2, rate: 664 },
    { id: 'uae-3', minWeight: 2, maxWeight: 5, rate: 600 },
    { id: 'uae-4', minWeight: 5, maxWeight: 10, rate: 550 },
    { id: 'uae-5', minWeight: 10, maxWeight: 999, rate: 500 },
  ],
  'Germany': [
    { id: 'ger-1', minWeight: 0, maxWeight: 0.5, rate: 890 },
    { id: 'ger-2', minWeight: 0.5, maxWeight: 2, rate: 747 },
    { id: 'ger-3', minWeight: 2, maxWeight: 5, rate: 680 },
    { id: 'ger-4', minWeight: 5, maxWeight: 10, rate: 620 },
    { id: 'ger-5', minWeight: 10, maxWeight: 999, rate: 570 },
  ],
  'Singapore': [
    { id: 'sg-1', minWeight: 0, maxWeight: 0.5, rate: 700 },
    { id: 'sg-2', minWeight: 0.5, maxWeight: 2, rate: 581 },
    { id: 'sg-3', minWeight: 2, maxWeight: 5, rate: 520 },
    { id: 'sg-4', minWeight: 5, maxWeight: 10, rate: 470 },
    { id: 'sg-5', minWeight: 10, maxWeight: 999, rate: 420 },
  ],
  'India': [
    { id: 'ind-1', minWeight: 0, maxWeight: 0.5, rate: 500 },
    { id: 'ind-2', minWeight: 0.5, maxWeight: 2, rate: 415 },
    { id: 'ind-3', minWeight: 2, maxWeight: 5, rate: 360 },
    { id: 'ind-4', minWeight: 5, maxWeight: 10, rate: 320 },
    { id: 'ind-5', minWeight: 10, maxWeight: 999, rate: 280 },
  ],
};

export interface ShippingCalculationParams {
  country: string;
  weightKg: number;
  method?: string;
  rates?: Record<string, number>;
  rateBands?: CountryRateBands;
  discounts?: Record<string, number>;
}

export interface ShippingCalculationResult {
  baseRatePerKg: number;
  appliedBandLabel: string;
  matchedBand?: RateBand;
  isFlatRate: boolean;
  rawShippingCost: number;
  discountPercent: number;
  discountAmount: number;
  finalPriceInr: number;
  deliveryTime: string;
}

export function calculateShippingCost({
  country,
  weightKg,
  method = 'Express',
  rates,
  rateBands,
  discounts,
}: ShippingCalculationParams): ShippingCalculationResult {
  const normWeight = Math.max(0.1, Number(weightKg) || 1);
  const countryBands = rateBands?.[country] || DEFAULT_RATE_BANDS[country];
  let ratePerKg = Number(rates?.[country]) || 996;
  let isFlatRate = false;
  let appliedBandLabel = 'Base Rate';
  let matchedBand: RateBand | undefined = undefined;

  if (countryBands && countryBands.length > 0) {
    const sorted = [...countryBands].sort((a, b) => a.minWeight - b.minWeight);
    
    // Match band
    const found = sorted.find(b => normWeight >= b.minWeight && normWeight <= b.maxWeight)
      || (normWeight > sorted[sorted.length - 1].maxWeight ? sorted[sorted.length - 1] : sorted[0]);

    if (found) {
      matchedBand = found;
      ratePerKg = Number(found.rate) || ratePerKg;
      isFlatRate = Boolean(found.isFlat);
      appliedBandLabel = found.maxWeight >= 999 
        ? `${found.minWeight}+ kg` 
        : `${found.minWeight}–${found.maxWeight} kg`;
    }
  }

  const isStandard = method.toLowerCase().includes('standard');
  const methodMultiplier = isStandard ? 0.7 : 1.0;

  const rawShippingCost = isFlatRate ? ratePerKg * methodMultiplier : normWeight * ratePerKg * methodMultiplier;
  const discountPercent = Number(discounts?.[country]) || 0;
  const discountAmount = rawShippingCost * (discountPercent / 100);
  const finalPriceInr = Math.max(0, Math.round(rawShippingCost - discountAmount));
  const deliveryTime = isStandard ? '10–14 business days' : '5–7 business days';

  return {
    baseRatePerKg: ratePerKg,
    appliedBandLabel,
    matchedBand,
    isFlatRate,
    rawShippingCost,
    discountPercent,
    discountAmount,
    finalPriceInr,
    deliveryTime,
  };
}
