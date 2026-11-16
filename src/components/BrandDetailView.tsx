import { useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Headphones,
  Lock,
  LogIn,
  Maximize2,
  MessageCircle,
  Send,
  ShieldCheck,
  Star,
  TicketPercent,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import {
  formatMyr,
  normalizePhoneForWa,
  resolvePaymentAccountDisplay,
} from '../data/initialStoreData';
import type {
  BrandItem,
  ManualPaymentAccount,
  OrderItem,
  ProductItem,
  TopupBalzStoreState,
} from '../types/store';
import { GameImage } from './GameImage';

interface BrandDetailViewProps {
  brand: BrandItem;
  store: TopupBalzStoreState;
  onCreateOrder: (
    payload: Omit<
      OrderItem,
      'id' | 'reference' | 'createdAt' | 'paymentStatus' | 'topupStatus'
    >
  ) => Promise<OrderItem | null>;
  onOrderCreated: (reference: string) => void;
  onRequireLogin: () => void;
}

export function BrandDetailView({
  brand,
  store,
  onCreateOrder,
  onOrderCreated,
  onRequireLogin,
}: BrandDetailViewProps) {
  const activeProducts = useMemo(
    () => brand.products.filter((p) => p.active),
    [brand.products]
  );
  const activePayments = useMemo(
    () =>
      store.paymentAccounts
        .filter((p) => p.active)
        .map((p) => resolvePaymentAccountDisplay(p, store.settings)),
    [store.paymentAccounts, store.settings]
  );
  const activeFaqs = useMemo(
    () => store.faqs.filter((f) => f.active),
    [store.faqs]
  );

  const proofInputRef = useRef<HTMLInputElement | null>(null);
  const [accountId, setAccountId] = useState('');
  const [serverId, setServerId] = useState(brand.serverOptions?.[0] ?? '');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    activeProducts[0]?.id ?? ''
  );
  const [customerName, setCustomerName] = useState(
    store.user.loggedIn ? store.user.name : ''
  );
  const [whatsapp, setWhatsapp] = useState(
    store.user.loggedIn ? store.user.phone : ''
  );
  const [email, setEmail] = useState(
    store.user.loggedIn ? store.user.email : ''
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    activePayments[0]?.id ?? ''
  );
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [proofError, setProofError] = useState<string | null>(null);
  const [copiedAcct, setCopiedAcct] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(
    null
  );
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    activeFaqs[0]?.id ?? null
  );

  const selectedProduct: ProductItem | undefined = useMemo(
    () =>
      activeProducts.find((p) => p.id === selectedProductId) ??
      activeProducts[0],
    [activeProducts, selectedProductId]
  );

  const selectedPayment: ManualPaymentAccount | undefined = useMemo(
    () =>
      activePayments.find((p) => p.id === selectedPaymentId) ??
      activePayments[0],
    [activePayments, selectedPaymentId]
  );

  const isTelegramFlow =
    selectedPayment?.notifyChannel === 'telegram' ||
    (!selectedPayment?.notifyChannel &&
      selectedPayment?.channelCode.toUpperCase() === 'TNG');

  const requiresProof = Boolean(
    selectedPayment?.requireProof ||
      isTelegramFlow ||
      selectedPayment?.channelCode.toUpperCase() === 'TNG'
  );

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProofError('Sila pilih fail gambar (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl) return;
      if (file.size <= 350 * 1024 || file.type === 'image/svg+xml') {
        setPaymentProofUrl(rawDataUrl);
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
          setPaymentProofUrl(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        setPaymentProofUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => setPaymentProofUrl(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const discountAmount = useMemo(() => {
    if (!appliedVoucherCode || !selectedProduct) return 0;
    const voucher = store.vouchers.find(
      (v) => v.active && v.code.toUpperCase() === appliedVoucherCode.toUpperCase()
    );
    if (!voucher) return 0;
    if (selectedProduct.sellPrice < voucher.minPurchase) return 0;
    if (voucher.type === 'fixed') {
      return Math.min(voucher.value, selectedProduct.sellPrice);
    }
    return Math.min(
      Math.round(selectedProduct.sellPrice * (voucher.value / 100) * 100) / 100,
      selectedProduct.sellPrice
    );
  }, [appliedVoucherCode, selectedProduct, store.vouchers]);

  const totalAmount = useMemo(() => {
    if (!selectedProduct) return 0;
    return Math.max(0, selectedProduct.sellPrice - discountAmount);
  }, [selectedProduct, discountAmount]);

  const handleApplyVoucher = () => {
    setVoucherError(null);
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (!selectedProduct) {
      setVoucherError('Sila pilih produk terlebih dahulu.');
      return;
    }
    const found = store.vouchers.find(
      (v) => v.active && v.code.toUpperCase() === code
    );
    if (!found) {
      setVoucherError('Kod voucher tidak sah atau telah tamat.');
      setAppliedVoucherCode(null);
      return;
    }
    if (selectedProduct.sellPrice < found.minPurchase) {
      setVoucherError(
        `Pembelian minimum ${formatMyr(found.minPurchase)} diperlukan untuk kod ini.`
      );
      setAppliedVoucherCode(null);
      return;
    }
    setAppliedVoucherCode(found.code);
  };

  const handleRemoveVoucher = () => {
    setVoucherInput('');
    setAppliedVoucherCode(null);
    setVoucherError(null);
  };

  const handleCheckout = async () => {
    setFormError(null);
    if (!store.user.loggedIn) {
      onRequireLogin();
      return;
    }
    if (!accountId.trim()) {
      setFormError(`Mohon isi ${brand.idLabel} anda.`);
      return;
    }
    if (brand.inputType === 'id+server' && !serverId.trim()) {
      setFormError(`Mohon isi ${brand.serverLabel || 'Server ID'} anda.`);
      return;
    }
    if (!selectedProduct) {
      setFormError('Mohon pilih pakej produk.');
      return;
    }
    if (!customerName.trim() || !whatsapp.trim() || whatsapp.trim().length < 9) {
      setFormError('Mohon lengkapkan nama dan nombor WhatsApp yang sah.');
      return;
    }
    if (!selectedPayment) {
      setFormError('Mohon pilih kaedah bayaran manual.');
      return;
    }
    if (requiresProof && !paymentProofUrl) {
      setFormError(
        `Sila muat naik bukti bayaran ${selectedPayment.name} (pilih fail gambar resit) sebelum membuat pembelian.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await onCreateOrder({
        brandId: brand.id,
        brandSlug: brand.slug,
        brandName: brand.name,
        brandImage: brand.image,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        accountId: accountId.trim(),
        serverId: brand.inputType === 'id+server' ? serverId.trim() : undefined,
        customerName: customerName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || undefined,
        paymentAccountId: selectedPayment.id,
        paymentMethodName: selectedPayment.name,
        paymentChannelCode: selectedPayment.channelCode,
        paymentAccountNumber: selectedPayment.accountNumber,
        paymentAccountLabel: selectedPayment.accountLabel,
        subtotal: selectedProduct.sellPrice,
        discountAmount,
        voucherCode: appliedVoucherCode ?? undefined,
        totalAmount,
        paymentProofUrl: paymentProofUrl || undefined,
        notes: isTelegramFlow
          ? 'Pesanan TNG dibuat bersama bukti bayaran. Notifikasi dihantar ke Telegram Info Channel untuk semakan transaksi.'
          : 'Pesanan manual dibuat. Menunggu pengesahan resit di WhatsApp.',
      });

      if (created) {
        onOrderCreated(created.reference);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal mencipta pesanan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const csWaUrl = `https://wa.me/${normalizePhoneForWa(store.settings.whatsappCs)}`;

  return (
    <main className="w-full flex-1">
      {/* Compact Brand Banner */}
      <section className="relative h-36 sm:h-48 overflow-hidden bg-slate-900">
        <GameImage
          src={brand.banner || brand.image}
          alt={brand.name}
          title={brand.name}
          loading="eager"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

        <div className="absolute right-0 bottom-0 left-0 p-3 sm:p-5">
          <div className="mx-auto max-w-6xl flex items-end gap-3">
            <div className="h-14 w-14 sm:h-20 sm:w-20 overflow-hidden rounded-xl border-2 border-white/20 bg-slate-900 shadow-lg shrink-0">
              <GameImage
                src={brand.image}
                alt={brand.name}
                title={brand.name}
                loading="eager"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-orange-400">
                {brand.publisher} · {brand.currencyUnit}
              </p>
              <h1 className="font-display text-lg sm:text-2xl font-bold text-white truncate">
                {brand.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-200">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" aria-hidden="true" />
                  1–5 Minit
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-orange-400" aria-hidden="true" />
                  WhatsApp
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-orange-400" aria-hidden="true" />
                  Tanpa Password
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Checkout Grid */}
      <div className="mx-auto max-w-6xl px-3 sm:px-5 py-4 sm:py-6 space-y-4">
        {/* Mandatory Login Warning if logged out */}
        {!store.user.loggedIn ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-semibold">Wajib Log Masuk:</span> Anda perlu log masuk akaun terlebih dahulu sebelum membuat pembelian.
              </span>
            </div>
            <button
              type="button"
              onClick={onRequireLogin}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log Masuk Sekarang</span>
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3 items-start">
          {/* Left Column (Steps 1-4 + Description) */}
          <div className="space-y-4 lg:col-span-2">
            {/* Step 1: Account Data */}
            <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white shrink-0">
                  1
                </span>
                <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Masukkan Data Akaun Game
                </h2>
              </div>

              <div
                className={`grid gap-3 ${
                  brand.inputType === 'id+server' ? 'sm:grid-cols-2' : ''
                }`}
              >
                <div>
                  <label
                    htmlFor="accountId"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {brand.idLabel}
                  </label>
                  <input
                    id="accountId"
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder={brand.idPlaceholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {brand.inputType === 'id+server' ? (
                  <div>
                    <label
                      htmlFor="serverId"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      {brand.serverLabel || 'Server ID'}
                    </label>
                    {brand.serverOptions && brand.serverOptions.length > 0 ? (
                      <select
                        id="serverId"
                        value={serverId}
                        onChange={(e) => setServerId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {brand.serverOptions.map((srv) => (
                          <option key={srv} value={srv}>
                            {srv}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="serverId"
                        type="text"
                        value={serverId}
                        onChange={(e) => setServerId(e.target.value)}
                        placeholder={brand.serverPlaceholder || 'Contoh: 2948'}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    )}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Pastikan {brand.idLabel} anda tepat. Kami tidak memerlukan kata laluan akaun anda.
              </p>
            </section>

            {/* Step 2: Select Product */}
            <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white shrink-0">
                    2
                  </span>
                  <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Pilih Produk ({brand.currencyUnit})
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {activeProducts.length} pilihan
                </span>
              </div>

              {activeProducts.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Tiada produk tersedia buat masa ini.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {activeProducts.map((product) => {
                    const isSelected = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className={`flex flex-col justify-between overflow-hidden rounded-lg border-2 p-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                            : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1117] hover:border-orange-500/50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                            {product.name}
                          </p>
                          {product.bonus ? (
                            <p className="mt-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                              {product.bonus}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-baseline gap-1.5">
                          <span className="text-xs sm:text-sm font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
                            {formatMyr(product.sellPrice)}
                          </span>
                          {product.originalPrice &&
                          product.originalPrice > product.sellPrice ? (
                            <span className="text-[11px] font-mono-tabular text-slate-400 line-through">
                              {formatMyr(product.originalPrice)}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 3: Contact Details */}
            <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white shrink-0">
                  3
                </span>
                <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Detail Kontak
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nama Pembeli
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama lengkap anda"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="whatsapp"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nombor WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    E-mel (Pilihan)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </section>

            {/* Step 4: Manual Payment via WhatsApp / Bank / QR */}
            <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white shrink-0">
                    4
                  </span>
                  <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Kaedah Bayaran Manual
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Caj Admin RM 0.00
                </span>
              </div>

              <div className="space-y-2">
                {activePayments.map((method) => {
                  const active = selectedPayment?.id === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentId(method.id);
                        setFormError(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all cursor-pointer ${
                        active
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                          : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1117] hover:border-orange-500/50'
                      }`}
                    >
                      <div className="h-8 w-11 rounded-md bg-slate-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0">
                        {method.type === 'whatsapp' ? (
                          <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Wallet className="w-4 h-4 text-orange-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {method.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular truncate">
                          {method.accountNumber} · {method.accountLabel}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                        RM 0.00
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedPayment &&
              (selectedPayment.qrImageUrl || requiresProof) ? (
                <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-50/70 dark:bg-[#0E1117] p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Panduan Bayaran {selectedPayment.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedPayment.instructions}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-tabular text-xs font-bold text-orange-600 dark:text-orange-400">
                        {selectedPayment.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard
                            ?.writeText(selectedPayment.accountNumber)
                            .catch(() => {});
                          setCopiedAcct(true);
                          setTimeout(() => setCopiedAcct(false), 1800);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-[#141923] text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        {copiedAcct ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedAcct ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  {selectedPayment.qrImageUrl ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/15 bg-black p-2 shadow-sm">
                        <img
                          src={selectedPayment.qrImageUrl}
                          alt={`QR Bayaran ${selectedPayment.name}`}
                          className="h-56 w-56 sm:h-64 sm:w-64 object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQrZoomOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Besarkan QR</span>
                        </button>
                        <a
                          href={selectedPayment.qrImageUrl}
                          download={`QR-${selectedPayment.channelCode}.jpg`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white/10 text-xs font-semibold text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Muat Turun QR</span>
                        </a>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Bukti Bayaran{' '}
                        {requiresProof ? (
                          <span className="text-rose-500">(Wajib Pilih Fail *)</span>
                        ) : (
                          <span className="text-slate-400">(Pilihan)</span>
                        )}
                      </label>
                      {paymentProofUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          Resit dilampirkan
                        </span>
                      ) : null}
                    </div>

                    <input
                      ref={proofInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => proofInputRef.current?.click()}
                      className={`w-full py-2.5 px-4 rounded-lg border-2 border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        paymentProofUrl
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-orange-500/50 hover:border-orange-500 bg-white dark:bg-[#141923] text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {paymentProofUrl
                          ? 'Tukar Fail Bukti Bayaran'
                          : 'Pilih Fail Bukti Bayaran (Resit / Screenshot)'}
                      </span>
                    </button>

                    {proofError ? (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {proofError}
                      </p>
                    ) : null}

                    {paymentProofUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923]">
                        <img
                          src={paymentProofUrl}
                          alt="Pratonton bukti bayaran"
                          className="max-h-52 w-full object-contain bg-black/5 dark:bg-black/40"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProofUrl('');
                            if (proofInputRef.current) {
                              proofInputRef.current.value = '';
                            }
                          }}
                          aria-label="Buang bukti bayaran"
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>

            {qrZoomOpen && selectedPayment?.qrImageUrl ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                onClick={() => setQrZoomOpen(false)}
              >
                <div
                  className="relative max-w-sm w-full rounded-2xl bg-[#141923] border border-white/10 p-4 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">
                      QR Bayaran {selectedPayment.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setQrZoomOpen(false)}
                      aria-label="Tutup QR"
                      className="p-1 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <img
                    src={selectedPayment.qrImageUrl}
                    alt={`QR Bayaran ${selectedPayment.name}`}
                    className="w-full rounded-xl object-contain bg-black"
                  />
                  <a
                    href={selectedPayment.qrImageUrl}
                    download={`QR-${selectedPayment.channelCode}.jpg`}
                    className="flex w-full items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white"
                  >
                    <Download className="w-4 h-4" />
                    <span>Muat Turun Gambar QR</span>
                  </a>
                </div>
              </div>
            ) : null}

            {/* Brand Description */}
            {brand.description ? (
              <section className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Deskripsi {brand.name}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {brand.description}
                </p>
              </section>
            ) : null}
          </div>

          {/* Right Column: Sticky Rating, CS, Voucher, Order Summary */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
            {/* Review Rating */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Ulasan &amp; Rating Pelanggan
              </h3>
              <div className="flex items-center gap-2.5">
                <div className="font-display text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                  {brand.rating.toFixed(2)}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {brand.totalReviews.toLocaleString('ms-MY')} transaksi
                  </p>
                </div>
              </div>
            </div>

            {/* Contact CS */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Perlukan Bantuan?
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
                    Hubungi khidmat pelanggan kami di WhatsApp.
                  </p>
                  <a
                    href={csWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    <span>Hubungi CS WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Voucher Code */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">
                Kod Voucher
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TicketPercent
                    className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    disabled={!!appliedVoucherCode}
                    placeholder="Contoh: TOPUPBALZ"
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                  />
                </div>
                {!appliedVoucherCode ? (
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={!voucherInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-xs font-semibold text-white disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  >
                    Gunakan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  >
                    Buang
                  </button>
                )}
              </div>
              {voucherError ? (
                <p className="mt-1.5 text-[11px] text-rose-500">{voucherError}</p>
              ) : null}
              {appliedVoucherCode ? (
                <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Voucher {appliedVoucherCode} aktif! Jimat {formatMyr(discountAmount)}.
                </p>
              ) : null}
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 shadow-sm space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Ringkasan Pesanan
              </h3>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Game:</span>
                  <span className="font-medium text-slate-900 dark:text-white text-right">
                    {brand.name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Item:</span>
                  <span className="font-medium text-slate-900 dark:text-white text-right">
                    {selectedProduct?.name ?? '-'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Harga:</span>
                  <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                    {selectedProduct ? formatMyr(selectedProduct.sellPrice) : 'RM 0.00'}
                  </span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                    <span>Diskaun ({appliedVoucherCode}):</span>
                    <span className="font-mono-tabular font-semibold">
                      -{formatMyr(discountAmount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Bayaran:</span>
                  <span className="font-medium text-slate-900 dark:text-white text-right">
                    {selectedPayment?.channelCode ?? '-'}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-white/[0.08] pt-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Total Bayaran:
                  </span>
                  <span className="font-display text-lg font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
                    {formatMyr(totalAmount)}
                  </span>
                </div>
              </div>

              {formError ? (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-400"
                >
                  {formError}
                </p>
              ) : null}

              {store.user.loggedIn ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCheckout}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      isTelegramFlow
                        ? 'bg-sky-600 hover:bg-sky-500'
                        : 'bg-orange-600 hover:bg-orange-500'
                    }`}
                  >
                    {isTelegramFlow ? (
                      <Send className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <BadgeCheck className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>
                      {submitting
                        ? 'Menyimpan Pesanan...'
                        : isTelegramFlow
                          ? 'Beli Sekarang · Semak di Telegram'
                          : 'Beli Sekarang & Hantar ke WhatsApp'}
                    </span>
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                    {isTelegramFlow
                      ? 'Notifikasi pesanan akan dihantar ke Telegram Info Channel untuk semakan status transaksi.'
                      : 'Butiran pesanan akan disediakan untuk dihantar terus ke WhatsApp Admin.'}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>Log Masuk untuk Beli</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        {activeFaqs.length > 0 ? (
          <section className="pt-2">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3">
              Soalan Lazim (FAQ)
            </h2>
            <div className="space-y-2">
              {activeFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen ? (
                      <div className="px-3.5 pb-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
