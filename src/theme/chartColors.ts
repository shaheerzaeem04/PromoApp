import { useTheme } from './ThemeProvider';

function rgbVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `rgb(${value})` : fallback;
}

export function useChartColors() {
  useTheme();
  return {
    grid: rgbVar('--app-zinc-800', '#27272a'),
    axis: rgbVar('--app-zinc-500', '#71717a'),
    tooltipBg: rgbVar('--app-zinc-900', '#18181b'),
    tooltipBorder: rgbVar('--app-zinc-700', '#3f3f46'),
    tooltipFg: rgbVar('--app-zinc-100', '#f4f4f5'),
    views: '#14b8a6',
    unique: '#2dd4bf',
    participants: '#f59e0b',
    entries: '#38bdf8',
    referrals: rgbVar('--app-zinc-400', '#a1a1aa'),
    bar: '#14b8a6',
  };
}
