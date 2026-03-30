import { useState, useEffect, useCallback } from 'react';
import { Plus, X, RotateCcw, Zap, Copy, Check, Minus } from 'lucide-react';
import { calculateHedge, type HedgeInput, type HedgeResult } from '../lib/hedgeCalc';
import { fmt, fmtIDR, fmtUSD } from '../lib/format';
import { cn } from '@/lib/utils';

const PAIRS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'WIF', 'PEPE'];
const DEFAULT_USDT_RATE = 16300;

/* ─── Field ─── */
function Field({ label, hint, value, onChange, suffix, placeholder = '0.00', readOnly = false }: {
  label?: string; hint?: string; value: string; onChange?: (v: string) => void;
  suffix?: string; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div className="w-full min-w-0">
      {(label || hint) && (
        <div className="flex items-center justify-between mb-1 gap-1">
          {label && <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>}
          {hint && <span className="text-[10px] text-[#F0B90B]/70 font-mono shrink-0">{hint}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          step="any"
          className={cn(
            "w-full h-9 rounded border text-xs font-mono transition-colors focus:outline-none",
            "bg-[hsl(var(--card))] text-foreground placeholder:text-muted-foreground/40",
            "border-border focus:border-[#F0B90B]/50",
            readOnly ? "text-muted-foreground cursor-default" : "",
            suffix ? "pl-2.5 pr-10" : "px-2.5"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none select-none shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Leverage ─── */
function LeverageControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(1, Math.min(75, Math.round(v)));
  const pct = ((value - 1) / 74) * 100;

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">Leverage</span>
        <span className="text-[10px] text-[#F0B90B] font-mono font-bold">{value}x</span>
      </div>
      {/* Slider row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(clamp(value - 1))}
          className="shrink-0 w-7 h-7 rounded border border-border bg-card text-muted-foreground hover:text-foreground hover:border-[#F0B90B]/40 transition-colors flex items-center justify-center"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="range" min={1} max={75} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full cursor-pointer appearance-none"
          style={{ background: `linear-gradient(to right, #F0B90B 0%, #F0B90B ${pct}%, hsl(var(--border)) ${pct}%, hsl(var(--border)) 100%)` }}
        />
        <button
          onClick={() => onChange(clamp(value + 1))}
          className="shrink-0 w-7 h-7 rounded border border-border bg-card text-muted-foreground hover:text-foreground hover:border-[#F0B90B]/40 transition-colors flex items-center justify-center"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {/* Quick shortcuts */}
      <div className="flex gap-1 mt-1.5">
        {[1, 5, 10, 25, 50, 75].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              'flex-1 text-[9px] font-mono py-0.5 rounded transition-colors',
              value === v ? 'bg-[#F0B90B] text-black font-bold' : 'border border-border text-muted-foreground hover:border-[#F0B90B]/40 hover:text-foreground'
            )}
          >
            {v}x
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Position Size Slider ─── */
function PosSizeSlider({ pct, onChange }: { pct: number; onChange: (p: number) => void }) {
  const markers = [0, 25, 50, 75, 100];
  const safe = Math.max(0, Math.min(100, pct));

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">Posisi Size</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">{safe}%</span>
      </div>
      <div className="relative pb-5">
        <input
          type="range" min={0} max={100} step={1} value={safe}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full cursor-pointer appearance-none"
          style={{ background: `linear-gradient(to right, #F0B90B 0%, #F0B90B ${safe}%, hsl(var(--border)) ${safe}%, hsl(var(--border)) 100%)` }}
        />
        {/* Tick marks */}
        <div className="absolute left-0 right-0 flex justify-between" style={{ top: '10px' }}>
          {markers.map(m => (
            <div key={m} className="flex flex-col items-center">
              <div className={cn('w-0.5 h-1.5 rounded-full', m <= safe ? 'bg-[#F0B90B]' : 'bg-border')} />
              <span className="text-[8px] text-muted-foreground/60 mt-0.5">{m}%</span>
            </div>
          ))}
        </div>
      </div>
      {/* Quick % buttons */}
      <div className="flex gap-1">
        {markers.filter(m => m > 0).map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={cn(
              'flex-1 text-[9px] font-mono py-0.5 rounded transition-colors',
              safe === m ? 'bg-[#F0B90B] text-black font-bold' : 'border border-border text-muted-foreground hover:border-[#F0B90B]/40 hover:text-foreground'
            )}
          >
            {m}%
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Output param row ─── */
function ORow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' }) {
  const c = { green: 'text-[#0ecb81]', red: 'text-[#f6465d]', yellow: 'text-[#F0B90B]', blue: 'text-[#1e80ff]', purple: 'text-[#a855f7]' }[color ?? ''] ?? 'text-foreground';
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 px-2 hover:bg-muted/30 rounded text-xs">
      <span className="text-muted-foreground flex-1 min-w-0">{label}</span>
      <div className="text-right shrink-0">
        <div className={cn('font-mono font-semibold', c)}>{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground/60 font-mono">{sub}</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════ MAIN PAGE ════════════════════════════════════ */
export function HedgebotPage() {
  /* Pair */
  const [pair, setPair] = useState('BTC');
  const [customPairs, setCustomPairs] = useState<{ name: string }[]>([]);
  const [customName, setCustomName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  /* Rate */
  const [usdtRate, setUsdtRate] = useState(String(DEFAULT_USDT_RATE));

  /* Long */
  const [entryLong, setEntryLong] = useState('');
  const [slLong, setSlLong] = useState('');
  const [exposure, setExposure] = useState('100');
  const [leverage, setLeverage] = useState(3);
  const [accountBalance, setAccountBalance] = useState('1000');
  const [riskPct, setRiskPct] = useState('1');
  const [posSizePct, setPosSizePct] = useState(100);

  /* Derived */
  const margin = exposure && leverage ? String(+(parseFloat(exposure) / leverage).toFixed(2)) : '';
  const posSizeCoins = entryLong && exposure && posSizePct > 0
    ? String(+((parseFloat(exposure) * posSizePct / 100) / parseFloat(entryLong)).toFixed(4))
    : 'auto';

  /* Hedge */
  const [triggerRR, setTriggerRR] = useState('0.5');
  const [exposureShortOverride, setExposureShortOverride] = useState('');
  const [hedgeLevOverride, setHedgeLevOverride] = useState('');

  const entryShort = entryLong || '';
  const slShort = entryLong || '';
  const tpShort = slLong || '';
  const exposureShort = exposureShortOverride || exposure;
  const hedgeLev = hedgeLevOverride || String(leverage);

  /* TP */
  const [tp1, setTp1] = useState('1');
  const [tp2, setTp2] = useState('2');
  const [tp3, setTp3] = useState('3');
  const [pc1, setPc1] = useState('33');
  const [pc2, setPc2] = useState('33');

  /* Output */
  const [result, setResult] = useState<HedgeResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'detail' | 'scenarios' | 'partial' | 'pricemap' | 'waterfall' | 'allparams' | 'pseudocode'>('summary');
  const [copied, setCopied] = useState(false);

  /* Handle leverage change — update exposure & margin stays consistent */
  const handleLevChange = (v: number) => {
    setLeverage(v);
    // Don't auto-change exposure/margin — just leverage changes
  };

  /* Exposure changes → recalc posSizePct to keep absolute value if possible */
  const handleExposureChange = (v: string) => {
    setExposure(v);
  };

  /* Calculate */
  const handleCalculate = useCallback(() => {
    const eL = parseFloat(entryLong);
    const sL = parseFloat(slLong);
    const expo = parseFloat(exposure) || 100;
    const rate = parseFloat(usdtRate) || DEFAULT_USDT_RATE;
    if (!eL || !sL || eL <= 0 || sL <= 0) return;

    const inp: HedgeInput = {
      pair,
      entryLong: eL,
      slLong: sL,
      exposure: expo,
      leverage,
      entryShort: eL,
      slShort: eL,
      tpShort: sL,
      exposureShort: parseFloat(exposureShort) || expo,
      hedgeLeverage: parseFloat(hedgeLev) || leverage,
      triggerRR: parseFloat(triggerRR) || 0.5,
      tp1R: parseFloat(tp1) || 1,
      tp2R: parseFloat(tp2) || 2,
      tp3R: parseFloat(tp3) || 3,
      tp1Close: parseFloat(pc1) || 33,
      tp2Close: parseFloat(pc2) || 33,
      accountBalance: parseFloat(accountBalance) || 1000,
      riskPct: parseFloat(riskPct) || 1,
      usdtRate: rate,
    };
    setResult(calculateHedge(inp));
    setActiveTab('summary');
  }, [pair, entryLong, slLong, exposure, leverage, triggerRR, exposureShort, hedgeLev, tp1, tp2, tp3, pc1, pc2, accountBalance, riskPct, usdtRate]);

  const rate = parseFloat(usdtRate) || DEFAULT_USDT_RATE;
  const pnlCls = (v: number) => v >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]';

  const OUTPUT_TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'detail', label: 'Detail' },
    { id: 'scenarios', label: 'Skenario' },
    { id: 'partial', label: 'Partial Close' },
    { id: 'pricemap', label: 'Price Map' },
    { id: 'waterfall', label: 'Waterfall' },
    { id: 'allparams', label: 'All Params' },
    { id: 'pseudocode', label: 'Bot Code' },
  ] as const;

  return (
    <div className="min-h-screen pt-14 bg-background">

      {/* ── Top bar: pair + rate ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-14 z-10">
        <div className="px-3 md:px-4 py-2">
          {/* KURS row */}
          <div className="flex items-center justify-end gap-2 mb-2">
            <div className="flex items-center gap-2 bg-card border border-border rounded px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground font-mono">KURS USDT/IDR</span>
              <span className="text-[10px] text-[#F0B90B] font-mono font-bold">Rp {Number(usdtRate).toLocaleString('id-ID')}</span>
              <input
                type="number"
                value={usdtRate}
                onChange={e => setUsdtRate(e.target.value)}
                className="w-16 h-6 px-1.5 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:border-[#F0B90B]/50 focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground">IDR</span>
            </div>
          </div>

          {/* Pair chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest mr-1 font-medium">Trading Pair</span>
            {PAIRS.map(p => (
              <button
                key={p}
                onClick={() => setPair(p)}
                className={cn(
                  'px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all duration-150 whitespace-nowrap',
                  pair === p
                    ? 'bg-[#F0B90B] text-black font-bold'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:border-[#F0B90B]/30 bg-card'
                )}
              >
                {p}/USDT
              </button>
            ))}
            {customPairs.map(cp => (
              <div key={cp.name} className="relative group inline-flex">
                <button
                  onClick={() => setPair(cp.name)}
                  className={cn(
                    'pl-2.5 pr-6 py-1 rounded text-[10px] font-mono font-medium transition-all duration-150',
                    pair === cp.name
                      ? 'bg-[#F0B90B] text-black font-bold'
                      : 'border border-border text-muted-foreground hover:text-foreground bg-card'
                  )}
                >
                  {cp.name}/USDT
                </button>
                <button
                  onClick={() => { setCustomPairs(prev => prev.filter(c => c.name !== cp.name)); if (pair === cp.name) setPair('BTC'); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-border/50 hover:bg-destructive text-muted-foreground hover:text-white transition-colors flex items-center justify-center text-[9px]"
                >×</button>
              </div>
            ))}

            {/* Custom add */}
            {!showAddCustom ? (
              <button
                onClick={() => setShowAddCustom(true)}
                className="px-2.5 py-1 rounded text-[10px] font-mono border border-dashed border-border text-muted-foreground hover:border-[#F0B90B]/40 hover:text-foreground transition-colors"
              >
                + Custom
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value.toUpperCase())}
                  placeholder="ARB"
                  className="w-16 h-7 px-2 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:border-[#F0B90B]/50 focus:outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customName) {
                      setCustomPairs(prev => [...prev, { name: customName }]);
                      setPair(customName);
                      setCustomName('');
                      setShowAddCustom(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customName) {
                      setCustomPairs(prev => [...prev, { name: customName }]);
                      setPair(customName);
                      setCustomName('');
                    }
                    setShowAddCustom(false);
                  }}
                  className="px-2 h-7 bg-[#F0B90B] text-black text-[10px] font-bold rounded hover:brightness-110"
                >
                  + Tambah
                </button>
                <button onClick={() => setShowAddCustom(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Current pair status bar */}
        <div className="flex items-center justify-between px-3 md:px-4 py-1.5 border-t border-border/50 bg-muted/20">
          <span className="text-xs font-mono font-bold text-foreground">{pair}/USDT</span>
          <span className="text-[10px] text-muted-foreground font-mono">— (isi manual di Entry)</span>
        </div>
      </div>

      {/* ── Main form ── */}
      <div className="px-3 md:px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">

          {/* ══ LEFT: POSISI LONG ══ */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0ecb81]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Posisi Long</span>
            </div>
            <div className="p-3 space-y-2.5">
              {/* Entry + SL */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Entry Price Long" value={entryLong} onChange={setEntryLong} suffix="USDT" placeholder="0.00" />
                <Field label="Stop Loss Long" value={slLong} onChange={setSlLong} suffix="USDT" placeholder="0.00" />
              </div>

              {/* Exposure + Margin */}
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Exposure"
                  value={exposure}
                  onChange={handleExposureChange}
                  suffix="USDT"
                  placeholder="100"
                />
                <Field
                  label="Margin"
                  value={margin}
                  suffix="USDT"
                  readOnly
                  hint="auto"
                />
              </div>

              {/* Leverage slider */}
              <LeverageControl value={leverage} onChange={handleLevChange} />

              {/* Position size slider */}
              <PosSizeSlider pct={posSizePct} onChange={setPosSizePct} />

              {/* Position size display */}
              <Field
                label="Posisi Size (Koin)"
                value={posSizeCoins === 'auto' ? '' : posSizeCoins}
                suffix="Koin"
                readOnly
                placeholder="auto"
              />

              {/* Account Balance + Risk */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Akun Balance (opsional)" value={accountBalance} onChange={setAccountBalance} suffix="USDT" placeholder="1000" />
                <Field label="Risiko per Trade (%)" value={riskPct} onChange={setRiskPct} suffix="%" placeholder="1" />
              </div>
            </div>
          </div>

          {/* ══ RIGHT: TARGET & HEDGE CONFIG ══ */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F0B90B]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Target & Hedge Config</span>
            </div>
            <div className="p-3 space-y-3">

              {/* HEDGE SHORT SETTINGS */}
              <div className="border border-border/60 rounded-lg p-2.5 space-y-2.5 bg-background/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[#F0B90B]" />
                  <span className="text-[10px] font-semibold text-[#F0B90B] uppercase tracking-wider">Hedge Short Settings</span>
                </div>

                {/* Entry Short + Trigger RR */}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Entry Short" value={entryShort} suffix="USDT" readOnly hint="auto" />
                  <Field label="Trigger RR" value={triggerRR} onChange={setTriggerRR} suffix="R" placeholder="0.5" />
                </div>

                {/* SL Short + TP Short */}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="SL Short" value={slShort} suffix="USDT" readOnly hint="=Entry Long" />
                  <Field label="TP Short" value={tpShort} suffix="USDT" readOnly hint="=SL Long" />
                </div>

                {/* Exposure Short + Hedge Leverage */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Exposure Short</span>
                      <span className="text-[10px] text-[#F0B90B]/70 font-mono">USDT</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={exposureShortOverride}
                        onChange={e => setExposureShortOverride(e.target.value)}
                        placeholder={exposure || '=Long'}
                        step="any"
                        className="w-full h-9 px-2.5 pr-14 text-xs font-mono rounded border border-border bg-card text-foreground placeholder:text-[#F0B90B]/50 focus:border-[#F0B90B]/50 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#F0B90B]/60">USDT</span>
                    </div>
                  </div>
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Hedge Leverage</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={hedgeLevOverride}
                        onChange={e => setHedgeLevOverride(e.target.value)}
                        placeholder={String(leverage)}
                        step="1"
                        min={1}
                        max={75}
                        className="w-full h-9 px-2.5 pr-8 text-xs font-mono rounded border border-border bg-card text-foreground placeholder:text-[#F0B90B]/50 focus:border-[#F0B90B]/50 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">x</span>
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => { setExposureShortOverride(''); setHedgeLevOverride(''); setTriggerRR('0.5'); }}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded py-1.5 transition-colors hover:border-[#F0B90B]/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset ke Default (0.5R)
                </button>
              </div>

              {/* TAKE PROFIT TARGETS */}
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-black transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #F0B90B, #f8c823)' }}
              >
                <Zap className="w-4 h-4" />
                Kalkulasi Hedge
              </button>
            </div>
          </div>
        </div>

        {/* ══ OUTPUT ══ */}
        {result && (
          <div className="mt-4 space-y-3 animate-slide-up">

            {/* Ticker */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="overflow-hidden">
                <div className="ticker-inner py-2 px-4 gap-8 flex">
                  {[...result.tickerItems, ...result.tickerItems].map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-mono shrink-0 whitespace-nowrap">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-[#F0B90B] font-semibold">{item.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 flex-wrap">
              {OUTPUT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded text-[10px] font-medium whitespace-nowrap transition-all',
                    activeTab === tab.id
                      ? 'bg-[#F0B90B] text-black font-bold'
                      : 'border border-border text-muted-foreground hover:text-foreground bg-card'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Summary ── */}
            {activeTab === 'summary' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 stagger-children">
                {[
                  { label: 'Max Loss (SL)', value: fmtUSD(result.maxLossSL), sub: fmtIDR(result.maxLossSL * rate), color: 'red' as const },
                  { label: 'Max Loss + Hedge', value: fmtUSD(result.maxLossWithHedge), sub: fmtIDR(result.maxLossWithHedge * rate), color: 'red' as const },
                  { label: 'Hedge Efficiency', value: `${result.hedgeEfficiency.toFixed(1)}%`, color: result.hedgeEfficiency >= 50 ? 'green' as const : 'yellow' as const },
                  { label: '1R Value', value: fmtUSD(result.oneR), sub: fmtIDR(result.oneR * rate), color: 'yellow' as const },
                  { label: 'RR Ratio (TP2)', value: `${result.rrRatioTP2.toFixed(2)}R`, color: result.rrRatioTP2 >= 2 ? 'green' as const : 'yellow' as const },
                  { label: 'ROI at TP2', value: `${result.roiTP2.toFixed(2)}%`, sub: fmtUSD(result.bullScenario.pnlLong), color: 'green' as const },
                  { label: 'Liq Price', value: fmtUSD(result.liqPrice), color: 'red' as const },
                  { label: 'Balance Risk', value: `${result.balanceRisk.toFixed(2)}%`, color: result.balanceRisk > 5 ? 'red' as const : result.balanceRisk > 2 ? 'yellow' as const : 'green' as const },
                ].map((m, i) => {
                  const c = { green: 'text-[#0ecb81]', red: 'text-[#f6465d]', yellow: 'text-[#F0B90B]' }[m.color] ?? 'text-foreground';
                  return (
                    <div key={i} className="border border-border rounded-lg p-3 bg-card hover:border-[#F0B90B]/20 transition-colors">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</div>
                      <div className={cn('text-sm font-bold font-mono', c)}>{m.value}</div>
                      {m.sub && <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{m.sub}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Detail ── */}
            {activeTab === 'detail' && (
              <div className="border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-xs font-mono min-w-max">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      {['Parameter', 'LONG', 'HEDGE SHORT', 'Combined'].map((h, i) => (
                        <th key={h} className={cn('px-3 py-2 text-[10px] font-medium', i === 0 ? 'text-left text-muted-foreground' : i === 1 ? 'text-right text-[#0ecb81]' : i === 2 ? 'text-right text-[#f6465d]' : 'text-right text-[#F0B90B]')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      ['Direction', 'LONG', 'SHORT', '—'],
                      ['Entry', fmtUSD(parseFloat(entryLong)||0), fmtUSD(parseFloat(entryLong)||0), '—'],
                      ['Stop Loss', fmtUSD(parseFloat(slLong)||0), fmtUSD(parseFloat(entryLong)||0), '—'],
                      ['TP', `${result.tp1Price.toFixed(2)} / ${result.tp2Price.toFixed(2)}`, fmtUSD(parseFloat(slLong)||0), '—'],
                      ['Exposure', fmtUSD(parseFloat(exposure)||0), fmtUSD(parseFloat(exposureShort)||0), fmtUSD((parseFloat(exposure)||0)+(parseFloat(exposureShort)||0))],
                      ['Margin', fmtUSD(result.marginLong), fmtUSD(result.marginShort), fmtUSD(result.totalMargin)],
                      ['Leverage', `${leverage}x`, `${hedgeLev}x`, '—'],
                      ['Pos Size', `${fmt(result.posSizeCoins,4)}`, `${fmt(result.posSizeShortCoins,4)}`, '—'],
                      ['Max Profit', fmtUSD(result.fullBullScenario.pnlLong), fmtUSD(result.fullBullScenario.pnlShort), fmtUSD(result.fullBullScenario.net)],
                      ['Max Loss', fmtUSD(result.maxLossSL), fmtUSD(-result.maxLossWithHedge+result.maxLossSL), fmtUSD(result.maxLossWithHedge)],
                      ['Liq Price', fmtUSD(result.liqPrice), fmtUSD(result.liqPriceShort), '—'],
                    ].map(([p, l, s, c], i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground">{p}</td>
                        <td className="px-3 py-2 text-right text-[#0ecb81]">{l}</td>
                        <td className="px-3 py-2 text-right text-[#f6465d]">{s}</td>
                        <td className="px-3 py-2 text-right text-[#F0B90B]">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Scenarios ── */}
            {activeTab === 'scenarios' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-children">
                {[result.bearScenario, result.bullScenario, result.fullBullScenario].map((s, i) => {
                  const colors = ['border-[#f6465d]/30', 'border-[#F0B90B]/30', 'border-[#0ecb81]/30'];
                  const hdrColors = ['text-[#f6465d]', 'text-[#F0B90B]', 'text-[#0ecb81]'];
                  return (
                    <div key={i} className={`border rounded-xl p-4 bg-card ${colors[i]}`}>
                      <h4 className={`text-xs font-bold mb-3 ${hdrColors[i]}`}>{s.name}</h4>
                      <div className="space-y-1.5 text-[10px] font-mono">
                        {[
                          ['P&L Long', s.pnlLong],
                          ['P&L Short', s.pnlShort],
                          ['Without Hedge', s.withoutHedge],
                          ['Hedge Effect', s.hedgeCostSavings],
                        ].map(([lbl, val]) => (
                          <div key={String(lbl)} className="flex justify-between">
                            <span className="text-muted-foreground">{String(lbl)}</span>
                            <span className={pnlCls(Number(val))}>{fmtUSD(Number(val))}</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-1.5 mt-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">NET USDT</span>
                            <span className={cn('font-bold', pnlCls(s.net))}>{fmtUSD(s.net)}</span>
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-muted-foreground">NET IDR</span>
                            <span className={pnlCls(s.net)}>{fmtIDR(s.netIDR)}</span>
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
              <div className="border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-xs font-mono min-w-max">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      {['TP', 'Price', 'Close %', 'Qty Koin', 'Realized P&L', 'IDR', 'Sisa'].map(h => (
                        <th key={h} className="px-3 py-2 text-right first:text-left text-[10px] text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {result.partialClose.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-bold text-[#F0B90B]">{row.tp}</td>
                        <td className="px-3 py-2 text-right">{fmtUSD(row.price)}</td>
                        <td className="px-3 py-2 text-right">{fmt(row.pctClose,0)}%</td>
                        <td className="px-3 py-2 text-right">{fmt(row.qtyCoins,4)}</td>
                        <td className={cn('px-3 py-2 text-right font-semibold', pnlCls(row.realizedPnl))}>{fmtUSD(row.realizedPnl)}</td>
                        <td className={cn('px-3 py-2 text-right', pnlCls(row.realizedPnlIDR))}>{fmtIDR(row.realizedPnlIDR)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{fmt(row.remaining,4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Price Map ── */}
            {activeTab === 'pricemap' && (
              <div className="space-y-1.5 stagger-children">
                {result.priceLevels.map((level, i) => {
                  const styles: Record<string, string> = { tp: 'border-[#0ecb81]/30', entry: 'border-[#F0B90B]/40', sl: 'border-[#f6465d]/30', hedge: 'border-[#1e80ff]/30', liq: 'border-[#f6465d]/50' };
                  const labelStyles: Record<string, string> = { tp: 'text-[#0ecb81]', entry: 'text-[#F0B90B]', sl: 'text-[#f6465d]', hedge: 'text-[#1e80ff]', liq: 'text-[#f6465d] font-extrabold' };
                  return (
                    <div key={i} className={`border rounded-lg px-3 py-2.5 flex items-center gap-3 bg-card ${styles[level.type]}`}>
                      <div className="w-24 shrink-0">
                        <div className={`text-[10px] font-bold font-mono ${labelStyles[level.type]}`}>{level.label}</div>
                        <div className="text-[9px] text-muted-foreground/70">{level.action}</div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5 text-[10px] font-mono min-w-0">
                        <div><span className="text-muted-foreground">Price: </span><span>{fmtUSD(level.price)}</span></div>
                        <div><span className="text-muted-foreground">IDR: </span><span>{fmtIDR(level.priceIDR)}</span></div>
                        <div><span className="text-muted-foreground">Dist: </span><span className={level.distPct >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>{level.distPct >= 0 ? '+' : ''}{level.distPct.toFixed(2)}%</span></div>
                        <div><span className="text-muted-foreground">P&L: </span><span className={pnlCls(level.pnlImpact)}>{fmtUSD(level.pnlImpact)}</span></div>
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
                  { label: 'Gross Loss (SL Hit)', value: result.waterfall.grossLoss, color: '#f6465d', pct: 100 },
                  { label: 'Hedge Offset', value: result.waterfall.hedgeOffset, color: '#0ecb81', pct: result.hedgeEfficiency },
                  { label: 'Net Loss', value: result.waterfall.netLoss, color: '#F0B90B', pct: 100 - result.hedgeEfficiency },
                ].map((bar, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span style={{ color: bar.color }} className="font-semibold">{fmtUSD(bar.value)}</span>
                    </div>
                    <div className="h-5 bg-muted rounded overflow-hidden">
                      <div className="h-full rounded transition-all duration-700" style={{ width: `${Math.abs(bar.pct)}%`, background: bar.color }} />
                    </div>
                    <div className="text-right text-[9px] text-muted-foreground font-mono">{fmtIDR(bar.value * rate)}</div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-semibold">Efisiensi Hedge</span>
                  <span className={cn('text-xl font-bold font-mono', result.hedgeEfficiency >= 50 ? 'text-[#0ecb81]' : 'text-[#F0B90B]')}>{result.hedgeEfficiency.toFixed(1)}%</span>
                </div>
              </div>
            )}

            {/* ── All Params ── */}
            {activeTab === 'allparams' && (
              <div className="space-y-3">
                {['Position', 'Risk Metrics', 'Hedge Position', 'Combined'].map(cat => (
                  <div key={cat} className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="px-3 py-2 border-b border-border bg-muted/30">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {result.allParams.filter(p => p.category === cat).map((p, i) => (
                        <ORow key={i} label={p.label} value={p.value} sub={p.subValue} color={p.color as any} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pseudocode ── */}
            {activeTab === 'pseudocode' && (
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <span className="text-xs font-semibold">Bot Strategy Pseudocode</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.pseudocode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#0ecb81]" /> : <Copy className="w-3 h-3" />}
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
