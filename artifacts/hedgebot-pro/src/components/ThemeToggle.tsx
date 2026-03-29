import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative inline-flex items-center rounded-full border border-border transition-all duration-300',
        size === 'sm' ? 'w-11 h-6 p-0.5' : 'w-14 h-7 p-1',
        isDark ? 'bg-[#F0B90B]/20 border-[#F0B90B]/30' : 'bg-sky-100 border-sky-200',
        className
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full transition-all duration-300',
          size === 'sm' ? 'w-5 h-5' : 'w-5 h-5',
          isDark
            ? 'translate-x-full bg-[#F0B90B] text-black'
            : 'translate-x-0 bg-white text-sky-600 shadow-sm'
        )}
      >
        {isDark
          ? <Moon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          : <Sun className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        }
      </span>
    </button>
  );
}
