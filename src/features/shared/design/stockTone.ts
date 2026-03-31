import { StockStatus } from '../../../types';

export const stockToneClassMap: Record<StockStatus, string> = {
  'In stock': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Low stock': 'bg-amber-50 text-amber-700 border-amber-100',
  Waitlist: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};
