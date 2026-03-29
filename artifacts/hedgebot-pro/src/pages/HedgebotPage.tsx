import { useState, useCallback } from 'react';
import { BarChart2, ChevronDown, ChevronUp, RefreshCw, Zap, Target, Shield, TrendingUp, TrendingDown, Info, Copy, Check, AlertCircle } from 'lucide-react';
import { calculateHedge, type HedgeInput, type HedgeResult } from '../lib/hedgeCalc';
import { fmt, fmtIDR, fmtUSD, fmtPct } from '../lib/format';
import { cn } from '@/lib/utils';

const PAIRS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'WIF', 'PEPE'];

const DEFAULT_USDT_RATE = 16400;

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: string;
  hint?: string;
}

function InputGroup({ label, value, onChange, placeholder, prefix, suffix, type = 'number', hint }: InputGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-muted-foreground/60 font-mono">{hint}</span>}
      </div>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-2.5 text-xs text-muted-foreground font-mono select-none pointer-events-none">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full py-2 text-xs font-mono border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground/40 focus:border-[#F0B90B]/60 transition-colors",
            prefix ? "pl-6 pr-2.5" : "pl-2.5 pr-2.5",
            suffix ? "pr-10" : ""
          )}
          step="any"
        />
        {suffix && (
          <span className="absolute right-2.5 text-[10px] text-muted-foreground font-mono select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  hint?: string;
}

function SliderInput({ label, value, onChange, min, max, step = 1, suffix, hint }: SliderInputProps) {
  const [inputVal, setInputVal] = useState(String(value));

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onChange(v);
    setInputVal(String(v));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
  };

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-muted-foreground/60">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSlider}
            className="w-full"
            style={{
              background: `linear-gradient(to right, #F0B90B 0%, #F0B90B ${pct}%, hsl(var(--border)) ${pct}%, hsl(var(--border)) 100%)`
            }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-muted-foreground/40 font-mono">{min}{suffix}</span>
            <span className="text-[9px] text-muted-foreground/40 font-mono">{max}{suffix}</span>
          </div>
        </div>
        <div className="relative w-16 flex-shrink-0">
          <input
            type="number"
            value={inputVal}
            onChange={handleInput}
            min={min}
            max={max}
            step={step}
            className="w-full py-1.5 pl-2 pr-1 text-xs font-mono border border-border rounded bg-background text-foreground text-center focus:border-[#F0B90B]/60 transition-colors"
          />
          {suffix && (
            <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{suffix}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Icon className="w-3.5 h-3.5 text-[#F0B90B]" />
          {title}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="bg-card px-4 py-3 border-t border-border">{children}</div>}
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const colorClass = color === 'green' ? 'text-[#0ecb81]' : color === 'red' ? 'text-[#f6465d]' : color === 'yellow' ? 'text-[#F0B90B]' : color === 'blue' ? 'text-[#1e80ff]' : color === 'purple' ? 'text-[#a855f7]' : 'text-foreground';
  return (
    <div className="card-hover border border-border rounded-lg p-3 bg-card flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">{label}</span>
      <span className={cn('text-sm font-bold font-mono leading-none', colorClass)}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/60 font-mono leading-none">{sub}</span>}
    </div>
  );
}

function OutputParam({ category, label, value, subValue, color }: { category: string; label: string; value: string; subValue?: string; color?: string }) {
  const colorClass = color === 'green' ? 'text-[#0ecb81]' : color === 'red' ? 'text-[#f6465d]' : color === 'yellow' ? 'text-[#F0B90B]' : color === 'blue' ? 'text-[#1e80ff]' : color === 'purple' ? 'text-[#a855f7]' : 'text-foreground';
  return (
    <div className="output-row flex items-start justify-between gap-2 py-1.5 px-2 rounded text-xs">
      <span className="text-muted-foreground flex-shrink-0 min-w-0 flex-1">{label}</span>
      <div className="text-right flex-shrink-0">
        <div className={cn('font-mono font-semibold', colorClass)}>{value}</div>
        {subValue && <div className="text-[10px] text-muted-foreground/60 font-mono">{subValue}</div>}
      </div>
    </div>
  );
}

export function HedgebotPage() {
  // Form state
  const [selectedPair, setSelectedPair] = useState('BTC');
  const [customPairName, setCustomPairName] = useState('');
  const [customPairPrice, setCustomPairPrice] = useState('');
  const [customPairs, setCustomPairs] = useState<{ name: string; price: string }[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);

  const [usdtRate, setUsdtRate] = useState(String(DEFAULT_USDT_RATE));
  const [usdtRateOverride, setUsdtRateOverride] = useState(false);

  // Long position
  const [entryLong, setEntryLong] = useState('');
  const [slLong, setSlLong] = useState('');
  const [exposure, setExposure] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [accountBalance, setAccountBalance] = useState('');
  const [riskPct, setRiskPct] = useState('2');

  // TP levels
  const [tp1R, setTp1R] = useState(1);
  const [tp2R, setTp2R] = useState(2);
  const [tp3R, setTp3R] = useState(3);
  const [tp1Close, setTp1Close] = useState(30);
  const [tp2Close, setTp2Close] = useState(50);

  // Hedge settings
  const [entryShort, setEntryShort] = useState('');
  const [slShort, setSlShort] = useState('');
  const [tpShort, setTpShort] = useState('');
  const [exposureShort, setExposureShort] = useState('');
  const [hedgeLeverage, setHedgeLeverage] = useState(5);
  const [triggerRR, setTriggerRR] = useState(0.5);

  const [result, setResult] = useState<HedgeResult | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'summary' | 'detail' | 'scenarios' | 'partial' | 'pricemap' | 'waterfall' | 'pseudocode' | 'allparams'>('summary');
  const [copied, setCopied] = useState(false);

  const currentPair = customPairs.find(c => c.name === selectedPair) ? selectedPair : selectedPair;

  const handleCalculate = useCallback(() => {
    const inp: HedgeInput = {
      pair: selectedPair,
      entryLong: parseFloat(entryLong) || 0,
      slLong: parseFloat(slLong) || 0,
      exposure: parseFloat(exposure) || 1000,
      leverage,
      entryShort: parseFloat(entryShort) || parseFloat(entryLong) || 0,
      slShort: parseFloat(slShort) || parseFloat(entryLong) || 0,
      tpShort: parseFloat(tpShort) || parseFloat(slLong) || 0,
      exposureShort: parseFloat(exposureShort) || parseFloat(exposure) * 0.5 || 500,
      hedgeLeverage,
      triggerRR,
      tp1R, tp2R, tp3R, tp1Close, tp2Close,
      accountBalance: parseFloat(accountBalance) || 10000,
      riskPct: parseFloat(riskPct) || 2,
      usdtRate: parseFloat(usdtRate) || DEFAULT_USDT_RATE,
    };
    if (inp.entryLong <= 0 || inp.slLong <= 0) return;
    setResult(calculateHedge(inp));
    setActiveOutputTab('summary');
  }, [selectedPair, entryLong, slLong, exposure, leverage, entryShort, slShort, tpShort, exposureShort, hedgeLeverage, triggerRR, tp1R, tp2R, tp3R, tp1Close, tp2Close, accountBalance, riskPct, usdtRate]);

  const copyPseudocode = () => {
    if (result?.pseudocode) {
      navigator.clipboard.writeText(result.pseudocode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const OUTPUT_TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'detail', label: 'Detail Table' },
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'partial', label: 'Partial Close' },
    { id: 'pricemap', label: 'Price Map' },
    { id: 'waterfall', label: 'Waterfall' },
    { id: 'allparams', label: 'All Params' },
    { id: 'pseudocode', label: 'Bot Code' },
  ] as const;

  const pnlColor = (v: number) => v >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]';

  return (
    <div className="min-h-screen pt-14 pb-8 bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-4 md:px-6 py-3 sticky top-14 z-20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#F0B90B]" />
            <span className="text-xs font-semibold">HedgeBot Calculator</span>
            {result && (
              <span className="hidden md:inline text-[10px] bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30 px-2 py-0.5 rounded-full font-mono ml-1">
                Calculated
              </span>
            )}
          </div>
          {/* USDT Rate */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">USDT/IDR:</span>
            <div className="relative">
              <input
                type="number"
                value={usdtRate}
                onChange={e => { setUsdtRate(e.target.value); setUsdtRateOverride(true); }}
                className="w-20 py-1 px-2 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:border-[#F0B90B]/60 transition-colors"
              />
            </div>
            {usdtRateOverride && (
              <span className="text-[10px] text-[#F0B90B] font-mono">override</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
          {/* ═══ INPUT PANEL ═══ */}
          <div className="space-y-0">

            {/* Pair selector */}
            <Section title="Trading Pair" icon={Target}>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PAIRS.map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPair(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all duration-150',
                      selectedPair === p
                        ? 'bg-[#F0B90B] text-black font-bold shadow-sm'
                        : 'border border-border bg-background text-muted-foreground hover:text-foreground hover:border-[#F0B90B]/40'
                    )}
                  >
                    {p}
                  </button>
                ))}
                {customPairs.map(cp => (
                  <div key={cp.name} className="relative group">
                    <button
                      onClick={() => setSelectedPair(cp.name)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all duration-150',
                        selectedPair === cp.name
                          ? 'bg-[#F0B90B] text-black font-bold shadow-sm'
                          : 'border border-border bg-background text-muted-foreground hover:text-foreground hover:border-[#F0B90B]/40'
                      )}
                    >
                      {cp.name}
                    </button>
                    <button
                      onClick={() => setCustomPairs(prev => prev.filter(c => c.name !== cp.name))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] items-center justify-center hidden group-hover:flex"
                    >×</button>
                  </div>
                ))}
                <button
                  onClick={() => setAddingCustom(v => !v)}
                  className="px-3 py-1.5 rounded-md text-xs font-mono border border-dashed border-border text-muted-foreground hover:border-[#F0B90B]/40 hover:text-foreground transition-colors"
                >
                  + Custom
                </button>
              </div>

              {addingCustom && (
                <div className="flex gap-2 items-end animate-slide-up">
                  <div className="flex-1">
                    <InputGroup label="Name" value={customPairName} onChange={setCustomPairName} placeholder="LINK" type="text" />
                  </div>
                  <div className="flex-1">
                    <InputGroup label="Price" value={customPairPrice} onChange={setCustomPairPrice} placeholder="10.50" prefix="$" />
                  </div>
                  <button
                    onClick={() => {
                      if (customPairName && customPairPrice) {
                        setCustomPairs(prev => [...prev, { name: customPairName.toUpperCase(), price: customPairPrice }]);
                        setSelectedPair(customPairName.toUpperCase());
                        setCustomPairName(''); setCustomPairPrice(''); setAddingCustom(false);
                      }
                    }}
                    className="px-3 py-2 rounded-md text-xs font-medium bg-[#F0B90B] text-black hover:bg-[#f8c823] transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </Section>

            {/* Long Position */}
            <Section title="Long Position" icon={TrendingUp}>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <InputGroup label="Entry Long" value={entryLong} onChange={setEntryLong} placeholder="95000" prefix="$" />
                <InputGroup label="Stop Loss Long" value={slLong} onChange={setSlLong} placeholder="93000" prefix="$" />
                <InputGroup label="Exposure" value={exposure} onChange={setExposure} placeholder="1000" prefix="$" hint="USDT" />
                <InputGroup label="Account Balance" value={accountBalance} onChange={setAccountBalance} placeholder="10000" prefix="$" hint="USDT" />
              </div>
              <div className="space-y-3">
                <SliderInput label="Leverage" value={leverage} onChange={setLeverage} min={1} max={125} step={1} suffix="x" />
                <SliderInput label="Risk per Trade" value={parseFloat(riskPct) || 2} onChange={v => setRiskPct(String(v))} min={0.1} max={20} step={0.1} suffix="%" />
              </div>
            </Section>

            {/* TP Levels */}
            <Section title="Take Profit Levels" icon={Target} defaultOpen={false}>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">TP1 (R)</label>
                    <SliderInput label="" value={tp1R} onChange={setTp1R} min={0.5} max={5} step={0.5} suffix="R" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">TP2 (R)</label>
                    <SliderInput label="" value={tp2R} onChange={setTp2R} min={1} max={10} step={0.5} suffix="R" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">TP3 (R)</label>
                    <SliderInput label="" value={tp3R} onChange={setTp3R} min={2} max={15} step={0.5} suffix="R" />
                  </div>
                </div>
                <SliderInput label="Close at TP1" value={tp1Close} onChange={setTp1Close} min={10} max={80} step={5} suffix="%" hint="Partial close %" />
                <SliderInput label="Close at TP2" value={tp2Close} onChange={setTp2Close} min={10} max={100} step={5} suffix="%" hint="Partial close %" />
              </div>
            </Section>

            {/* Hedge Settings */}
            <Section title="Hedge Short Position" icon={Shield} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <InputGroup label="Entry Short" value={entryShort} onChange={setEntryShort} placeholder="Auto" prefix="$" hint="(= Entry Long)" />
                <InputGroup label="SL Short" value={slShort} onChange={setSlShort} placeholder="Auto" prefix="$" hint="(= Entry Long)" />
                <InputGroup label="TP Short" value={tpShort} onChange={setTpShort} placeholder="Auto" prefix="$" hint="(= SL Long)" />
                <InputGroup label="Exposure Short" value={exposureShort} onChange={setExposureShort} placeholder="500" prefix="$" hint="USDT" />
              </div>
              <div className="space-y-3">
                <SliderInput label="Hedge Leverage" value={hedgeLeverage} onChange={setHedgeLeverage} min={1} max={125} step={1} suffix="x" />
                <SliderInput label="Trigger at RR" value={triggerRR} onChange={setTriggerRR} min={0.1} max={2} step={0.1} suffix="R" hint="Open hedge at" />
              </div>
            </Section>

            {/* Calculate button */}
            <button
              onClick={handleCalculate}
              className="w-full py-3 rounded-xl font-bold text-sm text-black transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F0B90B, #f8c823)' }}
            >
              <Zap className="w-4 h-4" />
              Calculate Hedge
            </button>
          </div>

          {/* ═══ OUTPUT PANEL ═══ */}
          <div>
            {!result ? (
              <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                <div className="text-center">
                  <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Fill inputs and click Calculate</p>
                </div>
              </div>
            ) : (
              <div className="animate-slide-up space-y-3">
                {/* Ticker strip */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="overflow-hidden">
                    <div className="ticker-inner py-2 px-4 gap-6">
                      {[...result.tickerItems, ...result.tickerItems].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-mono flex-shrink-0 whitespace-nowrap">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-[#F0B90B] font-semibold">{item.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Output tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {OUTPUT_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveOutputTab(tab.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all',
                        activeOutputTab === tab.id
                          ? 'bg-[#F0B90B] text-black font-bold'
                          : 'border border-border text-muted-foreground hover:text-foreground hover:border-[#F0B90B]/30 bg-background'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Summary ── */}
                {activeOutputTab === 'summary' && (
                  <div className="space-y-3 stagger-children">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MetricCard label="Max Loss (SL)" value={fmtUSD(result.maxLossSL)} sub={fmtIDR(result.maxLossSL * (parseFloat(usdtRate) || DEFAULT_USDT_RATE))} color="red" />
                      <MetricCard label="Max Loss + Hedge" value={fmtUSD(result.maxLossWithHedge)} sub={fmtIDR(result.maxLossWithHedge * (parseFloat(usdtRate) || DEFAULT_USDT_RATE))} color="red" />
                      <MetricCard label="Hedge Efficiency" value={`${result.hedgeEfficiency.toFixed(1)}%`} color={result.hedgeEfficiency >= 50 ? 'green' : 'yellow'} />
                      <MetricCard label="1R Value" value={fmtUSD(result.oneR)} sub={fmtIDR(result.oneR * (parseFloat(usdtRate) || DEFAULT_USDT_RATE))} color="yellow" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MetricCard label="RR Ratio (TP2)" value={`${result.rrRatioTP2.toFixed(2)}R`} color={result.rrRatioTP2 >= 2 ? 'green' : 'yellow'} />
                      <MetricCard label="ROI at TP2" value={`${result.roiTP2.toFixed(2)}%`} sub={fmtUSD(result.bullScenario.pnlLong)} color="green" />
                      <MetricCard label="Liq Price" value={fmtUSD(result.liqPrice)} color="red" />
                      <MetricCard label="Balance Risk" value={`${result.balanceRisk.toFixed(2)}%`} color={result.balanceRisk > 5 ? 'red' : result.balanceRisk > 2 ? 'yellow' : 'green'} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <MetricCard label="Total Margin" value={fmtUSD(result.totalMargin)} sub={fmtIDR(result.totalMargin * (parseFloat(usdtRate) || DEFAULT_USDT_RATE))} color="yellow" />
                      <MetricCard label="TP1 Price" value={fmtUSD(result.tp1Price)} color="green" />
                      <MetricCard label="TP2 Price" value={fmtUSD(result.tp2Price)} color="green" />
                    </div>
                  </div>
                )}

                {/* ── Detail Table ── */}
                {activeOutputTab === 'detail' && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium">Parameter</th>
                          <th className="text-right px-3 py-2 text-[10px] text-[#0ecb81] font-medium">LONG</th>
                          <th className="text-right px-3 py-2 text-[10px] text-[#f6465d] font-medium">HEDGE SHORT</th>
                          <th className="text-right px-3 py-2 text-[10px] text-[#F0B90B] font-medium">Combined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          ['Direction', 'LONG', 'SHORT', '—'],
                          ['Entry', fmtUSD(result.tickerItems[1]?.value?.replace('$','') as unknown as number || 0), fmtUSD(parseFloat(entryShort) || 0), '—'],
                          ['SL', fmtUSD(parseFloat(slLong) || 0), fmtUSD(parseFloat(slShort) || 0), '—'],
                          ['TP', `${result.tp1Price.toFixed(2)} / ${result.tp2Price.toFixed(2)} / ${result.tp3Price.toFixed(2)}`, fmtUSD(parseFloat(tpShort) || result.tp1Price), '—'],
                          ['Exposure', fmtUSD(parseFloat(exposure) || 0), fmtUSD(parseFloat(exposureShort) || 0), fmtUSD((parseFloat(exposure) || 0) + (parseFloat(exposureShort) || 0))],
                          ['Margin', fmtUSD(result.marginLong), fmtUSD(result.marginShort), fmtUSD(result.totalMargin)],
                          ['Leverage', `${leverage}x`, `${hedgeLeverage}x`, '—'],
                          ['Pos Size', `${fmt(result.posSizeCoins, 4)} coins`, `${fmt(result.posSizeShortCoins, 4)} coins`, '—'],
                          ['Max Profit', fmtUSD(result.fullBullScenario.pnlLong), fmtUSD(result.fullBullScenario.pnlShort), fmtUSD(result.fullBullScenario.net)],
                          ['Max Loss', fmtUSD(result.maxLossSL), fmtUSD(-result.maxLossWithHedge + result.maxLossSL), fmtUSD(result.maxLossWithHedge)],
                          ['Hedge Trigger', `$${result.hedgeTrigger.toFixed(2)}`, 'Triggered here', `${triggerRR}R`],
                          ['Liq Price', fmtUSD(result.liqPrice), fmtUSD(result.liqPriceShort), '—'],
                        ].map(([param, long, short, combined], i) => (
                          <tr key={i} className="output-row">
                            <td className="px-3 py-2 text-muted-foreground">{param}</td>
                            <td className="px-3 py-2 text-right text-[#0ecb81]">{long}</td>
                            <td className="px-3 py-2 text-right text-[#f6465d]">{short}</td>
                            <td className="px-3 py-2 text-right text-[#F0B90B]">{combined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Scenarios ── */}
                {activeOutputTab === 'scenarios' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-children">
                    {[result.bearScenario, result.bullScenario, result.fullBullScenario].map((s, i) => {
                      const colors = ['border-[#f6465d]/30 bg-[#f6465d]/5', 'border-[#F0B90B]/30 bg-[#F0B90B]/5', 'border-[#0ecb81]/30 bg-[#0ecb81]/5'];
                      const headerColors = ['text-[#f6465d]', 'text-[#F0B90B]', 'text-[#0ecb81]'];
                      return (
                        <div key={i} className={`border rounded-xl p-4 ${colors[i]}`}>
                          <h4 className={`text-xs font-bold mb-3 ${headerColors[i]}`}>{s.name}</h4>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">P&L Long</span>
                              <span className={cn('font-mono font-semibold', pnlColor(s.pnlLong))}>{fmtUSD(s.pnlLong)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">P&L Short</span>
                              <span className={cn('font-mono font-semibold', pnlColor(s.pnlShort))}>{fmtUSD(s.pnlShort)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Without Hedge</span>
                              <span className={cn('font-mono font-semibold', pnlColor(s.withoutHedge))}>{fmtUSD(s.withoutHedge)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Hedge Cost/Save</span>
                              <span className={cn('font-mono font-semibold', pnlColor(s.hedgeCostSavings))}>{fmtUSD(s.hedgeCostSavings)}</span>
                            </div>
                            <div className="border-t border-border pt-1.5 mt-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold">NET (USDT)</span>
                                <span className={cn('font-mono font-bold', pnlColor(s.net))}>{fmtUSD(s.net)}</span>
                              </div>
                              <div className="flex justify-between text-[10px] mt-0.5">
                                <span className="text-muted-foreground">NET (IDR)</span>
                                <span className={cn('font-mono', pnlColor(s.net))}>{fmtIDR(s.netIDR)}</span>
                              </div>
                            </div>
                          </div>
                          {s.note && (
                            <p className="text-[9px] text-muted-foreground mt-2 pt-2 border-t border-border/50 italic">{s.note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Partial Close ── */}
                {activeOutputTab === 'partial' && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-muted/50">
                          {['TP', 'Price', 'Close %', 'Qty Coins', 'Realized P&L', 'IDR', 'Remaining'].map(h => (
                            <th key={h} className="text-right first:text-left px-3 py-2 text-[10px] text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {result.partialClose.map((row, i) => (
                          <tr key={i} className="output-row">
                            <td className="px-3 py-2 font-semibold text-[#F0B90B]">{row.tp}</td>
                            <td className="px-3 py-2 text-right">{fmtUSD(row.price)}</td>
                            <td className="px-3 py-2 text-right">{fmt(row.pctClose, 0)}%</td>
                            <td className="px-3 py-2 text-right">{fmt(row.qtyCoins, 4)}</td>
                            <td className={cn('px-3 py-2 text-right font-semibold', pnlColor(row.realizedPnl))}>{fmtUSD(row.realizedPnl)}</td>
                            <td className={cn('px-3 py-2 text-right', pnlColor(row.realizedPnlIDR))}>{fmtIDR(row.realizedPnlIDR)}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{fmt(row.remaining, 4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Price Map ── */}
                {activeOutputTab === 'pricemap' && (
                  <div className="space-y-2 stagger-children">
                    {result.priceLevels.map((level, i) => {
                      const colors: Record<string, string> = {
                        tp: 'border-[#0ecb81]/30 bg-[#0ecb81]/5',
                        entry: 'border-[#F0B90B]/40 bg-[#F0B90B]/8',
                        sl: 'border-[#f6465d]/30 bg-[#f6465d]/5',
                        hedge: 'border-[#1e80ff]/30 bg-[#1e80ff]/5',
                        liq: 'border-[#f6465d]/50 bg-[#f6465d]/10',
                      };
                      const labelColors: Record<string, string> = {
                        tp: 'text-[#0ecb81]', entry: 'text-[#F0B90B]', sl: 'text-[#f6465d]',
                        hedge: 'text-[#1e80ff]', liq: 'text-[#f6465d] font-extrabold',
                      };
                      return (
                        <div key={i} className={`border rounded-xl px-4 py-3 flex items-center gap-4 ${colors[level.type]}`}>
                          <div className="w-20 flex-shrink-0">
                            <div className={`text-xs font-bold font-mono ${labelColors[level.type]}`}>{level.label}</div>
                            <div className="text-[9px] text-muted-foreground">{level.action}</div>
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                            <div>
                              <div className="text-muted-foreground">Price</div>
                              <div className="font-semibold">{fmtUSD(level.price)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">IDR</div>
                              <div className="font-semibold">{fmtIDR(level.priceIDR)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Distance</div>
                              <div className={cn('font-semibold', level.distPct >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                                {level.distPct >= 0 ? '+' : ''}{level.distPct.toFixed(2)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">P&L Impact</div>
                              <div className={cn('font-semibold', pnlColor(level.pnlImpact))}>{fmtUSD(level.pnlImpact)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Waterfall ── */}
                {activeOutputTab === 'waterfall' && (
                  <div className="border border-border rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold">Hedge Efficiency Waterfall</h3>
                    <div className="space-y-3">
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
                          <div className="h-6 bg-muted rounded-md overflow-hidden">
                            <div
                              className="h-full rounded-md transition-all duration-700"
                              style={{ width: `${Math.abs(bar.pct)}%`, background: bar.color }}
                            />
                          </div>
                          <div className="text-right text-[9px] text-muted-foreground font-mono">{fmtIDR(bar.value * (parseFloat(usdtRate) || DEFAULT_USDT_RATE))}</div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-sm font-semibold">Hedge Efficiency</span>
                      <span className={cn('text-lg font-bold font-mono', result.hedgeEfficiency >= 50 ? 'text-[#0ecb81]' : 'text-[#F0B90B]')}>
                        {result.hedgeEfficiency.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* ── All Params ── */}
                {activeOutputTab === 'allparams' && (
                  <div className="space-y-3">
                    {['Position', 'Risk Metrics', 'Hedge Position', 'Combined'].map(category => (
                      <div key={category} className="border border-border rounded-xl overflow-hidden">
                        <div className="px-3 py-2 bg-muted/50 border-b border-border">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{category}</span>
                        </div>
                        <div className="divide-y divide-border/50">
                          {result.allParams.filter(p => p.category === category).map((p, i) => (
                            <OutputParam key={i} {...p} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Pseudocode ── */}
                {activeOutputTab === 'pseudocode' && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                      <span className="text-xs font-semibold">Bot Strategy Pseudocode</span>
                      <button
                        onClick={copyPseudocode}
                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                      >
                        {copied ? <Check className="w-3 h-3 text-[#0ecb81]" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="pseudocode p-4 text-[10px] leading-relaxed overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                      {result.pseudocode.split('\n').map((line, i) => {
                        if (line.startsWith('//')) return <div key={i} className="comment">{line}</div>;
                        if (/\b(CONFIG|ON|IF|ELSE|OPEN_LONG|OPEN_SHORT|CLOSE_ALL|CLOSE_PARTIAL|SEND_ALERT|MOVE_SL|SET|ws|TRUE|FALSE)\b/.test(line)) {
                          return <div key={i} className="keyword">{line}</div>;
                        }
                        return <div key={i}>{line}</div>;
                      })}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
