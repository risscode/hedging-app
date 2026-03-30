import { useState, useCallback } from 'react';
import { Plus, X, RotateCcw, Zap, Copy, Check, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateHedge, type HedgeInput, type HedgeResult } from '../lib/hedgeCalc';
import { fmt, fmtIDR, fmtUSD } from '../lib/format';
import { cn } from '@/lib/utils';

const PAIRS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'WIF', 'PEPE'];
const DEFAULT_USDT_RATE = 16300;

const C = { yellow: '#F0B90B', green: '#0ecb81', red: '#f6465d', blue: '#3b82f6', purple: '#a855f7' };
const colorMap: Record<string, string> = { green: C.green, red: C.red, yellow: C.yellow, blue: C.blue, purple: C.purple };

/* ─── Field components ─── */
function Field({ label, hint, value, onChange, suffix, placeholder = '0.00', badge }: {
  label?: string; hint?: string; value: string; onChange?: (v: string) => void;
  suffix?: string; placeholder?: string; badge?: string;
}) {
  return (
    <div className="w-full min-w-0">
      {(label || hint || badge) && (
        <div className="flex items-center justify-between mb-1 gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {label && <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>}
            {badge && <span className="text-[8px] px-1 rounded font-mono shrink-0" style={{ background: C.blue + '20', color: C.blue, border: `1px solid ${C.blue}30` }}>{badge}</span>}
          </div>
          {hint && <span className="text-[10px] font-mono shrink-0" style={{ color: C.yellow + 'aa' }}>{hint}</span>}
        </div>
      )}
      <div className="relative">
        <input type="number" value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
          step="any" readOnly={!onChange}
          className={cn(
            "w-full h-9 rounded border text-xs font-mono transition-colors focus:outline-none",
            "bg-[hsl(var(--card))] text-foreground placeholder:text-muted-foreground/40",
            "border-border focus:border-blue-500/50",
            !onChange && "text-muted-foreground",
            suffix ? "pl-2.5 pr-10" : "px-2.5"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/* Three-way linked field — shows "auto" when auto-calculated */
function LinkedField({ label, value, autoValue, onChange, suffix, placeholder = '0.00', isAuto }: {
  label: string; value: string; autoValue: string; onChange: (v: string) => void;
  suffix?: string; placeholder?: string; isAuto: boolean;
}) {
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1 gap-1">
        <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>
        {isAuto && <span className="text-[8px] px-1 rounded font-mono shrink-0" style={{ background: C.blue + '20', color: C.blue, border: `1px solid ${C.blue}30` }}>auto</span>}
      </div>
      <div className="relative group">
        <input type="number" value={isAuto ? autoValue : value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => { if (isAuto) e.target.select(); }}
          placeholder={placeholder} step="any"
          className={cn(
            "w-full h-9 rounded border text-xs font-mono transition-colors focus:outline-none",
            "bg-[hsl(var(--card))] text-foreground placeholder:text-muted-foreground/40",
            "border-border focus:border-blue-500/50",
            isAuto && "text-blue-400/80",
            suffix ? "pl-2.5 pr-10" : "px-2.5"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/* Hedge auto-field: shows value, editable with reset */
function HedgeField({ label, autoValue, override, onOverride, suffix, hint }: {
  label: string; autoValue: string; override: string; onOverride: (v: string) => void;
  suffix?: string; hint?: string;
}) {
  const isAuto = override === '';
  const displayed = override !== '' ? override : autoValue;
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1 gap-1">
        <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isAuto && autoValue && <span className="text-[8px] px-1 rounded font-mono" style={{ background: C.blue + '20', color: C.blue, border: `1px solid ${C.blue}30` }}>auto</span>}
          {hint && <span className="text-[9px] font-mono" style={{ color: C.yellow + '80' }}>{hint}</span>}
        </div>
      </div>
      <div className="relative group">
        <input type="number" value={displayed} onChange={e => onOverride(e.target.value)}
          placeholder="(auto)" step="any"
          className={cn(
            "w-full h-9 rounded border text-xs font-mono transition-colors focus:outline-none",
            "bg-[hsl(var(--card))] text-foreground placeholder:text-blue-400/40",
            "border-border focus:border-blue-500/50",
            isAuto && autoValue && "text-blue-400/80",
            suffix ? "pl-2.5 pr-10" : "px-2.5"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none select-none">{suffix}</span>
        )}
        {!isAuto && (
          <button onClick={() => onOverride('')} className="absolute right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity" title="Reset to auto">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Leverage ─── */
function LeverageControl({ value, onChange, accentColor }: { value: number; onChange: (v: number) => void; accentColor: string }) {
  const clamp = (v: number) => Math.max(1, Math.min(75, Math.round(v)));
  const pct = ((value - 1) / 74) * 100;
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">Leverage</span>
        <span className="text-[10px] font-mono font-bold" style={{ color: accentColor }}>{value}x</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(clamp(value - 1))} className="shrink-0 w-7 h-7 rounded border border-border bg-card text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
          <Minus className="w-3 h-3" />
        </button>
        <input type="range" min={1} max={75} step={1} value={value} onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full cursor-pointer appearance-none"
          style={{ background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, hsl(var(--border)) ${pct}%, hsl(var(--border)) 100%)` }}
        />
        <button onClick={() => onChange(clamp(value + 1))} className="shrink-0 w-7 h-7 rounded border border-border bg-card text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-1 mt-1.5">
        {[1, 5, 10, 25, 50, 75].map(v => (
          <button key={v} onClick={() => onChange(v)}
            className="flex-1 text-[9px] font-mono py-0.5 rounded transition-all border"
            style={value === v ? { background: accentColor, color: accentColor === C.yellow ? '#000' : '#fff', borderColor: 'transparent', fontWeight: 700 } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >{v}x</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Pos Size Slider ─── */
function PosSizeSlider({ pct, onChange, accentColor }: { pct: number; onChange: (p: number) => void; accentColor: string }) {
  const safe = Math.max(0, Math.min(100, pct));
  const markers = [0, 25, 50, 75, 100];
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">% dari Exposure</span>
        <span className="text-[10px] font-mono" style={{ color: accentColor }}>{safe}%</span>
      </div>
      <div className="relative pb-5">
        <input type="range" min={0} max={100} step={1} value={safe} onChange={e => onChange(Number(e.target.value))}
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
        {[25, 50, 75, 100].map(m => (
          <button key={m} onClick={() => onChange(m)} className="flex-1 text-[9px] font-mono py-0.5 rounded transition-all border"
            style={safe === m ? { background: accentColor, color: accentColor === C.yellow ? '#000' : '#fff', borderColor: 'transparent', fontWeight: 700 } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >{m}%</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-3">
      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} />
    </div>
  );
}

/* ─── Output row ─── */
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

/* ════════════════ MAIN PAGE ════════════════ */
export function HedgebotPage() {
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const isLong = direction === 'long';
  const primaryColor = isLong ? C.green : C.red;
  const hedgeColor   = isLong ? C.red   : C.green;
  const primaryLabel = isLong ? 'Long'  : 'Short';
  const hedgeLabel   = isLong ? 'Short' : 'Long';

  /* Pair */
  const [pair, setPair] = useState('BTC');
  const [customPairs, setCustomPairs] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [pairPrice, setPairPrice] = useState(''); // user inputs current price in USDT

  /* Rate */
  const [usdtRate, setUsdtRate] = useState(String(DEFAULT_USDT_RATE));

  /* Primary position */
  const [entryPrice, setEntryPrice] = useState('');
  const [slPrice, setSlPrice]       = useState('');

  /* ── Three-way linked: Exposure ↔ Margin ↔ PosSize ── */
  type Anchor = 'exposure' | 'margin' | 'posSize';
  const [anchor, setAnchor] = useState<Anchor>('exposure');
  const [exposureRaw, setExposureRaw] = useState('100');
  const [marginRaw,   setMarginRaw]   = useState('');
  const [posSizeRaw,  setPosSizeRaw]  = useState('');
  const [leverage, setLeverage]       = useState(3);
  const [posSizePct, setPosSizePct]   = useState(100);

  const pairPriceN = parseFloat(pairPrice) || 0;

  // Compute all three from anchor
  let cExposure = 0, cMargin = 0, cPosSize = 0;
  if (anchor === 'exposure') {
    cExposure = parseFloat(exposureRaw) || 0;
    cMargin   = leverage > 0 ? +(cExposure / leverage).toFixed(4) : 0;
    cPosSize  = pairPriceN > 0 ? +(cExposure / pairPriceN).toFixed(6) : 0;
  } else if (anchor === 'margin') {
    cMargin   = parseFloat(marginRaw) || 0;
    cExposure = +(cMargin * leverage).toFixed(4);
    cPosSize  = pairPriceN > 0 ? +(cExposure / pairPriceN).toFixed(6) : 0;
  } else {
    cPosSize  = parseFloat(posSizeRaw) || 0;
    cExposure = pairPriceN > 0 ? +(cPosSize * pairPriceN).toFixed(4) : 0;
    cMargin   = leverage > 0 && cExposure > 0 ? +(cExposure / leverage).toFixed(4) : 0;
  }

  const effectiveExposure = cExposure;
  // posSizePct scales posSize from exposure
  const displayPosSize = pairPriceN > 0 && cExposure > 0
    ? +((cExposure * posSizePct / 100) / pairPriceN).toFixed(6)
    : cPosSize;

  const handleExposureChange = (v: string) => { setAnchor('exposure'); setExposureRaw(v); };
  const handleMarginChange   = (v: string) => { setAnchor('margin');   setMarginRaw(v);   };
  const handlePosSizeChange  = (v: string) => { setAnchor('posSize');  setPosSizeRaw(v);  };

  // When leverage changes, keep anchor consistent
  const handleLevChange = (v: number) => { setLeverage(v); };

  /* ── Hedge auto-defaults ── */
  const slDistPrice = (() => {
    const e = parseFloat(entryPrice) || 0;
    const s = parseFloat(slPrice) || 0;
    if (!e || !s) return 0;
    return isLong ? e - s : s - e; // positive distance
  })();

  const autoHedgeEntry = (() => {
    const e = parseFloat(entryPrice) || 0;
    if (!e || slDistPrice <= 0) return '';
    // Hedge opens when price moves 0.5R against primary
    return isLong
      ? String(+(e - 0.5 * slDistPrice).toFixed(6))  // LONG: price drops 0.5R → open SHORT hedge
      : String(+(e + 0.5 * slDistPrice).toFixed(6)); // SHORT: price rises 0.5R → open LONG hedge
  })();
  const autoHedgeSl = entryPrice;         // Hedge SL = Entry of primary position
  const autoHedgeTp = slPrice;            // Hedge TP = SL of primary position
  const autoHedgeExposure = String(effectiveExposure || '');
  const autoHedgeLev      = String(leverage);
  const autoTriggerRR     = '0.5';

  const [hedgeEntryOvr,    setHedgeEntryOvr]    = useState('');
  const [hedgeSlOvr,       setHedgeSlOvr]       = useState('');
  const [hedgeTpOvr,       setHedgeTpOvr]       = useState('');
  const [hedgeExposureOvr, setHedgeExposureOvr] = useState('');
  const [hedgeLevOvr,      setHedgeLevOvr]      = useState('');
  const [triggerRROvr,     setTriggerRROvr]      = useState('');

  /* TP + Partial Close */
  const [tp1, setTp1] = useState('1');
  const [tp2, setTp2] = useState('2');
  const [tp3, setTp3] = useState('3');
  const [pc1, setPc1] = useState('33');
  const [pc2, setPc2] = useState('33');
  const [accountBalance, setAccountBalance] = useState('1000');
  const [riskPct, setRiskPct]               = useState('1');

  /* Output */
  const [result, setResult] = useState<HedgeResult | null>(null);
  const [copied, setCopied] = useState(false);

  /* Resolved hedge values */
  const R = {
    entry:         parseFloat(entryPrice) || 0,
    sl:            parseFloat(slPrice) || 0,
    hedgeEntry:    parseFloat(hedgeEntryOvr    || autoHedgeEntry)    || 0,
    hedgeSl:       parseFloat(hedgeSlOvr       || autoHedgeSl)       || 0,
    hedgeTp:       parseFloat(hedgeTpOvr       || autoHedgeTp)       || 0,
    hedgeExposure: parseFloat(hedgeExposureOvr || autoHedgeExposure) || effectiveExposure,
    hedgeLev:      parseFloat(hedgeLevOvr      || autoHedgeLev)      || leverage,
    triggerRR:     parseFloat(triggerRROvr     || autoTriggerRR)     || 0.5,
  };

  const resetHedge = () => {
    setHedgeEntryOvr(''); setHedgeSlOvr(''); setHedgeTpOvr('');
    setHedgeExposureOvr(''); setHedgeLevOvr(''); setTriggerRROvr('');
  };

  /* Calculate */
  const handleCalculate = useCallback(() => {
    if (!R.entry || !R.sl) return;
    const rate = parseFloat(usdtRate) || DEFAULT_USDT_RATE;

    const inp: HedgeInput = isLong ? {
      pair, entryLong: R.entry, slLong: R.sl,
      exposure: effectiveExposure, leverage,
      entryShort: R.hedgeEntry || R.entry,
      slShort: R.hedgeSl || R.entry,
      tpShort: R.hedgeTp || R.sl,
      exposureShort: R.hedgeExposure, hedgeLeverage: R.hedgeLev,
      triggerRR: R.triggerRR,
      tp1R: parseFloat(tp1)||1, tp2R: parseFloat(tp2)||2, tp3R: parseFloat(tp3)||3,
      tp1Close: parseFloat(pc1)||33, tp2Close: parseFloat(pc2)||33,
      accountBalance: parseFloat(accountBalance)||1000,
      riskPct: parseFloat(riskPct)||1, usdtRate: rate,
    } : {
      pair,
      entryLong: R.hedgeEntry || R.entry,
      slLong: R.hedgeSl || R.entry,
      exposure: R.hedgeExposure, leverage: R.hedgeLev,
      entryShort: R.entry, slShort: R.sl,
      tpShort: R.hedgeTp || R.sl,
      exposureShort: effectiveExposure, hedgeLeverage: leverage,
      triggerRR: R.triggerRR,
      tp1R: parseFloat(tp1)||1, tp2R: parseFloat(tp2)||2, tp3R: parseFloat(tp3)||3,
      tp1Close: parseFloat(pc1)||33, tp2Close: parseFloat(pc2)||33,
      accountBalance: parseFloat(accountBalance)||1000,
      riskPct: parseFloat(riskPct)||1, usdtRate: rate,
    };

    setResult(calculateHedge(inp));
    setTimeout(() => document.getElementById('hedge-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [direction, pair, R, effectiveExposure, leverage, tp1, tp2, tp3, pc1, pc2, accountBalance, riskPct, usdtRate, isLong]);

  const rate    = parseFloat(usdtRate) || DEFAULT_USDT_RATE;
  const pnlCls  = (v: number) => v >= 0 ? C.green : C.red;

  return (
    <div className="min-h-screen pt-14 bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-14 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="px-3 md:px-4 py-2 space-y-2">

          {/* Row 1: Direction toggle + Rate */}
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Direction toggle — BOTH buttons visible, selected enlarges */}
            <div className="flex items-center gap-2">
              {[
                { dir: 'long' as const, label: 'LONG', Icon: TrendingUp, color: C.green, bg: 'linear-gradient(135deg, #0ecb81, #059669)' },
                { dir: 'short' as const, label: 'SHORT', Icon: TrendingDown, color: C.red, bg: 'linear-gradient(135deg, #f6465d, #dc2626)' },
              ].map(({ dir, label, Icon, color, bg }) => {
                const active = direction === dir;
                return (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={cn('flex items-center gap-1.5 rounded-lg font-bold transition-all duration-200 border-2 relative overflow-hidden')}
                    style={{
                      padding: active ? '8px 20px' : '6px 14px',
                      fontSize: active ? '12px' : '10px',
                      background: active ? bg : 'transparent',
                      borderColor: color,
                      color: active ? '#fff' : color,
                      boxShadow: active ? `0 0 16px ${color}60, 0 2px 8px ${color}30` : 'none',
                      transform: active ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <Icon style={{ width: active ? 16 : 12, height: active ? 16 : 12 }} />
                    {label}
                    {active && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* KURS */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">KURS USDT/IDR</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: C.yellow }}>
                Rp {Number(usdtRate).toLocaleString('id-ID')}
              </span>
              <input type="number" value={usdtRate} onChange={e => setUsdtRate(e.target.value)}
                className="w-16 h-6 px-1.5 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-[9px] text-muted-foreground">IDR</span>
            </div>
          </div>

          {/* Pair chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PAIRS.map(p => (
              <button key={p} onClick={() => setPair(p)}
                className="px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all whitespace-nowrap border"
                style={pair === p ? { background: C.blue, borderColor: C.blue, color: '#fff' } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
              >{p}/USDT</button>
            ))}
            {customPairs.map(cp => (
              <div key={cp} className="relative group inline-flex">
                <button onClick={() => setPair(cp)}
                  className="pl-2.5 pr-6 py-1 rounded text-[10px] font-mono font-medium transition-all border"
                  style={pair === cp ? { background: C.blue, borderColor: C.blue, color: '#fff' } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                >{cp}/USDT</button>
                <button onClick={() => { setCustomPairs(p => p.filter(c => c !== cp)); if (pair === cp) setPair('BTC'); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-colors"
                  style={{ background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                >×</button>
              </div>
            ))}
            {!showAdd ? (
              <button onClick={() => setShowAdd(true)}
                className="px-2.5 py-1 rounded text-[10px] font-mono border border-dashed border-border text-muted-foreground hover:border-blue-400/40">
                + Custom
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value.toUpperCase())} placeholder="ARB"
                  className="w-16 h-7 px-2 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:border-blue-500/50 focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && customName) { setCustomPairs(p => [...p, customName]); setPair(customName); setCustomName(''); setShowAdd(false); } }}
                />
                <button onClick={() => { if (customName) { setCustomPairs(p => [...p, customName]); setPair(customName); setCustomName(''); } setShowAdd(false); }}
                  className="px-2 h-7 text-white text-[10px] font-bold rounded" style={{ background: C.blue }}>
                  + Tambah
                </button>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between text-[10px] font-mono border-t border-border/50 pt-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
              <span className="font-bold">{pair}/USDT</span>
              <span className="text-muted-foreground">·</span>
              <span style={{ color: primaryColor }} className="font-semibold">{primaryLabel} Primary</span>
              <span className="text-muted-foreground">→</span>
              <span style={{ color: hedgeColor }}>Hedge {hedgeLabel}</span>
            </div>
            {pairPrice && <span className="text-muted-foreground/60">Harga: ${pairPrice} USDT</span>}
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
            </div>
            <div className="p-3 space-y-2.5">

              {/* Pair price (for pos size calc) */}
              <Field
                label={`Harga ${pair}/USDT saat ini`}
                value={pairPrice}
                onChange={setPairPrice}
                suffix="USDT"
                placeholder="Harga sekarang..."
                badge="untuk posisi size"
              />

              {/* Entry + SL */}
              <div className="grid grid-cols-2 gap-2">
                <Field label={`Entry ${primaryLabel}`} value={entryPrice} onChange={setEntryPrice} suffix="USDT" placeholder="0.00" />
                <Field label={`Stop Loss ${primaryLabel}`} value={slPrice} onChange={setSlPrice} suffix="USDT" placeholder={isLong ? '< Entry' : '> Entry'} />
              </div>

              {/* Three-way linked: PosSize (above leverage) */}
              <LinkedField
                label="Ukuran Posisi (Koin)"
                value={posSizeRaw}
                autoValue={displayPosSize > 0 ? String(displayPosSize) : ''}
                onChange={handlePosSizeChange}
                isAuto={anchor !== 'posSize'}
                suffix="Koin"
                placeholder="auto"
              />

              {/* Pos size % slider */}
              <PosSizeSlider pct={posSizePct} onChange={setPosSizePct} accentColor={primaryColor} />

              {/* Leverage */}
              <LeverageControl value={leverage} onChange={handleLevChange} accentColor={primaryColor} />

              {/* Three-way: Exposure + Margin */}
              <div className="grid grid-cols-2 gap-2">
                <LinkedField
                  label="Exposure"
                  value={exposureRaw}
                  autoValue={cExposure > 0 ? String(cExposure) : ''}
                  onChange={handleExposureChange}
                  isAuto={anchor !== 'exposure'}
                  suffix="USDT"
                  placeholder="100"
                />
                <LinkedField
                  label="Margin"
                  value={marginRaw}
                  autoValue={cMargin > 0 ? String(cMargin) : ''}
                  onChange={handleMarginChange}
                  isAuto={anchor !== 'margin'}
                  suffix="USDT"
                  placeholder="auto"
                />
              </div>
              {/* Linkage indicator */}
              <div className="text-[9px] text-center text-muted-foreground/60 font-mono">
                ↕ Exposure / Margin / Posisi Size saling terhubung otomatis ↕
              </div>

              {/* Account + Risk */}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: hedgeColor }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: hedgeColor }}>
                      Hedge {hedgeLabel} Settings
                    </span>
                  </div>
                  <button onClick={resetHedge} className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-border/50 hover:border-border">
                    <RotateCcw className="w-2.5 h-2.5" /> reset auto
                  </button>
                </div>

                {/* Auto rule info */}
                <div className="rounded-md p-2 text-[9px] font-mono space-y-0.5" style={{ background: C.blue + '10', border: `1px solid ${C.blue}25` }}>
                  <div style={{ color: C.blue }}>Auto defaults:</div>
                  <div className="text-muted-foreground">• Entry hedge = ketika harga turun 0.5R dari entry</div>
                  <div className="text-muted-foreground">• TP hedge = SL posisi primary</div>
                  <div className="text-muted-foreground">• SL hedge = Entry posisi primary</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <HedgeField label={`Entry ${hedgeLabel}`} autoValue={autoHedgeEntry} override={hedgeEntryOvr} onOverride={setHedgeEntryOvr} suffix="USDT" hint="@0.5R" />
                  <HedgeField label="Trigger RR" autoValue={autoTriggerRR} override={triggerRROvr} onOverride={setTriggerRROvr} suffix="R" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <HedgeField label={`SL ${hedgeLabel}`} autoValue={autoHedgeSl} override={hedgeSlOvr} onOverride={setHedgeSlOvr} suffix="USDT" hint="=Entry primary" />
                  <HedgeField label={`TP ${hedgeLabel}`} autoValue={autoHedgeTp} override={hedgeTpOvr} onOverride={setHedgeTpOvr} suffix="USDT" hint="=SL primary" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <HedgeField label={`Exposure ${hedgeLabel}`} autoValue={autoHedgeExposure} override={hedgeExposureOvr} onOverride={setHedgeExposureOvr} suffix="USDT" />
                  <HedgeField label={`Leverage ${hedgeLabel}`} autoValue={autoHedgeLev} override={hedgeLevOvr} onOverride={setHedgeLevOvr} suffix="x" />
                </div>
              </div>

              {/* TP */}
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

              {/* Calculate */}
              <button onClick={handleCalculate}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${isLong ? '#059669' : '#dc2626'})`, boxShadow: `0 4px 16px ${primaryColor}40` }}>
                <Zap className="w-4 h-4" />
                Kalkulasi Hedge {primaryLabel}
              </button>
            </div>
          </div>
        </div>

        {/* ══ OUTPUT — all sections inline, no tabs ══ */}
        {result && (
          <div id="hedge-results" className="mt-6">

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-border bg-card">
                Hasil Kalkulasi
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Ticker */}
            <div className="border border-border rounded-xl overflow-hidden bg-card mb-4">
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

            {/* ── 1. SUMMARY ── */}
            <SectionHeader title="Summary" color={C.blue} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {[
                { label: 'Max Loss (SL)', value: fmtUSD(result.maxLossSL), sub: fmtIDR(result.maxLossSL * rate), color: C.red },
                { label: 'Max Loss + Hedge', value: fmtUSD(result.maxLossWithHedge), sub: fmtIDR(result.maxLossWithHedge * rate), color: C.red },
                { label: 'Hedge Efficiency', value: `${result.hedgeEfficiency.toFixed(1)}%`, color: result.hedgeEfficiency >= 50 ? C.green : C.yellow },
                { label: '1R Value', value: fmtUSD(result.oneR), sub: fmtIDR(result.oneR * rate), color: C.yellow },
                { label: 'RR Ratio (TP2)', value: `${result.rrRatioTP2.toFixed(2)}R`, color: result.rrRatioTP2 >= 2 ? C.green : C.yellow },
                { label: 'ROI at TP2', value: `${result.roiTP2.toFixed(2)}%`, sub: fmtUSD(result.bullScenario.pnlLong), color: C.green },
                { label: 'Liq Price', value: fmtUSD(result.liqPrice), color: C.red },
                { label: 'Balance Risk', value: `${result.balanceRisk.toFixed(2)}%`, color: result.balanceRisk > 5 ? C.red : result.balanceRisk > 2 ? C.yellow : C.green },
              ].map((m, i) => (
                <div key={i} className="border rounded-xl p-3 bg-card" style={{ borderColor: m.color + '25' }}>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">{m.label}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                  {m.sub && <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{m.sub}</div>}
                </div>
              ))}
            </div>

            {/* ── 2. DETAIL ── */}
            <SectionHeader title="Detail Posisi" color={primaryColor} />
            <div className="border border-border rounded-xl overflow-x-auto bg-card mb-2">
              <table className="w-full text-xs font-mono min-w-max">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Parameter', primaryLabel.toUpperCase(), `HEDGE ${hedgeLabel.toUpperCase()}`, 'Combined'].map((h, i) => (
                      <th key={h} className={cn('px-3 py-2 text-[10px] font-semibold', i === 0 ? 'text-left text-muted-foreground' : 'text-right')}
                        style={{ color: i === 1 ? primaryColor : i === 2 ? hedgeColor : i === 3 ? C.yellow : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {[
                    ['Direction', isLong ? 'LONG ▲' : 'SHORT ▼', isLong ? 'SHORT ▼' : 'LONG ▲', '—'],
                    ['Entry', fmtUSD(R.entry), fmtUSD(R.hedgeEntry), '—'],
                    ['Stop Loss', fmtUSD(R.sl), fmtUSD(R.hedgeSl), '—'],
                    ['Exposure', fmtUSD(effectiveExposure), fmtUSD(R.hedgeExposure), fmtUSD(effectiveExposure + R.hedgeExposure)],
                    ['Margin', fmtUSD(result.marginLong), fmtUSD(result.marginShort), fmtUSD(result.totalMargin)],
                    ['Leverage', `${leverage}x`, `${R.hedgeLev}x`, '—'],
                    ['Pos Size', `${fmt(result.posSizeCoins, 4)} koin`, `${fmt(result.posSizeShortCoins, 4)} koin`, '—'],
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

            {/* ── 3. SCENARIOS ── */}
            <SectionHeader title="Skenario P&L" color={C.purple} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
              {[result.bearScenario, result.bullScenario, result.fullBullScenario].map((s, i) => {
                const cols = [C.red, C.yellow, C.green];
                const col = cols[i];
                return (
                  <div key={i} className="border rounded-xl p-4 bg-card" style={{ borderColor: col + '30' }}>
                    <h4 className="text-xs font-bold mb-3" style={{ color: col }}>{s.name}</h4>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      {[['P&L Primary', s.pnlLong], ['P&L Hedge', s.pnlShort], ['Tanpa Hedge', s.withoutHedge], ['Hedge Effect', s.hedgeCostSavings]].map(([l, v]) => (
                        <div key={String(l)} className="flex justify-between">
                          <span className="text-muted-foreground">{String(l)}</span>
                          <span style={{ color: pnlCls(Number(v)) }}>{fmtUSD(Number(v))}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-1.5 space-y-0.5">
                        <div className="flex justify-between font-bold text-xs">
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

            {/* ── 4. PARTIAL CLOSE ── */}
            <SectionHeader title="Partial Close" color={C.green} />
            <div className="border border-border rounded-xl overflow-x-auto bg-card mb-2">
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

            {/* ── 5. PRICE MAP ── */}
            <SectionHeader title="Price Map" color={C.yellow} />
            <div className="space-y-1.5 mb-2">
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

            {/* ── 6. WATERFALL ── */}
            <SectionHeader title="Waterfall — Hedge Efficiency" color={C.blue} />
            <div className="border border-border rounded-xl p-5 space-y-4 bg-card mb-2">
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

            {/* ── 7. ALL PARAMS ── */}
            <SectionHeader title="All Parameters" color={C.purple} />
            <div className="space-y-3 mb-2">
              {['Position', 'Risk Metrics', 'Hedge Position', 'Combined'].map(cat => {
                const catColors: Record<string, string> = { Position: primaryColor, 'Risk Metrics': C.yellow, 'Hedge Position': hedgeColor, Combined: C.blue };
                const col = catColors[cat] ?? C.blue;
                return (
                  <div key={cat} className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: col }} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</span>
                    </div>
                    <div className="divide-y divide-border/30">
                      {result.allParams.filter(p => p.category === cat).map((p, i) => (
                        <ORow key={i} label={p.label} value={p.value} sub={p.subValue} color={p.color ? colorMap[p.color] : undefined} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 8. BOT CODE ── */}
            <SectionHeader title="Bot Strategy Pseudocode" color={C.yellow} />
            <div className="border border-border rounded-xl overflow-hidden bg-card mb-8">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
                <span className="text-xs font-semibold">Binance Futures Bot — Pseudocode</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(result.pseudocode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" style={{ color: C.green }} /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 text-[10px] font-mono leading-relaxed overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                {result.pseudocode}
              </pre>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
