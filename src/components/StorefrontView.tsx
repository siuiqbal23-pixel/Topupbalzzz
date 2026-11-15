import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Search,
  ShieldCheck,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { HERO_BANNER_IMAGE, formatMyr } from '../data/initialStoreData';
import type {
  GameCategory,
  GameItem,
  OrderRecord,
  TopupBalzStoreState,
  TopupPackage,
} from '../types/store';
import { GameImage } from './GameImage';
import { StatusLabel } from './StatusBadge';

interface StorefrontViewProps {
  store: TopupBalzStoreState;
  onCreateOrder: (
    order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>
  ) => OrderRecord;
  onOpenAdmin: () => void;
}

const CATEGORIES: Array<'Semua' | GameCategory> = [
  'Semua',
  'Battle Royale',
  'MOBA',
  'Sukan',
  'RPG',
];

export function StorefrontView({
  store,
  onCreateOrder,
  onOpenAdmin,
}: StorefrontViewProps) {
  const activeGames = useMemo(
    () => store.games.filter((g) => g.active),
    [store.games]
  );

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'Semua' | GameCategory
  >('Semua');

  const [selectedGameId, setSelectedGameId] = useState<string>(
    activeGames[0]?.id ?? ''
  );
  const selectedGame: GameItem | undefined = useMemo(
    () =>
      activeGames.find((g) => g.id === selectedGameId) ?? activeGames[0],
    [activeGames, selectedGameId]
  );

  const activePackages = useMemo(
    () => (selectedGame ? selectedGame.packages.filter((p) => p.active) : []),
    [selectedGame]
  );

  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const selectedPackage: TopupPackage | undefined = useMemo(
    () =>
      activePackages.find((p) => p.id === selectedPackageId) ??
      activePackages[0],
    [activePackages, selectedPackageId]
  );

  const activePayments = useMemo(
    () => store.paymentMethods.filter((p) => p.active),
    [store.paymentMethods]
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    activePayments[0]?.id ?? ''
  );
  const selectedPayment = useMemo(
    () =>
      activePayments.find((p) => p.id === selectedPaymentId) ??
      activePayments[0],
    [activePayments, selectedPaymentId]
  );

  const [userGameId, setUserGameId] = useState('');
  const [serverId, setServerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [formError, setFormError] = useState('');
  const [latestReceipt, setLatestReceipt] = useState<OrderRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [lookupQuery, setLookupQuery] = useState('');

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeGames.filter((game) => {
      const matchCat =
        selectedCategory === 'Semua' || game.category === selectedCategory;
      const matchQuery =
        !q ||
        game.name.toLowerCase().includes(q) ||
        game.publisher.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeGames, searchQuery, selectedCategory]);

  // Compute live Ranking Topup from completed orders + bonus entries
  const rankingList = useMemo(() => {
    const totals = new Map<
      string,
      {
        playerName: string;
        favoriteGame: string;
        totalOrders: number;
        totalSpendMyr: number;
      }
    >();

    for (const entry of store.leaderboardBonusEntries) {
      const key = entry.playerName.trim().toLowerCase();
      totals.set(key, {
        playerName: entry.playerName,
        favoriteGame: entry.favoriteGame,
        totalOrders: entry.totalOrders,
        totalSpendMyr: entry.totalSpendMyr,
      });
    }

    for (const order of store.orders) {
      if (order.status !== 'Selesai') continue;
      const key = order.customerName.trim().toLowerCase();
      const existing = totals.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpendMyr += order.amountMyr;
        existing.favoriteGame = order.gameName;
      } else {
        totals.set(key, {
          playerName: order.customerName,
          favoriteGame: order.gameName,
          totalOrders: 1,
          totalSpendMyr: order.amountMyr,
        });
      }
    }

    return Array.from(totals.values())
      .sort((a, b) => b.totalSpendMyr - a.totalSpendMyr)
      .slice(0, 6);
  }, [store.leaderboardBonusEntries, store.orders]);

  const matchedOrders = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return store.orders.slice(0, 4);
    return store.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.whatsapp.toLowerCase().includes(q) ||
        o.userGameId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    );
  }, [lookupQuery, store.orders]);

  const handleSelectGame = (game: GameItem) => {
    setSelectedGameId(game.id);
    const firstPkg = game.packages.find((p) => p.active);
    setSelectedPackageId(firstPkg?.id ?? '');
    setFormError('');
    setLatestReceipt(null);
    const el = document.getElementById('topup-pantas');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedGame || !selectedPackage || !selectedPayment) {
      setFormError('Sila pilih game, pakej dan kaedah bayaran yang sah.');
      return;
    }
    if (!userGameId.trim()) {
      setFormError('Sila masukkan ID Pemain / UID anda.');
      return;
    }
    if (selectedGame.needsServerId && !serverId.trim()) {
      setFormError(`Sila masukkan Zone / Server ID untuk ${selectedGame.name}.`);
      return;
    }
    if (!customerName.trim()) {
      setFormError('Sila masukkan nama anda untuk rekod resit.');
      return;
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 9) {
      setFormError('Sila masukkan nombor WhatsApp yang sah (cth: 0123456789).');
      return;
    }

    const created = onCreateOrder({
      customerName: customerName.trim(),
      whatsapp: whatsapp.trim(),
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      userGameId: userGameId.trim(),
      serverId: selectedGame.needsServerId ? serverId.trim() : undefined,
      packageId: selectedPackage.id,
      packageLabel: selectedPackage.label,
      amountMyr: selectedPackage.priceMyr,
      paymentMethod: selectedPayment.name,
    });

    setLatestReceipt(created);
    setUserGameId('');
    setServerId('');
  };

  const handleCopyOrderId = (orderId: string) => {
    navigator.clipboard?.writeText(orderId).catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const whatsappConfirmLink = useMemo(() => {
    if (!latestReceipt) return '#';
    const cleanNum = store.settings.whatsappNumber.replace(/\D/g, '');
    const idLine = latestReceipt.serverId
      ? `${latestReceipt.userGameId} (${latestReceipt.serverId})`
      : latestReceipt.userGameId;
    const msg = encodeURIComponent(
      `Hai ${store.settings.storeName}, saya sudah buat pesanan:\n` +
        `ID Pesanan: ${latestReceipt.id}\n` +
        `Game: ${latestReceipt.gameName}\n` +
        `Pakej: ${latestReceipt.packageLabel}\n` +
        `ID Pemain: ${idLine}\n` +
        `Jumlah: ${formatMyr(latestReceipt.amountMyr)}\n` +
        `Kaedah: ${latestReceipt.paymentMethod}\n` +
        `Saya lampirkan bukti bayaran.`
    );
    return `https://wa.me/${cleanNum}?text=${msg}`;
  }, [latestReceipt, store.settings]);

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100">
      {/* Slim Dismissible Top Promo Banner (<= 40px) */}
      {store.settings.bannerEnabled && !bannerDismissed ? (
        <div className="bg-[#151923] border-b border-white/[0.06] px-4 py-2 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="truncate font-medium">
              <span className="text-orange-400 font-semibold mr-2">Promosi</span>
              {store.settings.bannerText}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {store.settings.modalEnabled ? (
                <button
                  type="button"
                  onClick={() => setPromoModalOpen(true)}
                  className="text-orange-400 hover:text-orange-300 font-semibold whitespace-nowrap cursor-pointer"
                >
                  Info lanjut
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Tutup pengumuman"
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main>
        {/* Hero Split Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-5">
                <p className="text-xs font-semibold tracking-wider text-orange-400 uppercase">
                  Topup Rasmi Malaysia · Proses Pantas
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight text-white leading-[1.12] text-balance max-w-xl">
                  Topup Game Anda Dengan Mudah &amp; Murah!
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                  Tambah nilai Diamonds, UC dan FC Points tanpa perlu kata laluan akaun game. Harga telus dalam Ringgit Malaysia dengan semakan status pesanan secara terus.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <a
                    href="#topup-pantas"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById('topup-pantas')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <span>Pilih Game Sekarang</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                  {store.settings.modalEnabled ? (
                    <button
                      type="button"
                      onClick={() => setPromoModalOpen(true)}
                      className="px-5 py-3 rounded-lg border border-white/10 bg-[#12161F] hover:bg-[#191F2B] text-slate-200 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Lihat Promosi Web Baharu
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Clean Trust Indicators Strip (unboxed, typographic separation) */}
              <div className="mt-10 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-white">Proses Pantas</p>
                  <p className="text-slate-400 mt-0.5">1–5 minit selepas sah</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Selamat &amp; Terjamin</p>
                  <p className="text-slate-400 mt-0.5">Guna User ID sahaja</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Harga Termurah</p>
                  <p className="text-slate-400 mt-0.5">Kadar MYR telus</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Bantuan Pelanggan</p>
                  <p className="text-slate-400 mt-0.5">Sokongan WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#12161F]">
                <GameImage
                  src={HERO_BANNER_IMAGE}
                  alt="Arena esports TopupBalz"
                  title={store.settings.storeName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-orange-400">
                      Waktu Operasi Sokongan
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
                      {store.settings.supportHours}
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular text-slate-300">
                    {activeGames.length} Game Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Game Catalog Grid */}
        <section
          id="katalog"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-white/[0.06]"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Pilih Game Pilihan Anda
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Klik mana-mana kad game untuk terus memilih pakej tambah nilai di bawah.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Interactive Category Filter Buttons */}
              <div
                role="tablist"
                aria-label="Penapis kategori game"
                className="flex items-center gap-1 p-1 rounded-lg bg-[#12161F] border border-white/[0.07] overflow-x-auto"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama game..."
                  className="w-full sm:w-52 pl-9 pr-3 py-2 rounded-lg bg-[#12161F] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <div className="rounded-xl border border-white/[0.07] bg-[#12161F] p-10 text-center">
              <p className="text-sm text-slate-300">
                Tiada game ditemui untuk carian &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
              >
                Tunjuk Semua Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredGames.map((game) => {
                const isSelected = selectedGame?.id === game.id;
                const minPrice = Math.min(
                  ...game.packages
                    .filter((p) => p.active)
                    .map((p) => p.priceMyr),
                  0
                );
                const validMin =
                  game.packages.some((p) => p.active) ? minPrice : 0;

                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleSelectGame(game)}
                    className={`group text-left rounded-xl overflow-hidden border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      isSelected
                        ? 'bg-[#171C28] border-orange-500'
                        : 'bg-[#12161F] border-white/[0.07] hover:border-white/20 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-[#0E1118]">
                      <GameImage
                        src={game.image}
                        alt={game.name}
                        title={game.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-400 truncate">
                        {game.publisher} · {game.category}
                      </p>
                      <h3 className="font-display text-base sm:text-lg font-semibold text-white mt-1 truncate">
                        {game.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-mono-tabular text-orange-400 font-semibold mt-2">
                        {validMin > 0
                          ? `Bermula ${formatMyr(validMin)}`
                          : 'Pakej Tersedia'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Contiguous Top-Up & Checkout Module */}
        <section
          id="topup-pantas"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/[0.06]"
        >
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Borang Topup Pantas
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Lengkapkan ID akaun game, pilih pakej, dan terus buat pesanan dalam satu skrin.
            </p>
          </div>

          {!selectedGame ? (
            <div className="rounded-xl border border-white/[0.07] bg-[#12161F] p-8 text-center text-sm text-slate-400">
              Tiada game aktif buat masa ini. Kemas kini katalog di Panel Admin.
            </div>
          ) : (
            <form
              onSubmit={handleSubmitOrder}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Steps 1 & 2 */}
              <div className="lg:col-span-7 space-y-6">
                {/* Selected Game Strip */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#12161F] border border-white/[0.07]">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#0E1118]">
                    <GameImage
                      src={selectedGame.image}
                      alt={selectedGame.name}
                      title={selectedGame.name}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400">
                      {selectedGame.publisher} · {selectedGame.currencyUnit}
                    </p>
                    <h3 className="font-display text-lg font-bold text-white truncate">
                      {selectedGame.name}
                    </h3>
                  </div>
                </div>

                {/* Step 1: Account Details */}
                <div className="p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-white">
                      1. Masukkan Maklumat Akaun Game
                    </h3>
                    <span className="text-xs text-slate-400">
                      Tiada kata laluan diperlukan
                    </span>
                  </div>

                  <div
                    className={`grid grid-cols-1 ${
                      selectedGame.needsServerId ? 'sm:grid-cols-2' : ''
                    } gap-4`}
                  >
                    <div>
                      <label
                        htmlFor="userGameId"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        User ID / Player ID
                      </label>
                      <input
                        id="userGameId"
                        type="text"
                        value={userGameId}
                        onChange={(e) => setUserGameId(e.target.value)}
                        placeholder={selectedGame.idPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D12] border border-white/10 text-sm font-mono-tabular text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {selectedGame.needsServerId ? (
                      <div>
                        <label
                          htmlFor="serverId"
                          className="block text-xs font-medium text-slate-300 mb-1.5"
                        >
                          Zone / Server ID
                        </label>
                        <input
                          id="serverId"
                          type="text"
                          value={serverId}
                          onChange={(e) => setServerId(e.target.value)}
                          placeholder={
                            selectedGame.serverPlaceholder ?? 'Contoh: 2948'
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D12] border border-white/10 text-sm font-mono-tabular text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Step 2: Package Grid */}
                <div className="p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-white">
                      2. Pilih Pakej {selectedGame.currencyUnit}
                    </h3>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {activePackages.length} pilihan
                    </span>
                  </div>

                  {activePackages.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4">
                      Tiada pakej aktif untuk game ini.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activePackages.map((pkg) => {
                        const active = selectedPackage?.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                              active
                                ? 'bg-orange-600/15 border-orange-500 text-white'
                                : 'bg-[#0B0D12] border-white/[0.08] text-slate-200 hover:border-white/25'
                            }`}
                          >
                            <p className="text-sm font-semibold leading-snug">
                              {pkg.label}
                            </p>
                            {pkg.bonus ? (
                              <p className="text-[11px] text-orange-400 mt-0.5 truncate">
                                {pkg.bonus}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Penghantaran segera
                              </p>
                            )}
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-sm font-bold font-mono-tabular text-white">
                                {formatMyr(pkg.priceMyr)}
                              </span>
                              {pkg.originalPriceMyr &&
                              pkg.originalPriceMyr > pkg.priceMyr ? (
                                <span className="text-[11px] font-mono-tabular text-slate-500 line-through">
                                  {formatMyr(pkg.originalPriceMyr)}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Payment, Buyer Details & Receipt */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
                <div className="p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.08] space-y-5">
                  <h3 className="font-display text-base font-semibold text-white">
                    3. Kaedah Bayaran &amp; Ringkasan
                  </h3>

                  {/* Payment Options */}
                  <div className="space-y-2">
                    {activePayments.map((pay) => {
                      const active = selectedPayment?.id === pay.id;
                      return (
                        <button
                          key={pay.id}
                          type="button"
                          onClick={() => setSelectedPaymentId(pay.id)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            active
                              ? 'bg-orange-600/15 border-orange-500 text-white'
                              : 'bg-[#0B0D12] border-white/[0.08] text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CreditCard
                              className="w-4 h-4 text-orange-400 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="text-sm font-medium truncate">
                              {pay.name}
                            </span>
                          </div>
                          <span className="text-xs font-mono-tabular text-slate-300 shrink-0">
                            {selectedPackage
                              ? formatMyr(selectedPackage.priceMyr)
                              : 'RM 0.00'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Buyer Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label
                        htmlFor="customerName"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Nama Pembeli
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nama anda"
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="whatsapp"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        No. WhatsApp
                      </label>
                      <input
                        id="whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="0123456789"
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm font-mono-tabular text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Total Summary */}
                  <div className="pt-4 border-t border-white/[0.08] space-y-2 text-sm">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Item</span>
                      <span className="text-slate-200 font-medium">
                        {selectedGame.name} ·{' '}
                        {selectedPackage?.label ?? 'Belum dipilih'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Kaedah Bayaran</span>
                      <span className="text-slate-200">
                        {selectedPayment?.name ?? '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="font-semibold text-white">
                        Jumlah Bayaran
                      </span>
                      <span className="font-display text-xl font-bold font-mono-tabular text-orange-400">
                        {selectedPackage
                          ? formatMyr(selectedPackage.priceMyr)
                          : 'RM 0.00'}
                      </span>
                    </div>
                  </div>

                  {formError ? (
                    <p
                      role="alert"
                      className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2"
                    >
                      {formError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" aria-hidden="true" />
                    <span>Buat Pesanan Sekarang</span>
                  </button>
                </div>

                {/* Live Receipt Card right after order submission */}
                {latestReceipt ? (
                  <div className="p-5 rounded-xl bg-[#141B26] border border-emerald-500/40 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-400">
                          Pesanan Dicipta
                        </p>
                        <h4 className="font-display text-lg font-bold text-white mt-0.5 font-mono-tabular">
                          {latestReceipt.id}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyOrderId(latestReceipt.id)}
                        className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId ? 'Disalin' : 'Salin ID'}</span>
                      </button>
                    </div>

                    {selectedPayment ? (
                      <div className="p-3.5 rounded-lg bg-[#0B0D12] border border-white/[0.06] text-xs space-y-1">
                        <p className="text-slate-400">
                          Sila bayar{' '}
                          <strong className="text-white font-mono-tabular">
                            {formatMyr(latestReceipt.amountMyr)}
                          </strong>{' '}
                          ke akaun berikut:
                        </p>
                        <p className="text-slate-200 font-semibold">
                          {selectedPayment.name} · {selectedPayment.accountLabel}
                        </p>
                        <p className="font-mono-tabular text-orange-400 font-semibold">
                          {selectedPayment.accountNumber}
                        </p>
                        <p className="text-slate-400 pt-1">
                          {selectedPayment.instructions}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={whatsappConfirmLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <span>Hantar Resit ke WhatsApp</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={onOpenAdmin}
                        className="py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Urus di Admin
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </form>
          )}
        </section>

        {/* Section 3: Ranking Topup & Order Lookup */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/[0.06] grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Ranking Topup */}
          <div id="ranking" className="lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy
                    className="w-5 h-5 text-orange-400"
                    aria-hidden="true"
                  />
                  <span>Ranking Topup</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pembeli paling aktif di {store.settings.storeName} bulan ini.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#12161F] overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs text-slate-400">
                    <th className="py-3 px-4 font-medium">#</th>
                    <th className="py-3 px-4 font-medium">Pemain</th>
                    <th className="py-3 px-4 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {rankingList.map((entry, idx) => (
                    <tr
                      key={entry.playerName}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono-tabular text-xs font-semibold text-orange-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">
                          {entry.playerName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.favoriteGame} · {entry.totalOrders} pesanan
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-slate-100">
                        {formatMyr(entry.totalSpendMyr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Semak Status Pesanan */}
          <div id="semak-pesanan" className="lg:col-span-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck
                    className="w-5 h-5 text-orange-400"
                    aria-hidden="true"
                  />
                  <span>Semak Status Pesanan</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan ID Pesanan (cth: TBZ-261115-0418), ID Pemain atau nombor WhatsApp.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#12161F] p-4 sm:p-5 space-y-4">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Cari ID Pesanan, User ID atau WhatsApp..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {matchedOrders.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  Tiada rekod pesanan sepadan ditemui.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-xs text-slate-400">
                        <th className="py-2.5 pr-4 font-medium">ID Pesanan</th>
                        <th className="py-2.5 pr-4 font-medium">Game &amp; Pakej</th>
                        <th className="py-2.5 pr-4 font-medium text-right">
                          Jumlah
                        </th>
                        <th className="py-2.5 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {matchedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 pr-4 font-mono-tabular font-medium text-white whitespace-nowrap">
                            {order.id}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-slate-200 font-medium">
                              {order.gameName} · {order.packageLabel}
                            </p>
                            <p className="text-xs text-slate-400 font-mono-tabular">
                              UID: {order.userGameId}
                              {order.serverId ? ` (${order.serverId})` : ''}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-right font-mono-tabular text-slate-200 whitespace-nowrap">
                            {formatMyr(order.amountMyr)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex justify-end">
                              <StatusLabel status={order.status} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-white/[0.07] bg-[#090B0F] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <p className="font-display text-sm font-semibold text-white">
              {store.settings.storeName}
            </p>
            <p className="mt-1">
              Platform topup game pantas Malaysia · {store.settings.supportHours}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#katalog"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById('katalog')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              Katalog
            </a>
            <a
              href="#semak-pesanan"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById('semak-pesanan')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              Semak Pesanan
            </a>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-orange-400 hover:text-orange-300 font-medium cursor-pointer"
            >
              Panel Admin
            </button>
          </div>
        </div>
      </footer>

      {/* Promo Modal (Only opened via explicit user click, matching brand modal) */}
      {promoModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#151923] border border-white/10 p-6 sm:p-7 text-center space-y-4">
            <h3
              id="promo-modal-title"
              className="font-display text-xl sm:text-2xl font-bold text-white"
            >
              {store.settings.modalTitle}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {store.settings.modalDescription}
            </p>
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setPromoModalOpen(false);
                  document
                    .getElementById('topup-pantas')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {store.settings.modalCtaLabel}
              </button>
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                className="w-full py-2.5 rounded-lg text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
