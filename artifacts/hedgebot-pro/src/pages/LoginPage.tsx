import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, User, BarChart2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { login, getLockoutRemaining } from '../lib/auth';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const rem = getLockoutRemaining();
    if (rem > 0) setLockoutRemaining(rem);
  }, []);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      const rem = getLockoutRemaining();
      setLockoutRemaining(rem);
      if (rem <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate async

    const result = login(username, password);
    setLoading(false);

    if (result.success) {
      onLogin();
    } else {
      setError(result.error ?? 'Too many attempts. Account locked.');
      if (result.lockout) setLockoutRemaining(getLockoutRemaining());
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#F0B90B]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#F0B90B]/3 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Theme toggle top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all ${shaking ? 'animate-shake' : ''}`}
        style={shaking ? { animation: 'shake 0.5s ease-in-out' } : {}}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            15% { transform: translateX(-8px); }
            30% { transform: translateX(8px); }
            45% { transform: translateX(-6px); }
            60% { transform: translateX(6px); }
            75% { transform: translateX(-3px); }
            90% { transform: translateX(3px); }
          }
        `}</style>

        {/* Logo area */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F0B90B] shadow-lg mb-4 glow-pulse">
            <BarChart2 className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">HedgeBot</span>
            <span className="text-foreground"> Pro</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Professional Crypto Hedge Calculator</p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-[#F0B90B]" />
            <span className="text-sm font-semibold text-foreground">Secure Login</span>
            <span className="ml-auto text-xs text-muted-foreground font-mono">Session Auth</span>
          </div>

          {/* Lockout warning */}
          {lockoutRemaining > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-destructive">Account Locked</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Too many failed attempts. Try again in <span className="font-mono font-bold">{formatTime(lockoutRemaining)}</span>
                </p>
              </div>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={lockoutRemaining > 0 || loading}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-[#F0B90B]/60 transition-colors disabled:opacity-50"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={lockoutRemaining > 0 || loading}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-[#F0B90B]/60 transition-colors disabled:opacity-50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && !lockoutRemaining && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={lockoutRemaining > 0 || loading || !username || !password}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{ background: lockoutRemaining > 0 || loading || !username || !password ? undefined : '#F0B90B', color: '#0b0e11' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : lockoutRemaining > 0 ? (
                `Locked • ${formatTime(lockoutRemaining)}`
              ) : (
                'Sign In'
              )}
              {!loading && !lockoutRemaining && username && password && (
                <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors" />
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60 font-mono">Session-based auth • Auto-logout on refresh</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
              <span className="text-[10px] text-muted-foreground/60">Secure</span>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-muted-foreground/50 mt-4 font-mono animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Professional Trading Tools • Built for Serious Traders
        </p>
      </div>
    </div>
  );
}
