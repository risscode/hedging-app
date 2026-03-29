import { useState, useEffect } from 'react';
import { Coins, RefreshCw, Gem, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { calculateGold, type GoldInput, type GoldResult, PURITIES, TABLE_WEIGHTS } from '../lib/goldCalc';
import { fmt, fmtIDR } from '../lib/format';
import { cn } from '@/lib/utils';

const FALLBACK_RATE = 16400;
const FALLBACK_SPOT = 3300;

function Section({ title, icon: Icon, children, defaultOpen = true, gold = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; gold?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("border rounded-xl overflow-hidden mb-3", gold ? "gold-card" : "border-border")}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-card/50 hover:bg-muted/50 transition-colors"
      >
        <span className={cn('flex items-center gap-2 text-xs font-semibold', gold ? 'text-amber-500' : 'text-foreground')}>
          <Icon className={cn('w-3.5 h-3.5', gold ? 'text-amber-400' : 'text-[#F0B90B]')} />
          {title}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="bg-card px-4 py-3 border-t border-border/50">{children}</div>}
    </div>
  );
}

function GoldOutputParam({ label, value, subValue, color }: { label: string; value: string; subValue?: string; color?: string }) {
  const colorClass = color === 'green' ? 'text-[#0ecb81]' : color === 'red' ? 'text-[#f6465d]' : color === 'yellow' ? 'text-[#F0B90B]' : color === 'gold' ? 'text-amber-400' : 'text-foreground';
  return (
    <div className="output-row flex items-start justify-between gap-2 py-1.5 px-2 rounded text-xs">
      <span className="text-muted-foreground flex-1">{label}</span>
      <div className="text-right flex-shrink-0">
        <div className={cn('font-mono font-semibold', colorClass)}>{value}</div>
        {subValue && <div className="text-[10px] text-muted-foreground/60 font-mono">{subValue}</div>}
      </div>
    </div>
  );
}

