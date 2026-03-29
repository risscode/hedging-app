import { fmt, fmtIDR, fmtUSD } from './format';

export interface HedgeInput {
  pair: string;
  entryLong: number;
  slLong: number;
  exposure: number;
  leverage: number;
  entryShort: number;
  slShort: number;
  tpShort: number;
  exposureShort: number;
  hedgeLeverage: number;
  triggerRR: number;
  tp1R: number;
  tp2R: number;
  tp3R: number;
  tp1Close: number; // percent
  tp2Close: number;
  accountBalance: number;
  riskPct: number;
  usdtRate: number;
}

export interface HedgeResult {
  // Core metrics
  oneR: number;
  oneRPct: number;
  marginLong: number;
  marginShort: number;
  totalMargin: number;
  posSizeCoins: number;
  posSizeShortCoins: number;
  liqPrice: number;
  liqPriceShort: number;
  hedgeTrigger: number;

  // TP levels
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;

  // Risk metrics
  maxLossSL: number;
  maxLossWithHedge: number;
  hedgeEfficiency: number;
  rrRatioTP2: number;
  roiTP2: number;
  balanceRisk: number;

  // Scenarios
  bearScenario: ScenarioResult;
  bullScenario: ScenarioResult;
  fullBullScenario: ScenarioResult;

  // Partial close
  partialClose: PartialCloseRow[];

  // Price level map
  priceLevels: PriceLevel[];

  // Waterfall
  waterfall: WaterfallData;

  // Ticker items
  tickerItems: TickerItem[];

  // Pseudocode
  pseudocode: string;

  // Output params (all labeled)
  allParams: OutputParam[];
}

export interface ScenarioResult {
  name: string;
  pnlLong: number;
  pnlShort: number;
  net: number;
  netIDR: number;
  hedgeCostSavings: number;
  withoutHedge: number;
  note: string;
}

export interface PartialCloseRow {
  tp: string;
  price: number;
  pctClose: number;
  qtyCoins: number;
  realizedPnl: number;
  realizedPnlIDR: number;
  remaining: number;
}

export interface PriceLevel {
  label: string;
  price: number;
  priceIDR: number;
  distPct: number;
  pnlImpact: number;
  action: string;
  type: 'tp' | 'entry' | 'sl' | 'hedge' | 'liq';
}

export interface WaterfallData {
  grossLoss: number;
  hedgeOffset: number;
  netLoss: number;
  efficiency: number;
}

export interface TickerItem {
  label: string;
  value: string;
}

export interface OutputParam {
  category: string;
  label: string;
  value: string;
  subValue?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'default';
}

