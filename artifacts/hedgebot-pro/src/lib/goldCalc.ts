import { fmt } from './format';

export interface GoldInput {
  spotUSD: number;
  usdRate: number;
  customGrams?: number;
  purity?: number; // 1.0 for 24K, 0.9167 for 22K, etc.
  purityLabel?: string;
}

export interface GoldTableRow {
  label: string;
  grams: number;
  usd: number;
  idr: number;
}

export interface GoldResult {
  perGramUSD: number;
  perGramIDR: number;
  perTroyOzUSD: number;
  perTroyOzIDR: number;
  table: GoldTableRow[];
  customResult?: {
    grams: number;
    purity: number;
    purityLabel: string;
    totalUSD: number;
    totalIDR: number;
    formula: string;
  };
  allParams: GoldOutputParam[];
}

export interface GoldOutputParam {
  category: string;
  label: string;
  value: string;
  subValue?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gold' | 'default';
}

const TROY_OZ_TO_GRAM = 31.1034768;

export const PURITIES: { label: string; value: number }[] = [
  { label: '24K (999)', value: 0.999 },
  { label: '22K (916)', value: 0.9167 },
  { label: '18K (750)', value: 0.75 },
  { label: '14K (585)', value: 0.585 },
  { label: '9K (375)', value: 0.375 },
];

export const TABLE_WEIGHTS: { label: string; grams: number }[] = [
  { label: 'Per Miligram', grams: 0.001 },
  { label: 'Per Gram', grams: 1 },
  { label: '5 Gram', grams: 5 },
  { label: '10 Gram', grams: 10 },
  { label: '1 Tola (India)', grams: 11.664 },
  { label: 'Half Troy Oz', grams: 15.5517 },
  { label: '1 Troy Oz', grams: 31.1035 },
  { label: '50 Gram', grams: 50 },
  { label: '100 Gram', grams: 100 },
  { label: '500 Gram', grams: 500 },
  { label: '1 Kilogram', grams: 1000 },
  { label: '1 Tael (HK)', grams: 37.429 },
  { label: '5 Kilogram', grams: 5000 },
  { label: '10 Kilogram', grams: 10000 },
];

