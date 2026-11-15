import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import type { OrderStatus } from '../types/store';

interface StatusLabelProps {
  status: OrderStatus;
}

export function StatusLabel({ status }: StatusLabelProps) {
  if (status === 'Selesai') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Selesai</span>
      </span>
    );
  }

  if (status === 'Sedang Diproses') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 whitespace-nowrap">
        <Loader2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Sedang Diproses</span>
      </span>
    );
  }

  if (status === 'Menunggu Bayaran') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Menunggu Bayaran</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Dibatalkan</span>
    </span>
  );
}