export function calculateHedge(inp: HedgeInput): HedgeResult {
  const { usdtRate } = inp;

  // Core calculations
  const oneR = Math.abs(inp.entryLong - inp.slLong) / inp.entryLong * inp.exposure;
  const oneRPct = Math.abs(inp.entryLong - inp.slLong) / inp.entryLong * 100;
  const marginLong = inp.exposure / inp.leverage;
  const marginShort = inp.exposureShort / inp.hedgeLeverage;
  const totalMargin = marginLong + marginShort;
  const posSizeCoins = inp.exposure / inp.entryLong;
  const posSizeShortCoins = inp.exposureShort / inp.entryShort;

  // Liquidation price (simplified, for isolated margin)
  const liqPrice = inp.entryLong * (1 - 1 / inp.leverage + 0.004);
  const liqPriceShort = inp.entryShort * (1 + 1 / inp.hedgeLeverage - 0.004);

  // Hedge trigger
  const hedgeTrigger = inp.entryLong - (inp.triggerRR * oneR / posSizeCoins);

  // TP levels (in R)
  const slDistPerCoin = Math.abs(inp.entryLong - inp.slLong);
  const tp1Price = inp.entryLong + inp.tp1R * slDistPerCoin;
  const tp2Price = inp.entryLong + inp.tp2R * slDistPerCoin;
  const tp3Price = inp.entryLong + inp.tp3R * slDistPerCoin;

  // P&L functions (exposure-based linear)
  const pnlLong = (exitPrice: number) => inp.exposure * (exitPrice - inp.entryLong) / inp.entryLong;
  const pnlShort = (exitPrice: number) => inp.exposureShort * (inp.entryShort - exitPrice) / inp.entryShort;

  // Risk metrics
  const maxLossSL = pnlLong(inp.slLong); // negative
  const hedgeAtSL = pnlShort(inp.slLong);
  const maxLossWithHedge = maxLossSL + hedgeAtSL;
  const hedgeEfficiency = Math.abs(hedgeAtSL) / Math.abs(maxLossSL) * 100;
  const rrRatioTP2 = Math.abs(pnlLong(tp2Price)) / Math.abs(maxLossSL);
  const roiTP2 = pnlLong(tp2Price) / totalMargin * 100;
  const balanceRisk = Math.abs(maxLossWithHedge) / inp.accountBalance * 100;

  // Scenarios
  const bearScenario: ScenarioResult = buildScenario('Bear (SL Hit)', inp.slLong, inp, pnlLong, pnlShort, usdtRate);
  const bullScenario: ScenarioResult = buildScenario('Bull (TP2 Hit)', tp2Price, inp, pnlLong, pnlShort, usdtRate);
  const fullBullScenario: ScenarioResult = buildScenario('Full Bull (TP3 Hit)', tp3Price, inp, pnlLong, pnlShort, usdtRate);

  // Partial close analysis
  const tpPrices = [tp1Price, tp2Price, tp3Price];
  const tpCloses = [inp.tp1Close / 100, inp.tp2Close / 100, 1];
  const tpLabels = ['TP1', 'TP2', 'TP3'];
  let remaining = posSizeCoins;
  const partialClose: PartialCloseRow[] = tpPrices.map((price, i) => {
    const qty = remaining * tpCloses[i];
    const realized = qty * (price - inp.entryLong);
    remaining -= qty;
    return {
      tp: tpLabels[i],
      price,
      pctClose: tpCloses[i] * 100,
      qtyCoins: qty,
      realizedPnl: realized,
      realizedPnlIDR: realized * usdtRate,
      remaining: remaining < 0.0001 ? 0 : remaining,
    };
  });

  // Price level map
  const priceLevels: PriceLevel[] = [
    { label: 'TP3', price: tp3Price, priceIDR: tp3Price * usdtRate, distPct: (tp3Price - inp.entryLong) / inp.entryLong * 100, pnlImpact: pnlLong(tp3Price), action: 'Full Take Profit', type: 'tp' },
    { label: 'TP2', price: tp2Price, priceIDR: tp2Price * usdtRate, distPct: (tp2Price - inp.entryLong) / inp.entryLong * 100, pnlImpact: pnlLong(tp2Price), action: `Close ${inp.tp2Close}% at TP2`, type: 'tp' },
    { label: 'TP1', price: tp1Price, priceIDR: tp1Price * usdtRate, distPct: (tp1Price - inp.entryLong) / inp.entryLong * 100, pnlImpact: pnlLong(tp1Price), action: `Close ${inp.tp1Close}% at TP1`, type: 'tp' },
    { label: 'Entry Long', price: inp.entryLong, priceIDR: inp.entryLong * usdtRate, distPct: 0, pnlImpact: 0, action: 'Long Entry', type: 'entry' },
    { label: 'Hedge Trigger', price: hedgeTrigger, priceIDR: hedgeTrigger * usdtRate, distPct: (hedgeTrigger - inp.entryLong) / inp.entryLong * 100, pnlImpact: pnlLong(hedgeTrigger), action: `Open Short @ ${fmt(inp.entryShort)}`, type: 'hedge' },
    { label: 'SL Long', price: inp.slLong, priceIDR: inp.slLong * usdtRate, distPct: (inp.slLong - inp.entryLong) / inp.entryLong * 100, pnlImpact: maxLossWithHedge, action: 'Stop Loss Long', type: 'sl' },
    { label: 'Liq Price', price: liqPrice, priceIDR: liqPrice * usdtRate, distPct: (liqPrice - inp.entryLong) / inp.entryLong * 100, pnlImpact: -totalMargin, action: 'LIQUIDATION', type: 'liq' },
  ].sort((a, b) => b.price - a.price);

  // Waterfall
  const waterfall: WaterfallData = {
    grossLoss: maxLossSL,
    hedgeOffset: hedgeAtSL,
    netLoss: maxLossWithHedge,
    efficiency: hedgeEfficiency,
  };

  // Ticker items
  const tickerItems: TickerItem[] = [
    { label: inp.pair, value: `$${fmt(inp.entryLong)}` },
    { label: 'Entry Long', value: `$${fmt(inp.entryLong)}` },
    { label: 'SL Long', value: `$${fmt(inp.slLong)}` },
    { label: '1R USDT', value: `$${fmt(oneR)}` },
    { label: '1R %', value: `${oneRPct.toFixed(2)}%` },
    { label: 'Hedge @', value: `$${fmt(hedgeTrigger)}` },
    { label: 'Pos Size', value: `${fmt(posSizeCoins, 4)} coins` },
    { label: 'Total Margin', value: `$${fmt(totalMargin)}` },
    { label: 'Liq Price', value: `$${fmt(liqPrice)}` },
    { label: 'Leverage', value: `${inp.leverage}x` },
  ];

  // Comprehensive output params
  const allParams: OutputParam[] = [
    // Position Info
    { category: 'Position', label: 'Pair', value: inp.pair, color: 'yellow' },
    { category: 'Position', label: 'Direction', value: 'LONG', color: 'green' },
    { category: 'Position', label: 'Entry Price', value: fmtUSD(inp.entryLong), subValue: fmtIDR(inp.entryLong * usdtRate) },
    { category: 'Position', label: 'Stop Loss', value: fmtUSD(inp.slLong), subValue: fmtIDR(inp.slLong * usdtRate), color: 'red' },
    { category: 'Position', label: 'TP1 Price', value: fmtUSD(tp1Price), subValue: `${inp.tp1R}R`, color: 'green' },
    { category: 'Position', label: 'TP2 Price', value: fmtUSD(tp2Price), subValue: `${inp.tp2R}R`, color: 'green' },
    { category: 'Position', label: 'TP3 Price', value: fmtUSD(tp3Price), subValue: `${inp.tp3R}R`, color: 'green' },
    { category: 'Position', label: 'Leverage', value: `${inp.leverage}x`, color: 'blue' },
    { category: 'Position', label: 'Exposure', value: fmtUSD(inp.exposure) },
    { category: 'Position', label: 'Margin (Long)', value: fmtUSD(marginLong), subValue: fmtIDR(marginLong * usdtRate) },
    { category: 'Position', label: 'Position Size', value: `${fmt(posSizeCoins, 4)} coins`, subValue: fmtUSD(inp.exposure) },
    { category: 'Position', label: 'Liquidation Price', value: fmtUSD(liqPrice), subValue: fmtIDR(liqPrice * usdtRate), color: 'red' },
    // Risk
    { category: 'Risk Metrics', label: '1R Value', value: fmtUSD(oneR), subValue: fmtIDR(oneR * usdtRate), color: 'yellow' },
    { category: 'Risk Metrics', label: '1R Percentage', value: `${oneRPct.toFixed(3)}%` },
    { category: 'Risk Metrics', label: 'Max Loss (SL)', value: fmtUSD(maxLossSL), subValue: fmtIDR(maxLossSL * usdtRate), color: 'red' },
    { category: 'Risk Metrics', label: 'Max Loss + Hedge', value: fmtUSD(maxLossWithHedge), subValue: fmtIDR(maxLossWithHedge * usdtRate), color: 'red' },
    { category: 'Risk Metrics', label: 'Hedge Efficiency', value: `${hedgeEfficiency.toFixed(1)}%`, color: hedgeEfficiency >= 50 ? 'green' : 'yellow' },
    { category: 'Risk Metrics', label: 'RR Ratio (TP2)', value: `${rrRatioTP2.toFixed(2)}R`, color: rrRatioTP2 >= 2 ? 'green' : 'yellow' },
    { category: 'Risk Metrics', label: 'ROI at TP2', value: `${roiTP2.toFixed(2)}%`, subValue: fmtUSD(pnlLong(tp2Price)), color: 'green' },
    { category: 'Risk Metrics', label: 'ROI at TP3', value: `${(pnlLong(tp3Price) / totalMargin * 100).toFixed(2)}%`, subValue: fmtUSD(pnlLong(tp3Price)), color: 'green' },
    { category: 'Risk Metrics', label: 'Balance Risk', value: `${balanceRisk.toFixed(2)}%`, color: balanceRisk > 5 ? 'red' : balanceRisk > 2 ? 'yellow' : 'green' },
    { category: 'Risk Metrics', label: 'Profit Factor', value: `${(Math.abs(pnlLong(tp2Price)) / Math.abs(maxLossSL)).toFixed(2)}`, color: 'blue' },
    { category: 'Risk Metrics', label: 'Kelly Criterion', value: `${(rrRatioTP2 > 0 ? ((rrRatioTP2 - 1) / rrRatioTP2 * 100).toFixed(1) : '0')}%`, color: 'purple' },
    // Hedge
    { category: 'Hedge Position', label: 'Entry Short', value: fmtUSD(inp.entryShort), subValue: fmtIDR(inp.entryShort * usdtRate) },
    { category: 'Hedge Position', label: 'SL Short', value: fmtUSD(inp.slShort), subValue: fmtIDR(inp.slShort * usdtRate), color: 'red' },
    { category: 'Hedge Position', label: 'TP Short', value: fmtUSD(inp.tpShort), subValue: fmtIDR(inp.tpShort * usdtRate), color: 'green' },
    { category: 'Hedge Position', label: 'Exposure Short', value: fmtUSD(inp.exposureShort) },
    { category: 'Hedge Position', label: 'Hedge Leverage', value: `${inp.hedgeLeverage}x`, color: 'blue' },
    { category: 'Hedge Position', label: 'Margin (Short)', value: fmtUSD(marginShort), subValue: fmtIDR(marginShort * usdtRate) },
    { category: 'Hedge Position', label: 'Hedge Pos Size', value: `${fmt(posSizeShortCoins, 4)} coins` },
    { category: 'Hedge Position', label: 'Trigger @ RR', value: `${inp.triggerRR}R → ${fmtUSD(hedgeTrigger)}` },
    { category: 'Hedge Position', label: 'Liq Price (Short)', value: fmtUSD(liqPriceShort), color: 'red' },
    { category: 'Hedge Position', label: 'Hedge Profit (SL)', value: fmtUSD(hedgeAtSL), subValue: fmtIDR(hedgeAtSL * usdtRate), color: 'green' },
    // Combined
    { category: 'Combined', label: 'Total Margin', value: fmtUSD(totalMargin), subValue: fmtIDR(totalMargin * usdtRate), color: 'yellow' },
    { category: 'Combined', label: 'Total Exposure', value: fmtUSD(inp.exposure + inp.exposureShort) },
    { category: 'Combined', label: 'Max Drawdown', value: fmtUSD(maxLossWithHedge), subValue: `${((Math.abs(maxLossWithHedge) / totalMargin) * 100).toFixed(1)}% of margin`, color: 'red' },
    { category: 'Combined', label: 'Net P&L (TP2)', value: fmtUSD(bullScenario.net), subValue: fmtIDR(bullScenario.netIDR), color: 'green' },
    { category: 'Combined', label: 'Net P&L (TP3)', value: fmtUSD(fullBullScenario.net), subValue: fmtIDR(fullBullScenario.netIDR), color: 'green' },
    { category: 'Combined', label: 'USDT/IDR Rate', value: `Rp ${fmtIDR(usdtRate).replace('Rp ', '')}` },
    { category: 'Combined', label: 'Margin/Balance', value: `${((totalMargin / inp.accountBalance) * 100).toFixed(1)}%`, color: 'blue' },
  ];

  // Pseudocode
  const ts = new Date().toISOString();
  const pseudocode = generatePseudocode(inp, { oneR, hedgeTrigger, tp1Price, tp2Price, tp3Price, marginLong, marginShort });

  return {
    oneR, oneRPct, marginLong, marginShort, totalMargin, posSizeCoins, posSizeShortCoins,
    liqPrice, liqPriceShort, hedgeTrigger, tp1Price, tp2Price, tp3Price,
    maxLossSL, maxLossWithHedge, hedgeEfficiency, rrRatioTP2, roiTP2, balanceRisk,
    bearScenario, bullScenario, fullBullScenario, partialClose, priceLevels, waterfall, tickerItems,
    pseudocode, allParams,
  };
}