export function calculateGold(inp: GoldInput): GoldResult {
  const perGramUSD = inp.spotUSD / TROY_OZ_TO_GRAM;
  const perGramIDR = perGramUSD * inp.usdRate;
  const perTroyOzUSD = inp.spotUSD;
  const perTroyOzIDR = inp.spotUSD * inp.usdRate;

  const table: GoldTableRow[] = TABLE_WEIGHTS.map(({ label, grams }) => ({
    label,
    grams,
    usd: grams * perGramUSD,
    idr: grams * perGramIDR,
  }));

  let customResult: GoldResult['customResult'];
  if (inp.customGrams !== undefined && inp.purity !== undefined) {
    const totalUSD = inp.customGrams * perGramUSD * inp.purity;
    const totalIDR = totalUSD * inp.usdRate;
    customResult = {
      grams: inp.customGrams,
      purity: inp.purity,
      purityLabel: inp.purityLabel ?? '24K',
      totalUSD,
      totalIDR,
      formula: `${fmt(inp.customGrams)}g × $${fmt(perGramUSD)}/g × ${(inp.purity * 100).toFixed(1)}% = $${fmt(totalUSD)}`,
    };
  }

  // Comprehensive output params
  const allParams: GoldOutputParam[] = [
    { category: 'Spot Prices', label: 'Spot Price (Troy Oz)', value: `$${fmt(perTroyOzUSD)}`, subValue: `Rp ${Math.round(perTroyOzIDR).toLocaleString('id-ID')}`, color: 'gold' },
    { category: 'Spot Prices', label: 'Price Per Gram (24K)', value: `$${fmt(perGramUSD)}`, subValue: `Rp ${Math.round(perGramIDR).toLocaleString('id-ID')}`, color: 'gold' },
    { category: 'Spot Prices', label: 'USD/IDR Rate', value: `Rp ${Math.round(inp.usdRate).toLocaleString('id-ID')}` },
    { category: 'Spot Prices', label: 'Troy Oz → Gram', value: '31.1035 g/oz' },
    { category: 'Spot Prices', label: 'Price Per Tola', value: `$${fmt(11.664 * perGramUSD)}`, subValue: `Rp ${Math.round(11.664 * perGramIDR).toLocaleString('id-ID')}` },
    { category: 'Spot Prices', label: 'Price Per Tael', value: `$${fmt(37.429 * perGramUSD)}`, subValue: `Rp ${Math.round(37.429 * perGramIDR).toLocaleString('id-ID')}` },

    { category: 'Purity Comparison', label: '24K (999)', value: `$${fmt(perGramUSD * 0.999)}/g`, subValue: `Rp ${Math.round(perGramIDR * 0.999).toLocaleString('id-ID')}/g`, color: 'gold' },
    { category: 'Purity Comparison', label: '22K (916)', value: `$${fmt(perGramUSD * 0.9167)}/g`, subValue: `Rp ${Math.round(perGramIDR * 0.9167).toLocaleString('id-ID')}/g` },
    { category: 'Purity Comparison', label: '18K (750)', value: `$${fmt(perGramUSD * 0.75)}/g`, subValue: `Rp ${Math.round(perGramIDR * 0.75).toLocaleString('id-ID')}/g` },
    { category: 'Purity Comparison', label: '14K (585)', value: `$${fmt(perGramUSD * 0.585)}/g`, subValue: `Rp ${Math.round(perGramIDR * 0.585).toLocaleString('id-ID')}/g` },
    { category: 'Purity Comparison', label: '9K (375)', value: `$${fmt(perGramUSD * 0.375)}/g`, subValue: `Rp ${Math.round(perGramIDR * 0.375).toLocaleString('id-ID')}/g` },

    { category: 'Volume Prices (USD)', label: '1g', value: `$${fmt(perGramUSD)}`, color: 'default' },
    { category: 'Volume Prices (USD)', label: '10g', value: `$${fmt(10 * perGramUSD)}` },
    { category: 'Volume Prices (USD)', label: '100g', value: `$${fmt(100 * perGramUSD)}` },
    { category: 'Volume Prices (USD)', label: '1kg', value: `$${fmt(1000 * perGramUSD)}`, color: 'green' },
    { category: 'Volume Prices (USD)', label: '5kg', value: `$${fmt(5000 * perGramUSD)}`, color: 'green' },
    { category: 'Volume Prices (USD)', label: '10kg', value: `$${fmt(10000 * perGramUSD)}`, color: 'green' },
    { category: 'Volume Prices (USD)', label: '1 Troy Oz', value: `$${fmt(perTroyOzUSD)}`, color: 'yellow' },

    { category: 'Volume Prices (IDR)', label: '1g', value: `Rp ${Math.round(perGramIDR).toLocaleString('id-ID')}` },
    { category: 'Volume Prices (IDR)', label: '10g', value: `Rp ${Math.round(10 * perGramIDR).toLocaleString('id-ID')}` },
    { category: 'Volume Prices (IDR)', label: '100g', value: `Rp ${Math.round(100 * perGramIDR).toLocaleString('id-ID')}` },
    { category: 'Volume Prices (IDR)', label: '1kg', value: `Rp ${Math.round(1000 * perGramIDR).toLocaleString('id-ID')}`, color: 'green' },
    { category: 'Volume Prices (IDR)', label: '5kg', value: `Rp ${Math.round(5000 * perGramIDR).toLocaleString('id-ID')}`, color: 'green' },
    { category: 'Volume Prices (IDR)', label: '10kg', value: `Rp ${Math.round(10000 * perGramIDR).toLocaleString('id-ID')}`, color: 'green' },
    { category: 'Volume Prices (IDR)', label: '1 Troy Oz', value: `Rp ${Math.round(perTroyOzIDR).toLocaleString('id-ID')}`, color: 'yellow' },
  ];

  return { perGramUSD, perGramIDR, perTroyOzUSD, perTroyOzIDR, table, customResult, allParams };
}
