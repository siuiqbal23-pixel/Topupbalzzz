import { ArrowRight, ShieldCheck, User } from 'lucide-react';
import { formatMyr } from '../data/initialStoreData';
import type { PublicOrderSummary } from '../types/store';
import { PaymentStatusBadge, TopupStatusBadge } from './StatusBadge';

interface TransactionCheckViewProps {
  transactions: PublicOrderSummary[];
  onGoToProfile: () => void;
}

export function TransactionCheckView({
  transactions,
  onGoToProfile,
}: TransactionCheckViewProps) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-5 py-5 sm:py-8 space-y-5">
      <div className="space-y-1">
        <h1 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          Aktiviti Transaksi Terkini
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Paparan transaksi sebenar secara langsung tanpa mendedahkan maklumat peribadi pembeli.
        </p>
      </div>

      {/* Privacy Notice Directing Users to Profile */}
      <div className="rounded-xl border border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Kod ID Pembelian Dilindungi Privasi
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Kod ID pembelian dan butiran invois tidak dipaparkan di sini. Untuk menyemak kod ID pembelian anda sendiri, sila buka tab{' '}
              <span className="font-semibold">Profil &rarr; Kod &amp; Sejarah</span>.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToProfile}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <User className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Semak di Profil</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Real Anonymized Public Transaction Feed */}
      <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#10141C]">
              <tr className="text-slate-600 dark:text-slate-400">
                <th className="px-3.5 py-2.5 font-semibold">Masa</th>
                <th className="px-3.5 py-2.5 font-semibold">Game &amp; Produk</th>
                <th className="px-3.5 py-2.5 font-semibold">Bayaran</th>
                <th className="px-3.5 py-2.5 font-semibold text-right">Jumlah</th>
                <th className="px-3.5 py-2.5 font-semibold">Status Bayar</th>
                <th className="px-3.5 py-2.5 font-semibold">Status Topup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    Belum ada transaksi sebenar direkodkan buat masa ini.
                  </td>
                </tr>
              ) : (
                transactions.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 font-mono-tabular whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString('ms-MY', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {order.brandName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.productName}
                      </p>
                    </td>
                    <td className="px-3.5 py-2.5 text-[11px] font-mono-tabular text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {order.paymentChannelCode}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono-tabular font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatMyr(order.totalAmount)}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <TopupStatusBadge status={order.topupStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