function buildScenario(name: string, exitPrice: number, inp: HedgeInput, pnlLong: (p: number) => number, pnlShort: (p: number) => number, usdtRate: number): ScenarioResult {
  const pl = pnlLong(exitPrice);
  const ps = pnlShort(exitPrice);
  const net = pl + ps;
  const noHedge = pl;
  const hedgeCostSavings = net - noHedge;
  let note = '';
  if (net < 0) note = `Hedge saved ${Math.abs(hedgeCostSavings).toFixed(2)} USDT vs unhedged`;
  else if (net > 0) note = `Net profit ${net.toFixed(2)} USDT including hedge cost`;
  return { name, pnlLong: pl, pnlShort: ps, net, netIDR: net * usdtRate, hedgeCostSavings, withoutHedge: noHedge, note };
}

function generatePseudocode(inp: HedgeInput, calc: Record<string, number>): string {
  const ts = new Date().toISOString();
  return `// ═══════════════════════════════════════════════════════
// HEDGEBOT PRO — Bot Pseudocode
// Generated: ${ts}
// ═══════════════════════════════════════════════════════

CONFIG {
  pair:            "${inp.pair}/USDT"
  entry_long:      ${inp.entryLong}
  sl_long:         ${inp.slLong}
  leverage:        ${inp.leverage}x
  exposure:        $${inp.exposure} USDT
  trigger_rr:      ${inp.triggerRR}R → $${calc.hedgeTrigger?.toFixed(2)}
  
  hedge_entry:     ${inp.entryShort}
  hedge_sl:        ${inp.slShort}
  hedge_tp:        ${inp.tpShort}
  hedge_expo:      $${inp.exposureShort} USDT
  hedge_leverage:  ${inp.hedgeLeverage}x
  
  tp1: $${calc.tp1Price?.toFixed(2)} (${inp.tp1R}R, close ${inp.tp1Close}%)
  tp2: $${calc.tp2Price?.toFixed(2)} (${inp.tp2R}R, close ${inp.tp2Close}%)
  tp3: $${calc.tp3Price?.toFixed(2)} (${inp.tp3R}R, close 100%)
}

// ─── STEP 1: OPEN LONG POSITION ───────────────────────
ON market_open():
  OPEN_LONG(
    symbol = "${inp.pair}USDT",
    size = ${(inp.exposure / inp.entryLong).toFixed(4)} coins,
    leverage = ${inp.leverage},
    type = "MARKET"
  )
  SET sl_order = PLACE_SL(price = ${inp.slLong}, type = "STOP_MARKET")
  
  ws = WebSocket("wss://fstream.binance.com/ws/${inp.pair.toLowerCase()}usdt@markPrice")
  
// ─── STEP 2: MONITOR PRICE VIA WS ─────────────────────
ON price_update(mark_price):
  current_pnl = exposure * (mark_price - entry_long) / entry_long
  
  // Check hedge trigger
  IF mark_price <= ${calc.hedgeTrigger?.toFixed(2)}:
    IF NOT hedge_open:
      OPEN_SHORT(
        symbol = "${inp.pair}USDT",
        size = ${(inp.exposureShort / inp.entryShort).toFixed(4)} coins,
        leverage = ${inp.hedgeLeverage},
        entry = "${inp.entryShort}",
        sl = "${inp.slShort}",
        tp = "${inp.tpShort}"
      )
      SEND_ALERT("⚡ HEDGE OPENED @ " + mark_price)
      hedge_open = TRUE
  
  // TP1 partial close
  IF mark_price >= ${calc.tp1Price?.toFixed(2)} AND NOT tp1_done:
    CLOSE_PARTIAL(
      size = ${(inp.tp1Close / 100).toFixed(2)} * position_size,
      type = "LIMIT",
      price = ${calc.tp1Price?.toFixed(2)}
    )
    MOVE_SL(new_price = entry_long) // Move SL to breakeven
    SEND_ALERT("✅ TP1 HIT: closed ${inp.tp1Close}% @ $${calc.tp1Price?.toFixed(2)}")
    tp1_done = TRUE
  
  // TP2 partial close
  IF mark_price >= ${calc.tp2Price?.toFixed(2)} AND NOT tp2_done:
    CLOSE_PARTIAL(
      size = ${(inp.tp2Close / 100).toFixed(2)} * remaining_size,
      type = "LIMIT",
      price = ${calc.tp2Price?.toFixed(2)}
    )
    CLOSE_HEDGE_PARTIAL(size = 0.5 * hedge_size)
    SEND_ALERT("✅ TP2 HIT: closed ${inp.tp2Close}% @ $${calc.tp2Price?.toFixed(2)}")
    tp2_done = TRUE
  
  // TP3 full close
  IF mark_price >= ${calc.tp3Price?.toFixed(2)}:
    CLOSE_ALL(symbol = "${inp.pair}USDT")
    CLOSE_ALL_HEDGE()
    SEND_ALERT("🚀 TP3 HIT: closed 100% @ $${calc.tp3Price?.toFixed(2)}")

// ─── STEP 3: RISK MANAGEMENT ──────────────────────────
ON sl_triggered():
  CLOSE_ALL_HEDGE()
  SEND_ALERT("🛑 SL HIT: " + current_pnl + " USDT")
  RESET_STATE()

// ─── BINANCE API ENDPOINTS ─────────────────────────────
// REST:  https://fapi.binance.com
// WS:    wss://fstream.binance.com/ws/${inp.pair.toLowerCase()}usdt@markPrice
// ORDER: POST /fapi/v1/order
// ═══════════════════════════════════════════════════════`;
}