export function GoldPage() {
  const [spotUSD, setSpotUSD] = useState(String(FALLBACK_SPOT));
  const [usdRate, setUsdRate] = useState(String(FALLBACK_RATE));
  const [usdRateOverride, setUsdRateOverride] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [customGrams, setCustomGrams] = useState('');
  const [purityIdx, setPurityIdx] = useState(0);

  const [result, setResult] = useState<GoldResult | null>(null);
  const [outputTab, setOutputTab] = useState<'summary' | 'table' | 'custom' | 'purity' | 'allparams'>('summary');

  // Auto-fetch rate on load
  useEffect(() => {
    if (!usdRateOverride) fetchRate();
  }, []);

  const fetchRate = async () => {
    setFetchingRate(true);
    setFetchError('');
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data?.rates?.IDR) {
        setUsdRate(String(Math.round(data.rates.IDR)));
      } else {
        throw new Error('No IDR rate');
      }
    } catch {
      try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR');
        const data = await res.json();
        if (data?.rates?.IDR) setUsdRate(String(Math.round(data.rates.IDR)));
      } catch {
        setFetchError('Auto-fetch failed. Using default.');
      }
    }
    setFetchingRate(false);
  };

  const handleCalculate = () => {
    const inp: GoldInput = {
      spotUSD: parseFloat(spotUSD) || FALLBACK_SPOT,
      usdRate: parseFloat(usdRate) || FALLBACK_RATE,
      customGrams: parseFloat(customGrams) || undefined,
      purity: PURITIES[purityIdx]?.value,
      purityLabel: PURITIES[purityIdx]?.label,
    };
    setResult(calculateGold(inp));
    setOutputTab('summary');
  };

  // Auto calculate when inputs change
  useEffect(() => {
    if (parseFloat(spotUSD) > 0) {
      const inp: GoldInput = {
        spotUSD: parseFloat(spotUSD) || FALLBACK_SPOT,
        usdRate: parseFloat(usdRate) || FALLBACK_RATE,
        customGrams: parseFloat(customGrams) || undefined,
        purity: PURITIES[purityIdx]?.value,
        purityLabel: PURITIES[purityIdx]?.label,
      };
      setResult(calculateGold(inp));
    }
  }, [spotUSD, usdRate, customGrams, purityIdx]);

  const OUTPUT_TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'table', label: 'Weight Table' },
    { id: 'custom', label: 'Custom Calc' },
    { id: 'purity', label: 'Purity' },
    { id: 'allparams', label: 'All Params' },
  ] as const;

  return (
    <div className="min-h-screen pt-14 pb-8 bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-4 md:px-6 py-3 sticky top-14 z-20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold gold-gradient-text">Gold Converter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">USD/IDR:</span>
            <input
              type="number"
              value={usdRate}
              onChange={e => { setUsdRate(e.target.value); setUsdRateOverride(true); }}
              className="w-20 py-1 px-2 text-[10px] font-mono border border-border rounded bg-background text-foreground focus:border-amber-400/60 transition-colors"
            />
            <button
              onClick={() => { setUsdRateOverride(false); fetchRate(); }}
              disabled={fetchingRate}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded hover:bg-amber-400/10"
            >
              <RefreshCw className={cn('w-3 h-3', fetchingRate && 'animate-spin')} />
              Auto
            </button>
            {usdRateOverride && <span className="text-[10px] text-amber-400 font-mono">override</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          {/* Input Panel */}
          <div className="space-y-0">
            <Section title="Spot Price Input" icon={Coins} gold defaultOpen>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Gold Spot Price (Troy Oz)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-amber-400 font-mono">$</span>
                      <input
                        type="number"
                        value={spotUSD}
                        onChange={e => setSpotUSD(e.target.value)}
                        placeholder="3300"
                        className="w-full pl-6 pr-3 py-2.5 text-xs font-mono border border-amber-400/30 rounded-lg bg-background text-foreground focus:border-amber-400/60 transition-colors"
                        step="any"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    ≈ Rp {result ? Math.round(result.perTroyOzIDR).toLocaleString('id-ID') : '—'}
                  </p>
                </div>

                {fetchError && (
                  <p className="text-[10px] text-amber-400 bg-amber-400/10 rounded px-2 py-1 border border-amber-400/20">{fetchError}</p>
                )}
              </div>
            </Section>

            <Section title="Custom Gram Calculator" icon={Calculator} gold>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (grams)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customGrams}
                      onChange={e => setCustomGrams(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full py-2.5 px-3 text-xs font-mono border border-amber-400/30 rounded-lg bg-background text-foreground focus:border-amber-400/60 transition-colors"
                      step="any"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">g</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Purity</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {PURITIES.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setPurityIdx(i)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-md text-[10px] font-mono font-medium transition-all duration-150',
                          purityIdx === i
                            ? 'bg-amber-400 text-black font-bold'
                            : 'border border-border text-muted-foreground hover:text-foreground hover:border-amber-400/40'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {result?.customResult && (
                  <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 mt-2 animate-slide-up">
                    <div className="text-[10px] text-amber-400 font-mono mb-2 font-semibold">Formula:</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{result.customResult.formula}</div>
                    <div className="mt-2 pt-2 border-t border-amber-400/20 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] text-muted-foreground">Total (USD)</div>
                        <div className="text-sm font-bold font-mono text-amber-400">${fmt(result.customResult.totalUSD)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground">Total (IDR)</div>
                        <div className="text-sm font-bold font-mono text-amber-400">{fmtIDR(result.customResult.totalIDR)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* Output Panel */}
          <div>
            {!result ? (
              <div className="flex items-center justify-center h-64 border border-dashed border-amber-400/20 rounded-xl text-muted-foreground text-sm">
                <div className="text-center">
                  <Coins className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p>Enter gold spot price to calculate</p>
                </div>
              </div>
            ) : (
              <div className="animate-slide-up space-y-3">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Per Gram (USD)', value: `$${fmt(result.perGramUSD)}`, sub: fmtIDR(result.perGramIDR), color: 'text-amber-400' },
                    { label: 'Per Gram (IDR)', value: fmtIDR(result.perGramIDR), sub: '24K (999)', color: 'text-amber-300' },
                    { label: 'Per Troy Oz (USD)', value: `$${fmt(result.perTroyOzUSD)}`, sub: fmtIDR(result.perTroyOzIDR), color: 'text-amber-400' },
                  ].map((card, i) => (
                    <div key={i} className="card-hover gold-card border rounded-xl p-4 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{card.label}</div>
                      <div className={cn('text-xl font-bold font-serif', card.color)}>{card.value}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Output tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {OUTPUT_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOutputTab(tab.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all',
                        outputTab === tab.id
                          ? 'bg-amber-400 text-black font-bold'
                          : 'border border-border text-muted-foreground hover:text-foreground hover:border-amber-400/30 bg-background'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Summary Tab ── */}
                {outputTab === 'summary' && (
                  <div className="grid grid-cols-2 gap-2 stagger-children">
                    {[
                      { label: 'Per Miligram', usd: result.perGramUSD / 1000 },
                      { label: '1 Gram', usd: result.perGramUSD },
                      { label: '5 Gram', usd: result.perGramUSD * 5 },
                      { label: '10 Gram', usd: result.perGramUSD * 10 },
                      { label: '1 Troy Oz (31.1g)', usd: result.perTroyOzUSD },
                      { label: '100 Gram', usd: result.perGramUSD * 100 },
                      { label: '1 Kilogram', usd: result.perGramUSD * 1000 },
                      { label: '10 Kilogram', usd: result.perGramUSD * 10000 },
                    ].map((row, i) => (
                      <div key={i} className="card-hover border border-border rounded-xl p-3 bg-card">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.label}</div>
                        <div className="text-sm font-bold font-mono text-amber-400 mt-1">${fmt(row.usd)}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/70">{fmtIDR(row.usd * (parseFloat(usdRate) || FALLBACK_RATE))}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Weight Table ── */}
                {outputTab === 'table' && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium">Weight</th>
                          <th className="text-right px-3 py-2 text-[10px] text-muted-foreground font-medium">Grams</th>
                          <th className="text-right px-3 py-2 text-[10px] text-amber-400 font-medium">USD</th>
                          <th className="text-right px-3 py-2 text-[10px] text-amber-300 font-medium">IDR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {result.table.map((row, i) => (
                          <tr key={i} className="output-row">
                            <td className="px-3 py-2 font-medium">{row.label}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{fmt(row.grams, row.grams < 1 ? 4 : 2)}</td>
                            <td className="px-3 py-2 text-right text-amber-400 font-semibold">${fmt(row.usd)}</td>
                            <td className="px-3 py-2 text-right text-amber-300">{fmtIDR(row.idr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Custom Calc Tab ── */}
                {outputTab === 'custom' && (
                  <div>
                    {result.customResult ? (
                      <div className="border border-amber-400/30 rounded-xl p-6 gold-card animate-slide-up space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</div>
                            <div className="text-2xl font-bold font-serif text-amber-400">{fmt(result.customResult.grams)}g</div>
                            <div className="text-xs text-muted-foreground">{result.customResult.purityLabel}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Purity Factor</div>
                            <div className="text-2xl font-bold font-serif text-amber-300">{(result.customResult.purity * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="border-t border-amber-400/20 pt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Value (USD)</div>
                            <div className="text-3xl font-bold font-serif text-amber-400">${fmt(result.customResult.totalUSD)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Value (IDR)</div>
                            <div className="text-xl font-bold font-serif text-amber-300">{fmtIDR(result.customResult.totalIDR)}</div>
                          </div>
                        </div>
                        <div className="bg-background/60 rounded-lg p-3 font-mono text-[10px] text-muted-foreground">
                          <div className="text-amber-400 mb-1">Formula:</div>
                          {result.customResult.formula}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        Enter grams in the input panel to calculate
                      </div>
                    )}
                  </div>
                )}

                {/* ── Purity Tab ── */}
                {outputTab === 'purity' && (
                  <div className="space-y-2 stagger-children">
                    {PURITIES.map((p, i) => (
                      <div key={i} className={cn('border rounded-xl p-4 flex items-center justify-between', i === 0 ? 'gold-card border-amber-400/40' : 'border-border')}>
                        <div>
                          <div className={cn('text-sm font-bold', i === 0 ? 'text-amber-400' : 'text-foreground')}>{p.label}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{(p.value * 100).toFixed(1)}% pure gold</div>
                        </div>
                        <div className="text-right">
                          <div className={cn('text-sm font-bold font-mono', i === 0 ? 'text-amber-400' : 'text-foreground')}>
                            ${fmt(result.perGramUSD * p.value)}/g
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {fmtIDR(result.perGramIDR * p.value)}/g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── All Params Tab ── */}
                {outputTab === 'allparams' && (
                  <div className="space-y-3">
                    {['Spot Prices', 'Purity Comparison', 'Volume Prices (USD)', 'Volume Prices (IDR)'].map(cat => (
                      <div key={cat} className="border border-border rounded-xl overflow-hidden">
                        <div className="px-3 py-2 bg-muted/50 border-b border-border">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</span>
                        </div>
                        <div className="divide-y divide-border/50">
                          {result.allParams.filter(p => p.category === cat).map((p, i) => (
                            <GoldOutputParam key={i} {...p} />
                          ))}
                        </div>
                      </div>
                    ))}
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
