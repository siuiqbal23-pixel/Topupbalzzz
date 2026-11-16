import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import type { PaymentStatusCode, TopupStatusCode } from '../types/store';

export function PaymentStatusBadge({ status }: { status: PaymentStatusCode }) {
  if (status === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Lunas</span>
      </span>
    );
  }
  if (status === -1) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Dibatalkan</span>
      </span>
    );
  }
  if (status === -2) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Tamat Tempoh</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Menunggu Bayaran</span>
    </span>
  );
}

export function TopupStatusBadge({ status }: { status: TopupStatusCode }) {
  if (status === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Sukses</span>
      </span>
    );
  }
  if (status === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 whitespace-nowrap">
        <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" aria-hidden="true" />
        <span>Dalam Proses</span>
      </span>
    );
  }
  if (status === 3) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Gagal</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Menunggu</span>
    </span>
  );
}
