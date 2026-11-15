import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Gamepad2,
  LayoutDashboard,
  Lock,
  Megaphone,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatMyr } from '../data/initialStoreData';
import type {
  GameCategory,
  GameItem,
  LeaderboardEntry,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  StoreSettings,
  TopupBalzStoreState,
  TopupPackage,
} from '../types/store';
import { GameImage } from './GameImage';
import { StatusLabel } from './StatusBadge';

type AdminTab = 'overview' | 'orders' | 'catalog' | 'promo' | 'settings';

interface AdminDashboardProps {
  store: TopupBalzStoreState;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onSaveGame: (game: GameItem) => void;
  onDeleteGame: (gameId: string) => void;
  onUpdatePaymentMethods: (methods: PaymentMethod[]) => void;
  onUpdateLeaderboard: (entries: LeaderboardEntry[]) => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onImportState: (nextState: TopupBalzStoreState) => void;
  onResetState: () => void;
  onBackToStore: () => void;
}

const ORDER_FILTERS: Array<'Semua' | OrderStatus> = [
  'Semua',
  'Menunggu Bayaran',
  'Sedang Diproses',
  'Selesai',
  'Dibatalkan',
];

const TAB_TITLES: Record<AdminTab, string> = {
  overview: 'Ringkasan',
  orders: 'Pengurusan Pesanan',
  catalog: 'Katalog Game & Harga',
  promo: 'Promosi & Ranking',
  settings: 'Bayaran & Tetapan',
};

