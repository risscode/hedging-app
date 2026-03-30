import { useState, useCallback } from 'react';
import { Plus, X, RotateCcw, Zap, Copy, Check, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateHedge, type HedgeInput, type HedgeResult } from '../lib/hedgeCalc';
import { fmt, fmtIDR, fmtUSD } from '../lib/format';
import { cn } from '@/lib/utils';

const PAIRS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'WIF', 'PEPE'];
const DEFAULT_USDT_RATE = 16300;

/* ─── Colors ─── */
const C = {
  yellow: '#F0B90B',
  green:  '#0ecb81',
  red:    '#f6465d',
  blue:   '#3b82f6',
  purple: '#a855f7',
};

/* ─── AutoField: manual override + auto fallback ─── */
function AutoField({
  label, hint, autoValue, override, onOverride, suffix, placeholder, disabled = false,
}: {
  label?: string; hint?: string; autoValue?: string; override: string;
  onOverride: (v: string) => void; suffix?: string; placeholder?: string; disabled?: boolean;
}) {
  const isAuto = override === '' && autoValue !== undefined;
  const displayVal = override !== '' ? override : autoValue ?? '';

  return (
    <div className="w-full min-w-0">
      {(label || hint) && (
        <div className="flex items-center justify-between mb-1 gap-1">
          {label && <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>}
          <div className="flex items-center gap-1 shrink-0">
            {isAuto && (
              <span className="text-[8px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-1 rounded font-mono">auto</span>
            )}
            {hint && <span className="text-[10px] text-[#F0B90B]/60 font-mono">{hint}</span>}
          </div>
        </div>
      )}
      <div className="relative group">
        <input
          type="number"
          value={displayVal}
          onChange={e => onOverride(e.target.value)}
          onFocus={e => { if (isAuto) { e.target.select(); } }}
          placeholder={isAuto ? '(auto)' : (placeholder ?? '0.00')}
          disabled={disabled}
          step="any"
          className={cn(
            "w-full h-9 rounded border text-xs font-mono transition-colors focus:outline-none",
            "bg-[hsl(var(--card))] text-foreground placeholder:text-blue-400/50",
            "border-border focus:border-blue-500/50",
            isAuto && "text-blue-400/80",
            suffix ? "pl-2.5 pr-10" : "px-2.5"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none select-none">
            {suffix}
          </span>
        )}
        {override !== '' && (
          <button
            onClick={() => onOverride('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            title="Reset to auto"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Manual Field (no auto) ─── */
function Field({ label, hint, value, onChange, suffix, placeholder = '0.00' }: {
  label?: string; hint?: string; value: string; onChange: (v: string) => void;
  suffix?: string; placeholder?: string;
}) {
  return (
    <div className="w-full min-w-0">
      {(label || hint) && (
        <div className="flex items-center justify-between mb-1 gap-1">
          {label && <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>}
          {hint && <span className="text-[10px] text-[#F0B90B]/60 font-mono shrink-0">{hint}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          step="any"
          className={cn(
            "w-full h-9 rounded border text-xs font-mono transition-colors focus:outline-none",
            "bg-[hsl(var(--card))] text-foreground placeholder:text-muted-foreground/40",
            "border-border focus:border-blue-500/50",
            suffix ? "pl-2.5 pr-10" : "px-2.5"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Leverage Control ─── */
function LeverageControl({ value, onChange, accentColor }: {
  value: number; onChange: (v: number) => void; accentColor: string;
}) {
  const clamp = (v: number) => Math.max(1, Math.min(75, Math.round(v)));
  const pct = ((value - 1) / 74) * 100;

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">Leverage</span>
        <span className="text-[10px] font-mono font-bold" style={{ color: accentColor }}>{value}x</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(clamp(value - 1))}
          className="shrink-0 w-7 h-7 rounded border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors flex items-center justify-center">
          <Minus className="w-3 h-3" />
        </button>
        <input type="range" min={1} max={75} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full cursor-pointer appearance-none"
          style={{ background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, hsl(var(--border)) ${pct}%, hsl(var(--border)) 100%)` }}
        />
        <button onClick={() => onChange(clamp(value + 1))}
          className="shrink-0 w-7 h-7 rounded border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors flex items-center justify-center">
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-1 mt-1.5">
        {[1, 5, 10, 25, 50, 75].map(v => (
          <button key={v} onClick={() => onChange(v)}
            className={cn('flex-1 text-[9px] font-mono py-0.5 rounded transition-colors border',
              value === v ? 'text-white font-bold border-transparent' : 'border-border text-muted-foreground hover:text-foreground'
            )}
            style={value === v ? { backgroundColor: accentColor, color: accentColor === C.yellow ? '#000' : '#fff' } : {}}
          >{v}x</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Position Size Slider ─── */
function PosSizeSlider({ pct, onChange, accentColor }: {
  pct: number; onChange: (p: number) => void; accentColor: string;
}) {
  const markers = [0, 25, 50, 75, 100];
  const safe = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">Ukuran Posisi</span>
        <span className="text-[10px] font-mono" style={{ color: accentColor }}>{safe}%</span>
      </div>
      <div className="relative pb-5">
        <input type="range" min={0} max={100} step={1} value={safe}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full cursor-pointer appearance-none"
          style={{ background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${safe}%, hsl(var(--border)) ${safe}%, hsl(var(--border)) 100%)` }}
        />
        <div className="absolute left-0 right-0 flex justify-between" style={{ top: '10px' }}>
          {markers.map(m => (
            <div key={m} className="flex flex-col items-center">
              <div className="w-0.5 h-1.5 rounded-full" style={{ backgroundColor: m <= safe ? accentColor : 'hsl(var(--border))' }} />
              <span className="text-[8px] text-muted-foreground/60 mt-0.5">{m}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1">
        {markers.filter(m => m > 0).map(m => (
          <button key={m} onClick={() => onChange(m)}
            className={cn('flex-1 text-[9px] font-mono py-0.5 rounded transition-colors border',
              safe === m ? 'text-white font-bold border-transparent' : 'border-border text-muted-foreground hover:text-foreground'
            )}
            style={safe === m ? { backgroundColor: accentColor, color: accentColor === C.yellow ? '#000' : '#fff' } : {}}
          >{m}%</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Output Row ─── */
function ORow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 px-2 hover:bg-muted/30 rounded text-xs">
      <span className="text-muted-foreground flex-1 min-w-0">{label}</span>
      <div className="text-right shrink-0">
        <div className="font-mono font-semibold" style={color ? { color } : {}}>{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground/60 font-mono">{sub}</div>}
      </div>
    </div>
  );
}

const colorMap: Record<string, string> = {
  green: C.green, red: C.red, yellow: C.yellow, blue: C.blue, purple: C.purple
};

/* ════════════════ MAIN PAGE ════════════════ */
export function HedgebotPage() {
  /* Direction */
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const isLong = direction === 'long';
  const primaryColor  = isLong ? C.green : C.red;
  const hedgeColor    = isLong ? C.red   : C.green;
  const primaryLabel  = isLong ? 'Long'  : 'Short';
  const hedgeLabel    = isLong ? 'Short' : 'Long';

  /* Pair */
  const [pair, setPair] = useState('BTC');
  const [customPairs, setCustomPairs] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  /* Rate */
  const [usdtRate, setUsdtRate] = useState(String(DEFAULT_USDT_RATE));

  /* Primary position */
  const [entryPrice, setEntryPrice] = useState('');
  const [slPrice, setSlPrice]       = useState('');
  const [exposure, setExposure]     = useState('100');
  const [leverage, setLeverage]     = useState(3);
  const [posSizePct, setPosSizePct] = useState(100);

  /* Auto-derived (primary) with manual override */
  const autoMargin = exposure && leverage ? (parseFloat(exposure) / leverage).toFixed(2) : '';
  const autoPosSizeCoins = entryPrice && exposure && posSizePct > 0
    ? ((parseFloat(exposure) * posSizePct / 100) / parseFloat(entryPrice)).toFixed(4) : '';
  const [marginOvr, setMarginOvr]         = useState('');
  const [posSizeCoinsOvr, setPosSizeCoinsOvr] = useState('');

  /* Hedge fields — all overrideable with auto defaults */
  const autoHedgeEntry    = entryPrice;
  const autoHedgeSl       = isLong
    ? entryPrice   // SHORT hedge SL = primary entry
    : entryPrice && slPrice ? String(+(2 * parseFloat(entryPrice) - parseFloat(slPrice)).toFixed(6)) : ''; // mirror for LONG hedge
  const autoHedgeTp       = isLong
    ? slPrice      // SHORT hedge TP = primary SL
    : slPrice;     // LONG hedge TP = primary SL (same logic)
  const autoHedgeExposure = exposure;
  const autoHedgeLev      = String(leverage);

  const [hedgeEntryOvr,    setHedgeEntryOvr]    = useState('');
  const [hedgeSlOvr,       setHedgeSlOvr]       = useState('');
  const [hedgeTpOvr,       setHedgeTpOvr]       = useState('');
  const [hedgeExposureOvr, setHedgeExposureOvr] = useState('');
  const [hedgeLevOvr,      setHedgeLevOvr]      = useState('');
  const [triggerRR,        setTriggerRR]         = useState('');
  const autoTriggerRR = '0.5';

  /* TP & Partial Close */
  const [tp1, setTp1] = useState('1');
  const [tp2, setTp2] = useState('2');
  const [tp3, setTp3] = useState('3');
  const [pc1, setPc1] = useState('33');
  const [pc2, setPc2] = useState('33');

  /* Account */
  const [accountBalance, setAccountBalance] = useState('1000');
  const [riskPct, setRiskPct]               = useState('1');

  /* Output */
  const [result, setResult] = useState<HedgeResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [copied, setCopied]       = useState(false);

  /* Resolved values */
  const R = {
    entry:        parseFloat(entryPrice) || 0,
    sl:           parseFloat(slPrice)    || 0,
    exposure:     parseFloat(exposure)   || 100,
    hedgeEntry:   parseFloat(hedgeEntryOvr    || autoHedgeEntry)    || 0,
    hedgeSl:      parseFloat(hedgeSlOvr       || autoHedgeSl)       || 0,
    hedgeTp:      parseFloat(hedgeTpOvr       || autoHedgeTp)       || 0,
    hedgeExposure:parseFloat(hedgeExposureOvr || autoHedgeExposure) || 100,
    hedgeLev:     parseFloat(hedgeLevOvr      || autoHedgeLev)      || leverage,
    triggerRR:    parseFloat(triggerRR        || autoTriggerRR)     || 0.5,
  };

  /* Calculate */
  const handleCalculate = useCallback(() => {
    if (!R.entry || !R.sl) return;
    const rate = parseFloat(usdtRate) || DEFAULT_USDT_RATE;

    const inp: HedgeInput = isLong ? {
      pair, entryLong: R.entry, slLong: R.sl,
      exposure: R.exposure, leverage,
      entryShort: R.hedgeEntry, slShort: R.hedgeSl, tpShort: R.hedgeTp,
      exposureShort: R.hedgeExposure, hedgeLeverage: R.hedgeLev,
      triggerRR: R.triggerRR,
      tp1R: parseFloat(tp1)||1, tp2R: parseFloat(tp2)||2, tp3R: parseFloat(tp3)||3,
      tp1Close: parseFloat(pc1)||33, tp2Close: parseFloat(pc2)||33,
      accountBalance: parseFloat(accountBalance)||1000,
      riskPct: parseFloat(riskPct)||1, usdtRate: rate,
    } : {
      // SHORT primary: pass hedge LONG as engine's "long", primary SHORT as engine's "short"
      pair,
      entryLong: R.hedgeEntry,
      slLong: R.hedgeSl,
      exposure: R.hedgeExposure,
      leverage: R.hedgeLev,
      entryShort: R.entry,
      slShort: R.sl,
      tpShort: R.hedgeTp || R.sl,
      exposureShort: R.exposure,
      hedgeLeverage: leverage,
      triggerRR: R.triggerRR,
      tp1R: parseFloat(tp1)||1, tp2R: parseFloat(tp2)||2, tp3R: parseFloat(tp3)||3,
      tp1Close: parseFloat(pc1)||33, tp2Close: parseFloat(pc2)||33,
      accountBalance: parseFloat(accountBalance)||1000,
      riskPct: parseFloat(riskPct)||1, usdtRate: rate,
    };

    setResult(calculateHedge(inp));
    setActiveTab('summary');
    // Scroll to results
    setTimeout(() => document.getElementById('hedge-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [direction, pair, R, leverage, tp1, tp2, tp3, pc1, pc2, accountBalance, riskPct, usdtRate, isLong]);

  const rate = parseFloat(usdtRate) || DEFAULT_USDT_RATE;
  const pnlCls = (v: number) => v >= 0 ? C.green : C.red;

  const resetHedge = () => {
    setHedgeEntryOvr(''); setHedgeSlOvr(''); setHedgeTpOvr('');
    setHedgeExposureOvr(''); setHedgeLevOvr(''); setTriggerRR('');
  };

  const OUTPUT_TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'detail',  label: 'Detail' },
    { id: 'scenarios', label: 'Skenario' },
    { id: 'partial', label: 'Partial Close' },
    { id: 'pricemap', label: 'Price Map' },
    { id: 'waterfall', label: 'Waterfall' },
    { id: 'allparams', label: 'All Params' },
    { id: 'pseudocode', label: 'Bot Code' },
  ];

  return (
    <div className="min-h-screen pt-14 bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-14 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="px-3 md:px-4 py-2 space-y-2">

          {/* Top row: direction toggle + rate */}
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Direction Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border">
              <button
                onClick={() => setDirection('long')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200',
                  isLong ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                style={isLong ? { background: 'linear-gradient(135deg, #0ecb81, #059669)' } : {}}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                LONG
              </button>
              <button
                onClick={() => setDirection('short')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200',
                  !isLong ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                style={!isLong ? { background: 'linear-gradient(135deg, #f6465d, #dc2626)' } : {}}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                SHORT
              </button>
            </div>

            {/* Rate */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">KURS USDT/IDR</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: C.yellow }}>
                Rp {Number(usdtRate).toLocaleString('id-ID')}
              </span>
              <input
                type="number"
                value={usdtRate}
                onChange={e => setUsdtRate(e.target.value)}
                className="w-16 h-6 px-1.5 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-[9px] text-muted-foreground">IDR</span>
            </div>
          </div>

          {/* Pair row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PAIRS.map(p => (
              <button key={p} onClick={() => setPair(p)}
                className={cn('px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all whitespace-nowrap border',
                  pair === p ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground bg-card'
                )}
                style={pair === p ? { background: C.blue, borderColor: C.blue } : {}}
              >{p}/USDT</button>
            ))}
            {customPairs.map(cp => (
              <div key={cp} className="relative group inline-flex">
                <button onClick={() => setPair(cp)}
                  className={cn('pl-2.5 pr-6 py-1 rounded text-[10px] font-mono font-medium transition-all border',
                    pair === cp ? 'text-white border-transparent' : 'border-border text-muted-foreground bg-card'
                  )}
                  style={pair === cp ? { background: C.blue } : {}}
                >{cp}/USDT</button>
                <button
                  onClick={() => { setCustomPairs(prev => prev.filter(c => c !== cp)); if (pair === cp) setPair('BTC'); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-border/50 hover:bg-red-500/80 text-muted-foreground hover:text-white transition-colors flex items-center justify-center text-[9px]"
                >×</button>
              </div>
            ))}
            {!showAddCustom ? (
              <button onClick={() => setShowAddCustom(true)}
                className="px-2.5 py-1 rounded text-[10px] font-mono border border-dashed border-border text-muted-foreground hover:border-blue-400/40 hover:text-foreground transition-colors">
                + Custom
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value.toUpperCase())}
                  placeholder="ARB"
                  className="w-16 h-7 px-2 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:border-blue-500/50 focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && customName) { setCustomPairs(p => [...p, customName]); setPair(customName); setCustomName(''); setShowAddCustom(false); } }}
                />
                <button onClick={() => { if (customName) { setCustomPairs(p => [...p, customName]); setPair(customName); setCustomName(''); } setShowAddCustom(false); }}
                  className="px-2 h-7 text-white text-[10px] font-bold rounded hover:brightness-110"
                  style={{ background: C.blue }}>
                  + Tambah
                </button>
                <button onClick={() => setShowAddCustom(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Pair status */}
          <div className="flex items-center justify-between text-[10px] font-mono border-t border-border/50 pt-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="font-bold">{pair}/USDT</span>
              <span className="text-muted-foreground">·</span>
              <span style={{ color: primaryColor }} className="font-semibold">{primaryLabel} Primary</span>
              <span className="text-muted-foreground">·</span>
              <span style={{ color: hedgeColor }}>Hedge {hedgeLabel}</span>
            </div>
            <span className="text-muted-foreground/60">— isi Entry manual</span>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="px-3 md:px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">

          {/* ══ LEFT: PRIMARY POSITION ══ */}
          <div className="border rounded-xl bg-card overflow-hidden" style={{ borderColor: primaryColor + '40' }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: primaryColor + '20', background: primaryColor + '08' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                Posisi {primaryLabel}
              </span>
              <span className="ml-auto text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Manual atau auto</span>
            </div>
            <div className="p-3 space-y-2.5">

              {/* Entry + SL */}
              <div className="grid grid-cols-2 gap-2">
                <Field label={`Entry ${primaryLabel}`} value={entryPrice} onChange={setEntryPrice} suffix="USDT" placeholder="0.00" />
                <Field
                  label={`Stop Loss ${primaryLabel}`}
                  value={slPrice} onChange={setSlPrice} suffix="USDT"
                  placeholder={isLong ? '< Entry' : '> Entry'}
                />
              </div>

              {/* Exposure + Margin */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Exposure" value={exposure} onChange={setExposure} suffix="USDT" placeholder="100" />
                <AutoField
                  label="Margin"
                  autoValue={autoMargin}
                  override={marginOvr}
                  onOverride={setMarginOvr}
                  suffix="USDT"
                />
              </div>

              {/* Leverage slider */}
              <LeverageControl value={leverage} onChange={setLeverage} accentColor={primaryColor} />

              {/* Position size slider */}
              <PosSizeSlider pct={posSizePct} onChange={setPosSizePct} accentColor={primaryColor} />

              {/* Position size coins (override) */}
              <AutoField
                label="Posisi Size (Koin)"
                autoValue={autoPosSizeCoins}
                override={posSizeCoinsOvr}
                onOverride={setPosSizeCoinsOvr}
                suffix="Koin"
              />

              {/* Account Balance + Risk */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Akun Balance" value={accountBalance} onChange={setAccountBalance} suffix="USDT" placeholder="1000" />
                <Field label="Risiko per Trade" value={riskPct} onChange={setRiskPct} suffix="%" placeholder="1" />
              </div>
            </div>
          </div>

          {/* ══ RIGHT: HEDGE + TARGET ══ */}
          <div className="border rounded-xl bg-card overflow-hidden" style={{ borderColor: C.blue + '40' }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: C.blue + '20', background: C.blue + '08' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.blue }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.blue }}>
                Hedge {hedgeLabel} Config
              </span>
            </div>
            <div className="p-3 space-y-3">

              {/* Hedge settings */}
              <div className="border border-border/50 rounded-lg p-2.5 space-y-2.5 bg-muted/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: hedgeColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: hedgeColor }}>
                    Hedge {hedgeLabel} Settings
                  </span>
                </div>

                {/* Entry Hedge + Trigger RR */}
                <div className="grid grid-cols-2 gap-2">
                  <AutoField label={`Entry ${hedgeLabel}`} autoValue={autoHedgeEntry} override={hedgeEntryOvr} onOverride={setHedgeEntryOvr} suffix="USDT" />
                  <AutoField
                    label="Trigger RR"
                    autoValue={autoTriggerRR}
                    override={triggerRR}
                    onOverride={setTriggerRR}
                    suffix="R"
                    hint="0.5R default"
                  />
                </div>

                {/* SL Hedge + TP Hedge */}
                <div className="grid grid-cols-2 gap-2">
                  <AutoField
                    label={`SL ${hedgeLabel}`}
                    autoValue={autoHedgeSl}
                    override={hedgeSlOvr}
                    onOverride={setHedgeSlOvr}
                    suffix="USDT"
                    hint={isLong ? '=Entry Primary' : 'mirror'}
                  />
                  <AutoField
                    label={`TP ${hedgeLabel}`}
                    autoValue={autoHedgeTp}
                    override={hedgeTpOvr}
                    onOverride={setHedgeTpOvr}
                    suffix="USDT"
                    hint="=SL Primary"
                  />
                </div>

                {/* Exposure + Leverage Hedge */}
                <div className="grid grid-cols-2 gap-2">
                  <AutoField
                    label={`Exposure ${hedgeLabel}`}
                    autoValue={autoHedgeExposure}
                    override={hedgeExposureOvr}
                    onOverride={setHedgeExposureOvr}
                    suffix="USDT"
                    hint="=Long"
                  />
                  <AutoField
                    label={`Leverage ${hedgeLabel}`}
                    autoValue={autoHedgeLev}
                    override={hedgeLevOvr}
                    onOverride={setHedgeLevOvr}
                    suffix="x"
                    hint="=Long"
                  />
                </div>

                {/* Reset button */}
                <button onClick={resetHedge}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded py-1.5 transition-colors hover:border-border/80">
                  <RotateCcw className="w-3 h-3" />
                  Reset semua ke auto
                </button>
              </div>

              {/* Take Profit */}
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Take Profit Targets</span>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <Field label="TP1" value={tp1} onChange={setTp1} suffix="R" placeholder="1" />
                  <Field label="TP2" value={tp2} onChange={setTp2} suffix="R" placeholder="2" />
                  <Field label="TP3" value={tp3} onChange={setTp3} suffix="R" placeholder="3" />
                </div>
              </div>

              {/* Partial Close */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Partial Close TP1 (%)" value={pc1} onChange={setPc1} suffix="%" placeholder="33" />
                <Field label="Partial Close TP2 (%)" value={pc2} onChange={setPc2} suffix="%" placeholder="33" />
              </div>

              {/* Calculate button */}
              <button
                onClick={handleCalculate}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${isLong ? '#059669' : '#dc2626'})` }}
              >
                <Zap className="w-4 h-4" />
                Kalkulasi Hedge {primaryLabel}
              </button>
            </div>
          </div>
        </div>

        {/* ══ RESULTS ══ */}
        {result && (
          <div id="hedge-results" className="mt-5 space-y-3">

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest px-2">Hasil Kalkulasi</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Ticker strip */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="overflow-hidden">
                <div className="ticker-inner py-2 px-4 gap-8 flex">
                  {[...result.tickerItems, ...result.tickerItems].map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-mono shrink-0 whitespace-nowrap">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold" style={{ color: C.yellow }}>{item.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 flex-wrap">
              {OUTPUT_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn('px-3 py-1.5 rounded text-[10px] font-medium whitespace-nowrap transition-all border',
                    activeTab === tab.id ? 'text-white font-bold border-transparent' : 'border-border text-muted-foreground hover:text-foreground bg-card'
                  )}
                  style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${C.blue}, #6366f1)` } : {}}
                >{tab.label}</button>
              ))}
            </div>

            {/* ── Summary ── */}
            {activeTab === 'summary' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Max Loss (SL)', value: fmtUSD(result.maxLossSL), sub: fmtIDR(result.maxLossSL * rate), color: C.red, border: C.red },
                  { label: 'Max Loss + Hedge', value: fmtUSD(result.maxLossWithHedge), sub: fmtIDR(result.maxLossWithHedge * rate), color: C.red, border: C.red },
                  { label: 'Hedge Efficiency', value: `${result.hedgeEfficiency.toFixed(1)}%`, color: result.hedgeEfficiency >= 50 ? C.green : C.yellow, border: result.hedgeEfficiency >= 50 ? C.green : C.yellow },
                  { label: '1R Value', value: fmtUSD(result.oneR), sub: fmtIDR(result.oneR * rate), color: C.yellow, border: C.yellow },
                  { label: 'RR Ratio (TP2)', value: `${result.rrRatioTP2.toFixed(2)}R`, color: result.rrRatioTP2 >= 2 ? C.green : C.yellow, border: result.rrRatioTP2 >= 2 ? C.green : C.blue },
                  { label: 'ROI at TP2', value: `${result.roiTP2.toFixed(2)}%`, sub: fmtUSD(result.bullScenario.pnlLong), color: C.green, border: C.green },
                  { label: 'Liq Price', value: fmtUSD(result.liqPrice), color: C.red, border: C.red },
                  { label: 'Balance Risk', value: `${result.balanceRisk.toFixed(2)}%`, color: result.balanceRisk > 5 ? C.red : result.balanceRisk > 2 ? C.yellow : C.green, border: C.purple },
                ].map((m, i) => (
                  <div key={i} className="border rounded-xl p-3 bg-card transition-all hover:shadow-sm" style={{ borderColor: m.border + '25' }}>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">{m.label}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                    {m.sub && <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{m.sub}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* ── Detail ── */}
            {activeTab === 'detail' && (
              <div className="border border-border rounded-xl overflow-x-auto bg-card">
                <table className="w-full text-xs font-mono min-w-max">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Parameter', primaryLabel.toUpperCase(), `HEDGE ${hedgeLabel.toUpperCase()}`, 'Combined'].map((h, i) => (
                        <th key={h} className={cn('px-3 py-2 text-[10px] font-semibold', i === 0 ? 'text-left text-muted-foreground' : 'text-right')}
                          style={{ color: i === 1 ? primaryColor : i === 2 ? hedgeColor : i === 3 ? C.yellow : undefined }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      ['Direction', isLong ? 'LONG ▲' : 'SHORT ▼', isLong ? 'SHORT ▼' : 'LONG ▲', '—'],
                      ['Entry', fmtUSD(R.entry), fmtUSD(R.hedgeEntry), '—'],
                      ['Stop Loss', fmtUSD(R.sl), fmtUSD(R.hedgeSl), '—'],
                      ['Exposure', fmtUSD(R.exposure), fmtUSD(R.hedgeExposure), fmtUSD(R.exposure + R.hedgeExposure)],
                      ['Margin', fmtUSD(result.marginLong), fmtUSD(result.marginShort), fmtUSD(result.totalMargin)],
                      ['Leverage', `${leverage}x`, `${R.hedgeLev}x`, '—'],
                      ['Pos Size', `${fmt(result.posSizeCoins, 4)}`, `${fmt(result.posSizeShortCoins, 4)}`, '—'],
                      ['Max P&L', fmtUSD(result.fullBullScenario.pnlLong), fmtUSD(result.fullBullScenario.pnlShort), fmtUSD(result.fullBullScenario.net)],
                      ['Liq Price', fmtUSD(result.liqPrice), fmtUSD(result.liqPriceShort), '—'],
                    ].map(([p, l, s, c], i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground">{p}</td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: primaryColor }}>{l}</td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: hedgeColor }}>{s}</td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: C.yellow }}>{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Scenarios ── */}
            {activeTab === 'scenarios' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[result.bearScenario, result.bullScenario, result.fullBullScenario].map((s, i) => {
                  const colors = [C.red, C.yellow, C.green];
                  const col = colors[i];
                  return (
                    <div key={i} className="border rounded-xl p-4 bg-card" style={{ borderColor: col + '30' }}>
                      <h4 className="text-xs font-bold mb-3" style={{ color: col }}>{s.name}</h4>
                      <div className="space-y-1.5 text-[10px] font-mono">
                        {[
                          ['P&L Primary', s.pnlLong],
                          ['P&L Hedge', s.pnlShort],
                          ['Tanpa Hedge', s.withoutHedge],
                          ['Hedge Effect', s.hedgeCostSavings],
                        ].map(([lbl, val]) => (
                          <div key={String(lbl)} className="flex justify-between">
                            <span className="text-muted-foreground">{String(lbl)}</span>
                            <span style={{ color: pnlCls(Number(val)) }}>{fmtUSD(Number(val))}</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-1.5 mt-1 space-y-0.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span>NET USDT</span>
                            <span style={{ color: pnlCls(s.net) }}>{fmtUSD(s.net)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">NET IDR</span>
                            <span style={{ color: pnlCls(s.net) }}>{fmtIDR(s.netIDR)}</span>
                          </div>
                        </div>
                      </div>
                      {s.note && <p className="text-[9px] text-muted-foreground mt-2 pt-2 border-t border-border/50 italic">{s.note}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Partial Close ── */}
            {activeTab === 'partial' && (
              <div className="border border-border rounded-xl overflow-x-auto bg-card">
                <table className="w-full text-xs font-mono min-w-max">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['TP', 'Price', 'Close %', 'Qty Koin', 'Realized P&L', 'IDR', 'Sisa'].map(h => (
                        <th key={h} className="px-3 py-2 text-right first:text-left text-[10px] text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {result.partialClose.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-bold" style={{ color: C.green }}>{row.tp}</td>
                        <td className="px-3 py-2 text-right">{fmtUSD(row.price)}</td>
                        <td className="px-3 py-2 text-right">{fmt(row.pctClose, 0)}%</td>
                        <td className="px-3 py-2 text-right">{fmt(row.qtyCoins, 4)}</td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: pnlCls(row.realizedPnl) }}>{fmtUSD(row.realizedPnl)}</td>
                        <td className="px-3 py-2 text-right" style={{ color: pnlCls(row.realizedPnlIDR) }}>{fmtIDR(row.realizedPnlIDR)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{fmt(row.remaining, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Price Map ── */}
            {activeTab === 'pricemap' && (
              <div className="space-y-1.5">
                {result.priceLevels.map((level, i) => {
                  const typeColors: Record<string, string> = { tp: C.green, entry: C.yellow, sl: C.red, hedge: C.blue, liq: C.red };
                  const col = typeColors[level.type] ?? '#aaa';
                  return (
                    <div key={i} className="border rounded-lg px-3 py-2.5 flex items-center gap-3 bg-card" style={{ borderColor: col + '25' }}>
                      <div className="w-24 shrink-0">
                        <div className="text-[10px] font-bold font-mono" style={{ color: col }}>{level.label}</div>
                        <div className="text-[9px] text-muted-foreground/70">{level.action}</div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5 text-[10px] font-mono min-w-0">
                        <div><span className="text-muted-foreground">Price: </span><span>{fmtUSD(level.price)}</span></div>
                        <div><span className="text-muted-foreground">IDR: </span><span>{fmtIDR(level.priceIDR)}</span></div>
                        <div><span className="text-muted-foreground">Dist: </span><span style={{ color: level.distPct >= 0 ? C.green : C.red }}>{level.distPct >= 0 ? '+' : ''}{level.distPct.toFixed(2)}%</span></div>
                        <div><span className="text-muted-foreground">P&L: </span><span style={{ color: pnlCls(level.pnlImpact) }}>{fmtUSD(level.pnlImpact)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Waterfall ── */}
            {activeTab === 'waterfall' && (
              <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
                <h3 className="text-sm font-semibold">Hedge Efficiency Waterfall</h3>
                {[
                  { label: 'Gross Loss (SL Hit)', value: result.waterfall.grossLoss, color: C.red, pct: 100 },
                  { label: 'Hedge Offset', value: result.waterfall.hedgeOffset, color: C.green, pct: result.hedgeEfficiency },
                  { label: 'Net Loss', value: result.waterfall.netLoss, color: C.blue, pct: 100 - result.hedgeEfficiency },
                ].map((bar, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-semibold" style={{ color: bar.color }}>{fmtUSD(bar.value)}</span>
                    </div>
                    <div className="h-5 bg-muted/40 rounded overflow-hidden">
                      <div className="h-full rounded transition-all duration-700" style={{ width: `${Math.min(100, Math.abs(bar.pct))}%`, backgroundColor: bar.color + 'cc' }} />
                    </div>
                    <div className="text-right text-[9px] text-muted-foreground font-mono">{fmtIDR(bar.value * rate)}</div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-semibold">Efisiensi Hedge</span>
                  <span className="text-xl font-bold font-mono" style={{ color: result.hedgeEfficiency >= 50 ? C.green : C.yellow }}>
                    {result.hedgeEfficiency.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* ── All Params ── */}
            {activeTab === 'allparams' && (
              <div className="space-y-3">
                {['Position', 'Risk Metrics', 'Hedge Position', 'Combined'].map(cat => (
                  <div key={cat} className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full" style={{
                        backgroundColor: cat === 'Position' ? primaryColor : cat === 'Risk Metrics' ? C.yellow : cat === 'Hedge Position' ? hedgeColor : C.blue
                      }} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</span>
                    </div>
                    <div className="divide-y divide-border/30">
                      {result.allParams.filter(p => p.category === cat).map((p, i) => (
                        <ORow key={i} label={p.label} value={p.value} sub={p.subValue} color={p.color ? colorMap[p.color] : undefined} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pseudocode ── */}
            {activeTab === 'pseudocode' && (
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
                  <span className="text-xs font-semibold">Bot Strategy Pseudocode</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.pseudocode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">
                    {copied ? <Check className="w-3 h-3" style={{ color: C.green }} /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 text-[10px] font-mono leading-relaxed overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                  {result.pseudocode}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
