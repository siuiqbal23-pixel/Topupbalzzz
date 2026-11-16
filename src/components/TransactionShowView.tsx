import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Upload,
} from 'lucide-react';
import {
  buildCustomerWhatsAppUrl,
  formatLocalMyPhone,
  formatMyr,
  isPlaceholderPhoneValue,
  normalizePhoneForWa,
  resolvePaymentAccountDisplay,
} from '../data/initialStoreData';
import type { OrderItem, TopupBalzStoreState } from '../types/store';
import { GameImage } from './GameImage';
import { PaymentStatusBadge, TopupStatusBadge } from './StatusBadge';

interface TransactionShowViewProps {
  order: OrderItem;
  store: TopupBalzStoreState;
  onUploadProof: (orderReference: string, dataUrl: string) => void;
}

export function TransactionShowView({
  order,
  store,
  onUploadProof,
}: TransactionShowViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState('');

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const rawMatchedPayment = store.paymentAccounts.find(
    (p) => p.id === order.paymentAccountId
  );
  const resolvedPayment = rawMatchedPayment
    ? resolvePaymentAccountDisplay(rawMatchedPayment, store.settings)
    : undefined;

  const isTelegramFlow =
    resolvedPayment?.notifyChannel === 'telegram' ||
    (!resolvedPayment?.notifyChannel &&
      order.paymentChannelCode.toUpperCase() === 'TNG');

  const requiresProof = Boolean(
    resolvedPayment?.requireProof ||
      isTelegramFlow ||
      order.paymentChannelCode.toUpperCase() === 'TNG'
  );

  const adminSource = !isPlaceholderPhoneValue(store.settings.whatsappCs)
    ? store.settings.whatsappCs
    : !isPlaceholderPhoneValue(store.settings.phone)
      ? store.settings.phone
      : '';
  const displayAccountNumber = isPlaceholderPhoneValue(
    order.paymentAccountNumber
  )
    ? resolvedPayment && !isPlaceholderPhoneValue(resolvedPayment.accountNumber)
      ? resolvedPayment.accountNumber
      : adminSource
        ? formatLocalMyPhone(adminSource)
        : order.paymentAccountNumber
    : order.paymentAccountNumber;

  const qrImageUrl =
    resolvedPayment?.qrImageUrl ||
    (order.paymentChannelCode.toUpperCase() === 'TNG'
      ? '/assets/aistudio/20260920_125927_866903c8.jpg'
      : undefined);

  const rawTgUrl = (store.settings.telegramChannelUrl || '').trim();
  const telegramChannelUrl = rawTgUrl
    ? rawTgUrl.startsWith('@')
      ? `https://t.me/${rawTgUrl.slice(1)}`
      : rawTgUrl.startsWith('http://') || rawTgUrl.startsWith('https://')
        ? rawTgUrl
        : `https://${rawTgUrl}`
    : '';
  const telegramChannelName =
    store.settings.telegramChannelName || 'Telegram Info Channel';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadFeedback('Sila pilih fail gambar (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result) return;
      const done = (finalUrl: string) => {
        onUploadProof(order.reference, finalUrl);
        setUploadFeedback(
          isTelegramFlow
            ? 'Bukti bayaran disimpan! Sila semak status transaksi anda di Telegram Info Channel.'
            : 'Bukti bayaran disimpan! Tekan butang WhatsApp untuk semakan pantas.'
        );
      };
      if (file.size <= 350 * 1024 || file.type === 'image/svg+xml') {
        done(result);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1080;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          done(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        done(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => done(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const customerWaUrl = buildCustomerWhatsAppUrl(store, order);
  const csWaUrl = `https://wa.me/${normalizePhoneForWa(store.settings.whatsappCs)}`;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Detail Transaksi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isTelegramFlow
                ? 'Sila buat bayaran TNG dan semak status transaksi anda di Telegram Info Channel'
                : 'Maklumat lengkap pesanan dan panduan pembayaran manual WhatsApp'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tabular text-sm font-semibold text-orange-600 dark:text-orange-400">
              {order.reference}
            </span>
            <button
              type="button"
              onClick={() => handleCopy('ref', order.reference)}
              className="p-1.5 rounded-md border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Salin nombor invois"
            >
              {copiedKey === 'ref' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* Left Column: OrderDetails */}
          <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 shadow-sm space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Detail Pesanan
            </h2>

            {/* Product Info */}
            <div className="flex gap-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1117] border border-slate-200/70 dark:border-white/[0.06] p-3.5">
              <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                <GameImage
                  src={order.brandImage}
                  alt={order.brandName}
                  title={order.brandName}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {order.brandName}
                </p>
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {order.productName}
                </p>
                <p className="mt-1 text-sm font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
                  {formatMyr(order.subtotal)}
                </p>
              </div>
            </div>

            {/* Game Account Details */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-[#0E1117] border border-slate-200/70 dark:border-white/[0.06] p-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ID Akaun Game
                </p>
                <p className="mt-0.5 font-mono-tabular font-semibold text-slate-900 dark:text-white">
                  {order.accountId}
                </p>
              </div>
              {order.serverId ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Server / Zone
                  </p>
                  <p className="mt-0.5 font-mono-tabular font-semibold text-slate-900 dark:text-white">
                    {order.serverId}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Nama</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {order.customerName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">No. WhatsApp</span>
                <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                  {order.whatsapp}
                </span>
              </div>
              {order.email ? (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">E-mel</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {order.email}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-slate-200 dark:border-white/[0.08] pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Harga Produk</span>
                <span className="font-mono-tabular text-slate-900 dark:text-white">
                  {formatMyr(order.subtotal)}
                </span>
              </div>
              {order.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Diskaun ({order.voucherCode})</span>
                  <span className="font-mono-tabular">
                    -{formatMyr(order.discountAmount)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-slate-200 dark:border-white/[0.08] pt-3">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Total Bayaran
                </span>
                <span className="font-display text-xl font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
                  {formatMyr(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Statuses */}
            <div className="space-y-2.5 border-t border-slate-200 dark:border-white/[0.08] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Status Pembayaran
                </span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Status Topup
                </span>
                <TopupStatusBadge status={order.topupStatus} />
              </div>
            </div>
          </section>

          {/* Right Column: Manual Payment Instructions & WhatsApp Checkout */}
          <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 shadow-sm space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Instruksi Pembayaran Manual
            </h2>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0E1117] border border-slate-200/70 dark:border-white/[0.06] p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saluran Pembayaran Dipilih
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {order.paymentMethodName} ({order.paymentChannelCode})
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nombor Akaun / Rujukan
                  </p>
                  <p className="font-mono-tabular text-lg font-bold text-orange-600 dark:text-orange-400">
                    {displayAccountNumber}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Atas Nama: {order.paymentAccountLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('acct', displayAccountNumber)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shrink-0"
                >
                  {copiedKey === 'acct' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'acct' ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              {qrImageUrl ? (
                <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-col items-center gap-2.5">
                  <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-black p-2">
                    <img
                      src={qrImageUrl}
                      alt={`QR Bayaran ${order.paymentMethodName}`}
                      className="h-52 w-52 object-contain rounded-lg"
                    />
                  </div>
                  <a
                    href={qrImageUrl}
                    download={`QR-${order.paymentChannelCode}.jpg`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white/10 text-xs font-semibold text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Muat Turun Gambar QR</span>
                  </a>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0E1117] border border-slate-200/70 dark:border-white/[0.06] p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jumlah Perlu Dibayar
                </p>
                <p className="font-display text-2xl font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
                  {formatMyr(order.totalAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('amt', order.totalAmount.toFixed(2))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shrink-0"
              >
                {copiedKey === 'amt' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'amt' ? 'Disalin' : 'Salin Jumlah'}</span>
              </button>
            </div>

            {/* Primary Verification Action: Telegram Info Channel (for TNG) OR WhatsApp */}
            {isTelegramFlow ? (
              <div className="rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Semakan Transaksi via {telegramChannelName}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Notifikasi pembelian dengan kod rujukan{' '}
                    <span className="font-mono-tabular font-semibold">
                      {order.reference}
                    </span>{' '}
                    dihantar terus ke Telegram Info Channel. Sila semak status pengesahan bayaran &amp; topup anda di sana.
                  </p>
                </div>

                {telegramChannelUrl ? (
                  <a
                    href={telegramChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Cek Transaksi di {telegramChannelName}</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Pautan Telegram Info Channel belum ditetapkan oleh Admin. Anda masih boleh menyemak status invois ini di halaman Profil anda.
                  </p>
                )}
              </div>
            ) : (
              <a
                href={customerWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Hantar Detail &amp; Bukti via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}

            {/* Upload Bukti Transfer */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bukti Bayaran{' '}
                {requiresProof && !order.paymentProofUrl ? (
                  <span className="text-rose-500">(Wajib Pilih Fail *)</span>
                ) : order.paymentProofUrl ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    (Telah Dimuat Naik)
                  </span>
                ) : (
                  <span className="text-slate-400">(Pilihan)</span>
                )}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-lg border border-dashed border-slate-300 dark:border-white/20 hover:border-orange-500 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>
                  {order.paymentProofUrl
                    ? 'Tukar Gambar Bukti Bayaran'
                    : 'Pilih Fail Bukti Bayaran (JPG / PNG)'}
                </span>
              </button>

              {uploadFeedback ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {uploadFeedback}
                </p>
              ) : null}

              {order.paymentProofUrl ? (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pratonton bukti bayaran:
                  </p>
                  <img
                    src={order.paymentProofUrl}
                    alt="Bukti bayaran"
                    className="max-h-56 w-full rounded-lg border border-slate-200 dark:border-white/10 object-contain bg-black/5 dark:bg-black/40"
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Delivery Progress Card */}
        <section className="mt-6 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 shadow-sm">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
            Status Pemprosesan Manual
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className={`rounded-xl border p-4 ${
                order.paymentStatus === 2
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    order.paymentStatus === 2
                      ? 'text-emerald-500'
                      : 'text-slate-400'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  1. Bayaran Disahkan
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {order.paymentStatus === 2
                  ? 'Pembayaran manual telah diterima oleh admin.'
                  : isTelegramFlow
                    ? 'Menunggu pengesahan bayaran TNG (semak di Telegram Info Channel).'
                    : 'Menunggu resit atau pengesahan WhatsApp.'}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                order.topupStatus >= 1 && order.topupStatus !== 3
                  ? 'border-sky-500/40 bg-sky-500/10'
                  : 'border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 ${
                    order.topupStatus >= 1 && order.topupStatus !== 3
                      ? 'text-sky-500'
                      : 'text-slate-400'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  2. Sedang Diproses
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {order.topupStatus === 1
                  ? 'Admin sedang menghantar item ke ID akaun anda.'
                  : order.topupStatus === 2
                    ? 'Pemprosesan telah lengkap.'
                    : 'Menunggu giliran pengesahan.'}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                order.topupStatus === 2
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : order.topupStatus === 3
                    ? 'border-rose-500/40 bg-rose-500/10'
                    : 'border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2">
                {order.topupStatus === 3 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      order.topupStatus === 2
                        ? 'text-emerald-500'
                        : 'text-slate-400'
                    }`}
                  />
                )}
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  3. Selesai Dikreditkan
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {order.topupStatus === 2
                  ? 'Topup telah berjaya masuk ke akaun game anda.'
                  : order.topupStatus === 3
                    ? 'Pesanan bermasalah atau dibatalkan. Hubungi CS.'
                    : 'Menunggu selesai.'}
              </p>
            </div>
          </div>

          {order.notes ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Nota Admin: <span className="text-slate-800 dark:text-slate-200">{order.notes}</span>
            </p>
          ) : null}
        </section>

        {/* Help Section */}
        <div className="mt-6 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Perlukan bantuan lanjut berkenaan pesanan ini?
          </p>
          <a
            href={csWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>Chat CS di WhatsApp</span>
          </a>
        </div>
      </div>
    </main>
  );
}