export function AdminDashboard({
  store,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveGame,
  onDeleteGame,
  onUpdatePaymentMethods,
  onUpdateLeaderboard,
  onUpdateSettings,
  onImportState,
  onResetState,
  onBackToStore,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // PIN Lock state (only locked if user configured an adminPin)
  const [isUnlocked, setIsUnlocked] = useState(!store.settings.adminPin);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Orders filter & inspector
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'Semua' | OrderStatus>('Semua');
  const [inspectedOrderId, setInspectedOrderId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Catalog state
  const [selectedEditGameId, setSelectedEditGameId] = useState<string>(
    store.games[0]?.id ?? ''
  );
  const [addingGame, setAddingGame] = useState(false);
  const [newGameForm, setNewGameForm] = useState({
    name: '',
    publisher: '',
    category: 'Battle Royale' as GameCategory,
    currencyUnit: 'Diamonds',
    needsServerId: false,
    idPlaceholder: 'Contoh: 123456789',
  });
  const [newPkgForm, setNewPkgForm] = useState({
    label: '',
    bonus: '',
    priceMyr: '',
    originalPriceMyr: '',
  });

  // Promo & Leaderboard local notice
  const [toastMessage, setToastMessage] = useState('');
  const [newLeaderForm, setNewLeaderForm] = useState({
    playerName: '',
    favoriteGame: 'Mobile Legends',
    totalOrders: '1',
    totalSpendMyr: '',
  });

  // Settings form feedback
  const [importError, setImportError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 2400);
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  // KPIs
  const metrics = useMemo(() => {
    const completed = store.orders.filter((o) => o.status === 'Selesai');
    const pending = store.orders.filter(
      (o) => o.status === 'Menunggu Bayaran' || o.status === 'Sedang Diproses'
    );
    const totalRevenue = completed.reduce((sum, o) => sum + o.amountMyr, 0);
    const pendingRevenue = pending.reduce((sum, o) => sum + o.amountMyr, 0);
    const activeGamesCount = store.games.filter((g) => g.active).length;

    return {
      totalRevenue,
      pendingRevenue,
      totalOrders: store.orders.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      activeGamesCount,
      totalGamesCount: store.games.length,
    };
  }, [store.orders, store.games]);

  // Daily Revenue Chart (last 5 days based on order timestamps)
  const dailyRevenueSeries = useMemo(() => {
    const buckets = new Map<string, { label: string; revenue: number; count: number }>();
    for (const order of store.orders) {
      if (order.status === 'Dibatalkan') continue;
      const d = new Date(order.createdAt);
      const key = isNaN(d.getTime())
        ? order.createdAt.slice(0, 10)
        : d.toISOString().slice(0, 10);
      const label = isNaN(d.getTime())
        ? key
        : d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
      const prev = buckets.get(key) ?? { label, revenue: 0, count: 0 };
      prev.revenue += order.amountMyr;
      prev.count += 1;
      buckets.set(key, prev);
    }

    const sorted = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, val]) => val);

    const maxRev = Math.max(...sorted.map((s) => s.revenue), 1);
    return { items: sorted, maxRev };
  }, [store.orders]);

  // Game breakdown
  const gameSalesSummary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    for (const order of store.orders) {
      if (order.status === 'Dibatalkan') continue;
      const cur = map.get(order.gameName) ?? {
        name: order.gameName,
        count: 0,
        total: 0,
      };
      cur.count += 1;
      cur.total += order.amountMyr;
      map.set(order.gameName, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [store.orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return store.orders.filter((order) => {
      const matchStatus =
        orderStatusFilter === 'Semua' || order.status === orderStatusFilter;
      const matchQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.userGameId.toLowerCase().includes(q) ||
        order.gameName.toLowerCase().includes(q) ||
        order.whatsapp.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [store.orders, orderSearch, orderStatusFilter]);

  const inspectedOrder: OrderRecord | undefined = useMemo(
    () => store.orders.find((o) => o.id === inspectedOrderId),
    [store.orders, inspectedOrderId]
  );

  const selectedEditGame: GameItem | undefined = useMemo(
    () =>
      store.games.find((g) => g.id === selectedEditGameId) ?? store.games[0],
    [store.games, selectedEditGameId]
  );

  // PIN Screen if locked
  if (!isUnlocked && store.settings.adminPin) {
    return (
      <div className="min-h-screen bg-[#0B0D12] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12161F] p-6 sm:p-7 space-y-5">
          <div>
            <p className="text-xs font-semibold text-orange-400">
              {store.settings.storeName}
            </p>
            <h1 className="font-display text-2xl font-bold text-white mt-1">
              Log Masuk Panel Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan PIN keselamatan untuk mengurus pesanan dan harga.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput.trim() === store.settings.adminPin) {
                setIsUnlocked(true);
                setPinError('');
                setPinInput('');
              } else {
                setPinError('PIN tidak sepadan. Sila cuba semula.');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="adminPinInput"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                PIN Admin
              </label>
              <input
                id="adminPinInput"
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D12] border border-white/10 text-sm font-mono-tabular text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {pinError ? (
              <p className="text-xs text-rose-400">{pinError}</p>
            ) : null}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Buka Panel Admin
            </button>
            <button
              type="button"
              onClick={onBackToStore}
              className="w-full py-2 rounded-lg text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Kembali ke Laman Utama
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleToggleGameActive = (game: GameItem) => {
    onSaveGame({ ...game, active: !game.active });
    showToast(
      `${game.name} kini ${!game.active ? 'diaktifkan' : 'disembunyikan'}.`
    );
  };

  const handleUpdatePackageField = (
    game: GameItem,
    pkgId: string,
    patch: Partial<TopupPackage>
  ) => {
    const nextPackages = game.packages.map((p) =>
      p.id === pkgId ? { ...p, ...patch } : p
    );
    onSaveGame({ ...game, packages: nextPackages });
  };

  const handleDeletePackage = (game: GameItem, pkgId: string) => {
    onSaveGame({
      ...game,
      packages: game.packages.filter((p) => p.id !== pkgId),
    });
    showToast('Pakej dipadamkan.');
  };

  const handleAddPackage = (e: React.FormEvent, game: GameItem) => {
    e.preventDefault();
    const price = parseFloat(newPkgForm.priceMyr);
    const orig = newPkgForm.originalPriceMyr
      ? parseFloat(newPkgForm.originalPriceMyr)
      : undefined;
    if (!newPkgForm.label.trim() || isNaN(price) || price <= 0) return;

    const createdPkg: TopupPackage = {
      id: `pkg-${Date.now()}`,
      label: newPkgForm.label.trim(),
      bonus: newPkgForm.bonus.trim() || undefined,
      priceMyr: price,
      originalPriceMyr: orig && orig > price ? orig : undefined,
      active: true,
    };
    onSaveGame({
      ...game,
      packages: [...game.packages, createdPkg],
    });
    setNewPkgForm({ label: '', bonus: '', priceMyr: '', originalPriceMyr: '' });
    showToast(`Pakej "${createdPkg.label}" ditambah.`);
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameForm.name.trim()) return;
    const slug = newGameForm.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const created: GameItem = {
      id: `game-${Date.now()}`,
      slug,
      name: newGameForm.name.trim(),
      publisher: newGameForm.publisher.trim() || 'Penerbit Rasmi',
      category: newGameForm.category,
      currencyUnit: newGameForm.currencyUnit.trim() || 'Diamonds',
      needsServerId: newGameForm.needsServerId,
      idPlaceholder: newGameForm.idPlaceholder.trim() || 'Masukkan User ID',
      serverPlaceholder: newGameForm.needsServerId ? 'Contoh: 2001' : undefined,
      image: '',
      active: true,
      featured: false,
      packages: [
        {
          id: `pkg-${Date.now()}`,
          label: `100 ${newGameForm.currencyUnit.trim() || 'Diamonds'}`,
          priceMyr: 4.5,
          active: true,
        },
      ],
    };
    onSaveGame(created);
    setSelectedEditGameId(created.id);
    setAddingGame(false);
    setNewGameForm({
      name: '',
      publisher: '',
      category: 'Battle Royale',
      currencyUnit: 'Diamonds',
      needsServerId: false,
      idPlaceholder: 'Contoh: 123456789',
    });
    showToast(`${created.name} ditambah ke katalog.`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topupbalz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fail sandaran JSON dimuat turun.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as TopupBalzStoreState;
        if (!Array.isArray(parsed.games) || !Array.isArray(parsed.orders)) {
          setImportError('Format fail JSON tidak sah untuk TopupBalz.');
          return;
        }
        onImportState(parsed);
        showToast('Data sandaran berjaya dipulihkan.');
      } catch {
        setImportError('Gagal membaca fail JSON. Pastikan fail tidak rosak.');
      }
    };
    reader.readAsText(file);
  };

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Pesanan',
      icon: ShoppingBag,
      badge: metrics.pendingCount > 0 ? metrics.pendingCount : undefined,
    },
    { id: 'catalog', label: 'Katalog & Harga', icon: Gamepad2 },
    { id: 'promo', label: 'Promosi & Ranking', icon: Megaphone },
    { id: 'settings', label: 'Bayaran & Tetapan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen ? (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      ) : null}

      {/* Sidebar Navigation (260px) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#0F131B] border-r border-white/[0.07] flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-16 px-5 border-b border-white/[0.07] flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-left cursor-pointer"
            >
              <span className="font-display text-lg font-bold text-white tracking-tight block">
                {store.settings.storeName}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Panel Pengurusan
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup bar sisi"
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Menu Admin" className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined ? (
                    <span
                      className={`text-xs font-mono-tabular font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-black/25 text-white'
                          : 'bg-orange-500/15 text-orange-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-white/[0.07] space-y-1.5">
          {store.settings.adminPin ? (
            <button
              type="button"
              onClick={() => setIsUnlocked(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kunci Panel Admin</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBackToStore}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kembali ke Laman Web</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Contextual Header */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-white/[0.07] bg-[#0B0D12]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu admin"
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline">
                {store.settings.storeName} Admin
              </span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h1 className="font-display font-semibold text-white truncate">
                {TAB_TITLES[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {toastMessage ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>{toastMessage}</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={onBackToStore}
              className="px-3.5 py-2 rounded-lg border border-white/10 bg-[#12161F] hover:bg-[#191F2B] text-xs font-semibold text-slate-100 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Lihat Laman Web</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' ? (
            <>
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#12161F] border border-white/[0.07]">
                  <p className="text-xs font-medium text-slate-400">
                    Jualan Selesai
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-2">
                    {formatMyr(metrics.totalRevenue)}
                  </p>
                  <p className="text-xs text-emerald-400 mt-1.5 tabular-nums">
                    {metrics.completedCount} transaksi berjaya
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#12161F] border border-white/[0.07]">
                  <p className="text-xs font-medium text-slate-400">
                    Perlu Tindakan Admin
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-orange-400 mt-2">
                    {metrics.pendingCount}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 font-mono-tabular">
                    Nilai menunggu: {formatMyr(metrics.pendingRevenue)}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#12161F] border border-white/[0.07]">
                  <p className="text-xs font-medium text-slate-400">
                    Jumlah Pesanan
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-2">
                    {metrics.totalOrders}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Rekod pesanan keseluruhan
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#12161F] border border-white/[0.07]">
                  <p className="text-xs font-medium text-slate-400">
                    Katalog Game Aktif
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-white mt-2">
                    {metrics.activeGamesCount} / {metrics.totalGamesCount}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Dipaparkan di laman utama
                  </p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Daily Sales Chart */}
                <div className="lg:col-span-7 p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                        <BarChart3
                          className="w-4 h-4 text-orange-400"
                          aria-hidden="true"
                        />
                        <span>Aliran Jualan Harian</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Jumlah pesanan sah (tidak termasuk dibatalkan)
                      </p>
                    </div>
                  </div>

                  {dailyRevenueSeries.items.length === 0 ? (
                    <p className="text-sm text-slate-400 py-10 text-center">
                      Belum ada data jualan untuk dipaparkan.
                    </p>
                  ) : (
                    <div className="h-48 flex items-end gap-3 sm:gap-5 pt-4">
                      {dailyRevenueSeries.items.map((day) => {
                        const pct = Math.max(
                          Math.round((day.revenue / dailyRevenueSeries.maxRev) * 100),
                          8
                        );
                        return (
                          <div
                            key={day.label}
                            className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                          >
                            <span className="text-[11px] font-mono-tabular text-slate-300 opacity-85 group-hover:opacity-100">
                              {formatMyr(day.revenue)}
                            </span>
                            <div className="w-full max-w-[44px] h-28 bg-[#0B0D12] rounded-md flex items-end overflow-hidden border border-white/[0.05]">
                              <div
                                style={{ height: `${pct}%` }}
                                className="w-full bg-orange-600 group-hover:bg-orange-500 transition-all rounded-t-sm"
                              />
                            </div>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">
                              {day.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top Games Breakdown */}
                <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-4">
                  <div>
                    <h2 className="font-display text-base font-semibold text-white">
                      Prestasi Mengikut Game
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pecahan hasil berdasarkan game popular
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {gameSalesSummary.map((item) => {
                      const maxTotal = Math.max(
                        ...gameSalesSummary.map((g) => g.total),
                        1
                      );
                      const widthPct = Math.round((item.total / maxTotal) * 100);
                      return (
                        <div key={item.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200">
                              {item.name} ·{' '}
                              <span className="text-slate-400 tabular-nums">
                                {item.count} pesanan
                              </span>
                            </span>
                            <span className="font-mono-tabular font-semibold text-white">
                              {formatMyr(item.total)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#0B0D12] overflow-hidden">
                            <div
                              style={{ width: `${widthPct}%` }}
                              className="h-full bg-orange-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Queue: Pending Orders */}
              <div className="rounded-xl bg-[#12161F] border border-white/[0.07] overflow-hidden">
                <div className="p-5 border-b border-white/[0.07] flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-base font-semibold text-white">
                      Giliran Pesanan Segera
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pesanan berstatus Menunggu Bayaran dan Sedang Diproses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer whitespace-nowrap"
                  >
                    Lihat Semua Pesanan
                  </button>
                </div>

                {store.orders.filter(
                  (o) =>
                    o.status === 'Menunggu Bayaran' ||
                    o.status === 'Sedang Diproses'
                ).length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    Semua pesanan telah diselesaikan. Tiada pesanan tertunggak.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.07] text-xs text-slate-400">
                          <th className="py-3 px-5 font-medium">ID Pesanan</th>
                          <th className="py-3 px-4 font-medium">Pembeli &amp; UID</th>
                          <th className="py-3 px-4 font-medium">Item</th>
                          <th className="py-3 px-4 font-medium text-right">
                            Jumlah
                          </th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-5 font-medium text-right">
                            Tindakan Pantas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {store.orders
                          .filter(
                            (o) =>
                              o.status === 'Menunggu Bayaran' ||
                              o.status === 'Sedang Diproses'
                          )
                          .map((order) => (
                            <tr
                              key={order.id}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3.5 px-5 font-mono-tabular font-medium text-white whitespace-nowrap">
                                {order.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="text-slate-100 font-medium">
                                  {order.customerName}
                                </p>
                                <p className="text-xs text-slate-400 font-mono-tabular">
                                  UID: {order.userGameId}
                                  {order.serverId ? ` (${order.serverId})` : ''}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-slate-200">
                                {order.gameName} · {order.packageLabel}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-white whitespace-nowrap">
                                {formatMyr(order.amountMyr)}
                              </td>
                              <td className="py-3.5 px-4">
                                <StatusLabel status={order.status} />
                              </td>
                              <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-2">
                                {order.status === 'Menunggu Bayaran' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateOrderStatus(
                                        order.id,
                                        'Sedang Diproses'
                                      );
                                      showToast(
                                        `${order.id} ditukar ke Sedang Diproses.`
                                      );
                                    }}
                                    className="px-2.5 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold cursor-pointer"
                                  >
                                    Proses
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateOrderStatus(order.id, 'Selesai');
                                    showToast(`${order.id} ditandakan Selesai.`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold cursor-pointer"
                                >
                                  Selesai
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#12161F] border border-white/[0.07] overflow-x-auto">
                  {ORDER_FILTERS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Cari ID, nama, UID, game..."
                    className="w-full md:w-64 pl-9 pr-3 py-2 rounded-lg bg-[#12161F] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-xl bg-[#12161F] border border-white/[0.07] overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-sm text-slate-300">
                      Tiada pesanan ditemui untuk tapisan semasa.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderSearch('');
                        setOrderStatusFilter('Semua');
                      }}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
                    >
                      Set Semula Tapisan
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.07] text-xs text-slate-400">
                          <th className="py-3 px-4 font-medium">ID Pesanan</th>
                          <th className="py-3 px-4 font-medium">Tarikh</th>
                          <th className="py-3 px-4 font-medium">Pembeli</th>
                          <th className="py-3 px-4 font-medium">Game &amp; ID Pemain</th>
                          <th className="py-3 px-4 font-medium">Bayaran</th>
                          <th className="py-3 px-4 font-medium text-right">
                            Jumlah
                          </th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">
                            Butiran
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3 px-4 font-mono-tabular font-medium text-white whitespace-nowrap">
                              {order.id}
                            </td>
                            <td className="py-3 px-4 font-mono-tabular text-xs text-slate-400 whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleString('ms-MY', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-slate-100 font-medium">
                                {order.customerName}
                              </p>
                              <p className="text-xs font-mono-tabular text-slate-400">
                                {order.whatsapp}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-slate-200 font-medium">
                                {order.gameName} · {order.packageLabel}
                              </p>
                              <p className="text-xs font-mono-tabular text-slate-400">
                                {order.userGameId}
                                {order.serverId ? ` (${order.serverId})` : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                              {order.paymentMethod}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-white whitespace-nowrap">
                              {formatMyr(order.amountMyr)}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                aria-label={`Status untuk ${order.id}`}
                                value={order.status}
                                onChange={(e) => {
                                  onUpdateOrderStatus(
                                    order.id,
                                    e.target.value as OrderStatus
                                  );
                                  showToast(
                                    `Status ${order.id} dikemas kini.`
                                  );
                                }}
                                className="px-2.5 py-1.5 rounded-md bg-[#0B0D12] border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                              >
                                <option value="Menunggu Bayaran">
                                  Menunggu Bayaran
                                </option>
                                <option value="Sedang Diproses">
                                  Sedang Diproses
                                </option>
                                <option value="Selesai">Selesai</option>
                                <option value="Dibatalkan">Dibatalkan</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setInspectedOrderId(order.id)}
                                className="px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/10 text-xs font-medium text-white cursor-pointer"
                              >
                                Semak
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* TAB 3: CATALOG & PRICING */}
          {activeTab === 'catalog' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Games List Column */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-white">
                    Senarai Game ({store.games.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAddingGame((v) => !v)}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Game</span>
                  </button>
                </div>

                {addingGame ? (
                  <form
                    onSubmit={handleCreateGame}
                    className="p-4 rounded-xl bg-[#12161F] border border-orange-500/40 space-y-3"
                  >
                    <p className="text-xs font-semibold text-orange-400">
                      Tambah Game Baharu
                    </p>
                    <input
                      type="text"
                      required
                      value={newGameForm.name}
                      onChange={(e) =>
                        setNewGameForm({ ...newGameForm, name: e.target.value })
                      }
                      placeholder="Nama Game (cth: Valorant)"
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newGameForm.publisher}
                        onChange={(e) =>
                          setNewGameForm({
                            ...newGameForm,
                            publisher: e.target.value,
                          })
                        }
                        placeholder="Penerbit"
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                      />
                      <select
                        value={newGameForm.category}
                        onChange={(e) =>
                          setNewGameForm({
                            ...newGameForm,
                            category: e.target.value as GameCategory,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                      >
                        <option value="Battle Royale">Battle Royale</option>
                        <option value="MOBA">MOBA</option>
                        <option value="Sukan">Sukan</option>
                        <option value="RPG">RPG</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={newGameForm.currencyUnit}
                      onChange={(e) =>
                        setNewGameForm({
                          ...newGameForm,
                          currencyUnit: e.target.value,
                        })
                      }
                      placeholder="Matawang (cth: VP / Diamonds / UC)"
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newGameForm.needsServerId}
                        onChange={(e) =>
                          setNewGameForm({
                            ...newGameForm,
                            needsServerId: e.target.checked,
                          })
                        }
                        className="rounded border-white/20 bg-[#0B0D12] accent-orange-500"
                      />
                      <span>Perlukan Zone / Server ID</span>
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Simpan Game
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingGame(false)}
                        className="px-3 py-2 rounded-lg bg-white/5 text-xs text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="space-y-2">
                  {store.games.map((game) => {
                    const selected = selectedEditGame?.id === game.id;
                    return (
                      <div
                        key={game.id}
                        className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                          selected
                            ? 'bg-[#171C28] border-orange-500'
                            : 'bg-[#12161F] border-white/[0.07] hover:border-white/20'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedEditGameId(game.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#0B0D12]">
                            <GameImage
                              src={game.image}
                              alt={game.name}
                              title={game.name}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {game.name}
                            </p>
                            <p className="text-xs text-slate-400 tabular-nums">
                              {game.packages.length} pakej ·{' '}
                              {game.active ? 'Aktif' : 'Disembunyikan'}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleGameActive(game)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer ${
                            game.active
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          {game.active ? 'Aktif' : 'Tutup'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Game Package Editor */}
              <div className="lg:col-span-8">
                {selectedEditGame ? (
                  <div className="rounded-xl bg-[#12161F] border border-white/[0.07] p-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0B0D12] shrink-0">
                          <GameImage
                            src={selectedEditGame.image}
                            alt={selectedEditGame.name}
                            title={selectedEditGame.name}
                          />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-white">
                            {selectedEditGame.name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {selectedEditGame.publisher} ·{' '}
                            {selectedEditGame.currencyUnit}
                          </p>
                        </div>
                      </div>

                      {store.games.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteGame(selectedEditGame.id);
                            showToast(`${selectedEditGame.name} dipadamkan.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 self-start cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Padam Game</span>
                        </button>
                      ) : null}
                    </div>

                    {/* Package Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.07] text-xs text-slate-400">
                            <th className="py-2.5 pr-3 font-medium">Nama Pakej</th>
                            <th className="py-2.5 pr-3 font-medium">Bonus</th>
                            <th className="py-2.5 pr-3 font-medium">Harga (RM)</th>
                            <th className="py-2.5 pr-3 font-medium">Harga Asal</th>
                            <th className="py-2.5 pr-3 font-medium">Status</th>
                            <th className="py-2.5 text-right font-medium">Padam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {selectedEditGame.packages.map((pkg) => (
                            <tr key={pkg.id}>
                              <td className="py-2.5 pr-3">
                                <input
                                  type="text"
                                  value={pkg.label}
                                  onChange={(e) =>
                                    handleUpdatePackageField(
                                      selectedEditGame,
                                      pkg.id,
                                      { label: e.target.value }
                                    )
                                  }
                                  className="w-full min-w-[140px] px-2.5 py-1.5 rounded-md bg-[#0B0D12] border border-white/10 text-xs sm:text-sm text-white"
                                />
                              </td>
                              <td className="py-2.5 pr-3">
                                <input
                                  type="text"
                                  value={pkg.bonus ?? ''}
                                  onChange={(e) =>
                                    handleUpdatePackageField(
                                      selectedEditGame,
                                      pkg.id,
                                      { bonus: e.target.value || undefined }
                                    )
                                  }
                                  placeholder="-"
                                  className="w-28 px-2.5 py-1.5 rounded-md bg-[#0B0D12] border border-white/10 text-xs text-slate-200"
                                />
                              </td>
                              <td className="py-2.5 pr-3">
                                <input
                                  type="number"
                                  step="0.10"
                                  min="0.10"
                                  value={pkg.priceMyr}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0) {
                                      handleUpdatePackageField(
                                        selectedEditGame,
                                        pkg.id,
                                        { priceMyr: val }
                                      );
                                    }
                                  }}
                                  className="w-24 px-2.5 py-1.5 rounded-md bg-[#0B0D12] border border-white/10 text-xs sm:text-sm font-mono-tabular text-white"
                                />
                              </td>
                              <td className="py-2.5 pr-3">
                                <input
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  value={pkg.originalPriceMyr ?? ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    handleUpdatePackageField(
                                      selectedEditGame,
                                      pkg.id,
                                      {
                                        originalPriceMyr:
                                          !isNaN(val) && val > 0 ? val : undefined,
                                      }
                                    );
                                  }}
                                  placeholder="-"
                                  className="w-24 px-2.5 py-1.5 rounded-md bg-[#0B0D12] border border-white/10 text-xs font-mono-tabular text-slate-300"
                                />
                              </td>
                              <td className="py-2.5 pr-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePackageField(
                                      selectedEditGame,
                                      pkg.id,
                                      { active: !pkg.active }
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                                    pkg.active
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : 'bg-white/5 text-slate-400'
                                  }`}
                                >
                                  {pkg.active ? 'Aktif' : 'Tutup'}
                                </button>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeletePackage(selectedEditGame, pkg.id)
                                  }
                                  aria-label={`Padam ${pkg.label}`}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add New Package Inline Form */}
                    <form
                      onSubmit={(e) => handleAddPackage(e, selectedEditGame)}
                      className="pt-4 border-t border-white/[0.07] space-y-3"
                    >
                      <p className="text-xs font-semibold text-slate-300">
                        Tambah Pakej Baharu ke {selectedEditGame.name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          required
                          value={newPkgForm.label}
                          onChange={(e) =>
                            setNewPkgForm({
                              ...newPkgForm,
                              label: e.target.value,
                            })
                          }
                          placeholder="Label (cth: 1440 Diamonds)"
                          className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={newPkgForm.bonus}
                          onChange={(e) =>
                            setNewPkgForm({
                              ...newPkgForm,
                              bonus: e.target.value,
                            })
                          }
                          placeholder="Bonus (pilihan)"
                          className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                        />
                        <input
                          type="number"
                          required
                          step="0.10"
                          min="0.10"
                          value={newPkgForm.priceMyr}
                          onChange={(e) =>
                            setNewPkgForm({
                              ...newPkgForm,
                              priceMyr: e.target.value,
                            })
                          }
                          placeholder="Harga RM (cth: 98.00)"
                          className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs font-mono-tabular text-white"
                        />
                        <button
                          type="submit"
                          className="py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Pakej</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* TAB 4: PROMO & RANKING */}
          {activeTab === 'promo' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Promo Banner & Modal Editor */}
              <div className="lg:col-span-6 p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Pengumuman &amp; Pop-up Promosi
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kemas kini teks promosi yang dipaparkan kepada pelanggan di halaman utama.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0B0D12] border border-white/[0.06] cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Papar Bar Pengumuman Atas
                      </p>
                      <p className="text-xs text-slate-400">
                        Jalur pengumuman nipis di bahagian paling atas web
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={store.settings.bannerEnabled}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...store.settings,
                          bannerEnabled: e.target.checked,
                        });
                        showToast('Tetapan bar pengumuman dikemas kini.');
                      }}
                      className="w-4 h-4 accent-orange-500"
                    />
                  </label>

                  <div>
                    <label
                      htmlFor="bannerText"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Teks Bar Pengumuman
                    </label>
                    <input
                      id="bannerText"
                      type="text"
                      value={store.settings.bannerText}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          bannerText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-4">
                    <label className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0B0D12] border border-white/[0.06] cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Aktifkan Pop-up Promosi Web
                        </p>
                        <p className="text-xs text-slate-400">
                          Dibuka apabila pelanggan tekan &ldquo;Lihat Promosi&rdquo;
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={store.settings.modalEnabled}
                        onChange={(e) => {
                          onUpdateSettings({
                            ...store.settings,
                            modalEnabled: e.target.checked,
                          });
                          showToast('Tetapan modal promosi dikemas kini.');
                        }}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <div>
                      <label
                        htmlFor="modalTitle"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Tajuk Pop-up Promosi
                      </label>
                      <input
                        id="modalTitle"
                        type="text"
                        value={store.settings.modalTitle}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            modalTitle: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="modalDescription"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Mesej Promosi
                      </label>
                      <textarea
                        id="modalDescription"
                        rows={3}
                        value={store.settings.modalDescription}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            modalDescription: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="modalCtaLabel"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Teks Butang Utama
                      </label>
                      <input
                        id="modalCtaLabel"
                        type="text"
                        value={store.settings.modalCtaLabel}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            modalCtaLabel: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard / Ranking Topup Management */}
              <div className="lg:col-span-6 p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Pengurusan Ranking Topup
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pesanan berstatus Selesai dikira secara automatik ke carta Ranking. Anda juga boleh tambah rekod manual di sini.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-xs text-slate-400">
                        <th className="py-2 pr-3 font-medium">Nama Pemain</th>
                        <th className="py-2 pr-3 font-medium">Game</th>
                        <th className="py-2 pr-3 font-medium text-right">
                          Jumlah (RM)
                        </th>
                        <th className="py-2 text-right font-medium">Padam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {store.leaderboardBonusEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-2.5 pr-3 font-medium text-white">
                            {entry.playerName}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-300">
                            {entry.favoriteGame} · {entry.totalOrders}x
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono-tabular text-slate-100">
                            {formatMyr(entry.totalSpendMyr)}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateLeaderboard(
                                  store.leaderboardBonusEntries.filter(
                                    (i) => i.id !== entry.id
                                  )
                                );
                                showToast('Rekod ranking dipadam.');
                              }}
                              aria-label={`Padam ${entry.playerName}`}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const spend = parseFloat(newLeaderForm.totalSpendMyr);
                    const ordersCount = parseInt(newLeaderForm.totalOrders, 10);
                    if (
                      !newLeaderForm.playerName.trim() ||
                      isNaN(spend) ||
                      spend <= 0
                    ) {
                      return;
                    }
                    const nextEntry: LeaderboardEntry = {
                      id: `lb-${Date.now()}`,
                      playerName: newLeaderForm.playerName.trim(),
                      favoriteGame: newLeaderForm.favoriteGame.trim() || 'Free Fire',
                      totalOrders: isNaN(ordersCount) ? 1 : ordersCount,
                      totalSpendMyr: spend,
                    };
                    onUpdateLeaderboard([
                      ...store.leaderboardBonusEntries,
                      nextEntry,
                    ]);
                    setNewLeaderForm({
                      playerName: '',
                      favoriteGame: 'Mobile Legends',
                      totalOrders: '1',
                      totalSpendMyr: '',
                    });
                    showToast('Rekod ranking ditambah.');
                  }}
                  className="pt-4 border-t border-white/[0.07] space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-300">
                    Tambah Rekod Ranking Manual
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={newLeaderForm.playerName}
                      onChange={(e) =>
                        setNewLeaderForm({
                          ...newLeaderForm,
                          playerName: e.target.value,
                        })
                      }
                      placeholder="Nama Pemain"
                      className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newLeaderForm.favoriteGame}
                      onChange={(e) =>
                        setNewLeaderForm({
                          ...newLeaderForm,
                          favoriteGame: e.target.value,
                        })
                      }
                      placeholder="Game Kegemaran"
                      className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs text-white"
                    />
                    <input
                      type="number"
                      min="1"
                      value={newLeaderForm.totalOrders}
                      onChange={(e) =>
                        setNewLeaderForm({
                          ...newLeaderForm,
                          totalOrders: e.target.value,
                        })
                      }
                      placeholder="Bil. Pesanan"
                      className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs font-mono-tabular text-white"
                    />
                    <input
                      type="number"
                      required
                      step="0.10"
                      min="1"
                      value={newLeaderForm.totalSpendMyr}
                      onChange={(e) =>
                        setNewLeaderForm({
                          ...newLeaderForm,
                          totalSpendMyr: e.target.value,
                        })
                      }
                      placeholder="Jumlah Belanja RM"
                      className="px-3 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-xs font-mono-tabular text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah ke Ranking</span>
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {/* TAB 5: PAYMENTS & SETTINGS */}
          {activeTab === 'settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Payment Accounts */}
              <div className="lg:col-span-7 p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                    <CreditCard
                      className="w-4 h-4 text-orange-400"
                      aria-hidden="true"
                    />
                    <span>Kaedah Bayaran &amp; Akaun Penerima</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nombor akaun yang dipaparkan pada resit selepas pelanggan membuat pesanan.
                  </p>
                </div>

                <div className="space-y-4">
                  {store.paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.06] space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">
                          {method.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePaymentMethods(
                              store.paymentMethods.map((m) =>
                                m.id === method.id
                                  ? { ...m, active: !m.active }
                                  : m
                              )
                            );
                            showToast(`${method.name} dikemas kini.`);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                            method.active
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          {method.active ? 'Aktif' : 'Dimatikan'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Nama Pemegang Akaun
                          </label>
                          <input
                            type="text"
                            value={method.accountLabel}
                            onChange={(e) =>
                              onUpdatePaymentMethods(
                                store.paymentMethods.map((m) =>
                                  m.id === method.id
                                    ? { ...m, accountLabel: e.target.value }
                                    : m
                                )
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-md bg-[#12161F] border border-white/10 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            No. Akaun / Rujukan QR
                          </label>
                          <input
                            type="text"
                            value={method.accountNumber}
                            onChange={(e) =>
                              onUpdatePaymentMethods(
                                store.paymentMethods.map((m) =>
                                  m.id === method.id
                                    ? { ...m, accountNumber: e.target.value }
                                    : m
                                )
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-md bg-[#12161F] border border-white/10 text-xs font-mono-tabular text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Arahan Pembayaran
                        </label>
                        <input
                          type="text"
                          value={method.instructions}
                          onChange={(e) =>
                            onUpdatePaymentMethods(
                              store.paymentMethods.map((m) =>
                                m.id === method.id
                                  ? { ...m, instructions: e.target.value }
                                  : m
                              )
                            )
                          }
                          className="w-full px-3 py-1.5 rounded-md bg-[#12161F] border border-white/10 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Settings & Data Backup */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-4">
                  <h2 className="font-display text-base font-semibold text-white">
                    Tetapan Kedai &amp; Keselamatan
                  </h2>

                  <div>
                    <label
                      htmlFor="settingStoreName"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Nama Kedai
                    </label>
                    <input
                      id="settingStoreName"
                      type="text"
                      value={store.settings.storeName}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          storeName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settingWhatsapp"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      No. WhatsApp Admin (cth: 601123456789)
                    </label>
                    <input
                      id="settingWhatsapp"
                      type="text"
                      value={store.settings.whatsappNumber}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          whatsappNumber: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm font-mono-tabular text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settingHours"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Waktu Operasi Sokongan
                    </label>
                    <input
                      id="settingHours"
                      type="text"
                      value={store.settings.supportHours}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          supportHours: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settingPin"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      PIN Kunci Panel Admin (Kosongkan jika tiada kunci)
                    </label>
                    <input
                      id="settingPin"
                      type="text"
                      inputMode="numeric"
                      value={store.settings.adminPin}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          adminPin: e.target.value,
                        })
                      }
                      placeholder="cth: 123456"
                      className="w-full px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/10 text-sm font-mono-tabular text-white"
                    />
                  </div>
                </div>

                {/* Backup & Restore */}
                <div className="p-5 sm:p-6 rounded-xl bg-[#12161F] border border-white/[0.07] space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">
                      Sandaran &amp; Pulihkan Data
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Muat turun salinan JSON katalog dan pesanan supaya tidak hilang.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Eksport JSON</span>
                    </button>

                    <label className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                      <input
                        type="file"
                        accept="application/json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        onResetState();
                        showToast('Data kedai dikembalikan ke tetapan asal.');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Data Asal</span>
                    </button>
                  </div>

                  {importError ? (
                    <p className="text-xs text-rose-400">{importError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Order Inspector Slide-Over Drawer */}
      {inspectedOrder ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Butiran pesanan ${inspectedOrder.id}`}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md h-full bg-[#12161F] border-l border-white/10 p-6 overflow-y-auto flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.07]">
                <div>
                  <p className="text-xs text-slate-400">Butiran Pesanan</p>
                  <h2 className="font-display text-xl font-bold font-mono-tabular text-white mt-0.5">
                    {inspectedOrder.id}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedOrderId(null)}
                  aria-label="Tutup panel butiran"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <StatusLabel status={inspectedOrder.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Game</span>
                  <span className="font-medium text-white">
                    {inspectedOrder.gameName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pakej</span>
                  <span className="font-medium text-white">
                    {inspectedOrder.packageLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jumlah Bayaran</span>
                  <span className="font-mono-tabular font-bold text-orange-400">
                    {formatMyr(inspectedOrder.amountMyr)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kaedah Bayaran</span>
                  <span className="text-slate-200">
                    {inspectedOrder.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Copyable Player Credentials */}
              <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-3">
                <p className="text-xs font-semibold text-slate-300">
                  ID Akaun Game Pembeli
                </p>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-slate-400">User ID</p>
                    <p className="font-mono-tabular text-sm font-semibold text-white">
                      {inspectedOrder.userGameId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('uid', inspectedOrder.userGameId)
                    }
                    className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'uid' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'uid' ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>

                {inspectedOrder.serverId ? (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
                    <div>
                      <p className="text-[11px] text-slate-400">Zone / Server ID</p>
                      <p className="font-mono-tabular text-sm font-semibold text-white">
                        {inspectedOrder.serverId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy('sid', inspectedOrder.serverId ?? '')
                      }
                      className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'sid' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'sid' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Customer Contact */}
              <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  Maklumat Pembeli
                </p>
                <p className="text-sm text-white">{inspectedOrder.customerName}</p>
                <p className="text-xs font-mono-tabular text-slate-400">
                  WhatsApp: {inspectedOrder.whatsapp}
                </p>
                <a
                  href={`https://wa.me/${inspectedOrder.whatsapp.replace(
                    /\D/g,
                    ''
                  )}?text=${encodeURIComponent(
                    `Hai ${inspectedOrder.customerName}, mengenai pesanan ${inspectedOrder.id} (${inspectedOrder.gameName} - ${inspectedOrder.packageLabel}) di ${store.settings.storeName}:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Hubungi Pembeli di WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  Tukar Status Pesanan
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'Menunggu Bayaran',
                      'Sedang Diproses',
                      'Selesai',
                      'Dibatalkan',
                    ] as OrderStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onUpdateOrderStatus(inspectedOrder.id, st);
                        showToast(`${inspectedOrder.id} -> ${st}`);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        inspectedOrder.status === st
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-[#0B0D12] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.07] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(inspectedOrder.id);
                  setInspectedOrderId(null);
                  showToast('Rekod pesanan dipadam.');
                }}
                className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Rekod</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectedOrderId(null)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
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
