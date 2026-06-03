/**
 * Utility functions for banking manager app
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('es-AR', options);
}

export interface BankColorTheme {
  bgGradient: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  glow: string;
}

export const BANK_COLOR_THEMES: Record<string, BankColorTheme> = {
  indigo: {
    bgGradient: 'from-indigo-600 via-indigo-700 to-indigo-900',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-200',
    badgeBg: 'bg-indigo-500/20 text-indigo-200',
    glow: 'shadow-indigo-500/20'
  },
  emerald: {
    bgGradient: 'from-emerald-600 via-emerald-700 to-emerald-900',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-200',
    badgeBg: 'bg-emerald-500/20 text-emerald-200',
    glow: 'shadow-emerald-500/20'
  },
  rose: {
    bgGradient: 'from-rose-600 via-rose-700 to-rose-900',
    borderColor: 'border-rose-500',
    textColor: 'text-rose-200',
    badgeBg: 'bg-rose-500/20 text-rose-200',
    glow: 'shadow-rose-500/20'
  },
  amber: {
    bgGradient: 'from-amber-500 via-amber-600 to-amber-800',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-100',
    badgeBg: 'bg-amber-500/20 text-amber-200',
    glow: 'shadow-amber-500/20'
  },
  violet: {
    bgGradient: 'from-violet-600 via-violet-700 to-violet-900',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-200',
    badgeBg: 'bg-violet-500/20 text-violet-200',
    glow: 'shadow-violet-500/20'
  },
  blue: {
    bgGradient: 'from-blue-600 via-blue-700 to-blue-900',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-200',
    badgeBg: 'bg-blue-500/20 text-blue-200',
    glow: 'shadow-blue-500/20'
  },
  dark: {
    bgGradient: 'from-zinc-800 via-zinc-900 to-black',
    borderColor: 'border-zinc-700',
    textColor: 'text-zinc-400',
    badgeBg: 'bg-zinc-800 text-zinc-300',
    glow: 'shadow-zinc-900/30'
  }
};
