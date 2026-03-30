import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BarChart2, Coins, Menu, X, LogOut, BookOpen, Bell, Calculator } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { logout } from '../lib/auth';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onLogout: () => void;
}

const NAV_ITEMS = [
  { icon: BarChart2, label: 'HedgeBot', path: '/hedgebot', active: true },
  { icon: Coins, label: 'Gold Convert', path: '/gold', active: true },
  { icon: Calculator, label: 'Position Size', path: '/position', active: false },
  { icon: BookOpen, label: 'Trading Journal', path: '/journal', active: false },
  { icon: Bell, label: 'Price Alert', path: '/alerts', active: false },
];

export function Navbar({ onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/95 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#F0B90B] flex items-center justify-center shadow-sm">
            <BarChart2 className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-sm tracking-tight">
            <span className="text-[#F0B90B]">Hedge</span>
            <span className="text-foreground">Bot Pro</span>
          </span>
        </div>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            item.active ? (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200',
                  location === item.path || (item.path === '/hedgebot' && location === '/')
                    ? 'bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            ) : (
              <button key={item.path} disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
                <span className="text-[9px] bg-muted px-1 rounded ml-0.5">Soon</span>
              </button>
            )
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 pt-14 animate-fade-in" onClick={() => setMenuOpen(false)}>
          <div className="bg-card/98 backdrop-blur-xl border-b border-border p-4 space-y-1 animate-slide-up" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item =>
              item.active ? (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                    location === item.path || (item.path === '/hedgebot' && location === '/')
                      ? 'bg-[#F0B90B]/15 text-[#F0B90B]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ) : (
                <div key={item.path} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-muted-foreground/40">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded ml-auto">Soon</span>
                </div>
              )
            )}
            <div className="pt-2 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
