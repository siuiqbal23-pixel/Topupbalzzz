import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Info,
  LayoutDashboard,
  Lock,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Trash2,
  Upload,
  Users,
  Download,
  X,
} from 'lucide-react';
import {
  DEFAULT_GAME_PROMO,
  buildAdminWhatsAppUpdateUrl,
  formatMyr,
  getPromoItemQuota,
  resolvePaymentAccountDisplay,
} from '../data/initialStoreData';
import {
  fetchAdminEmailOtpApi,
  fetchAdminTelegramApi,
  fetchAdminUsersApi,
  saveAdminEmailOtpApi,
  saveAdminTelegramApi,
  testAdminEmailOtpApi,
  testAdminTelegramApi,
  type AdminUserRecord,
  type EmailOtpConfigDto,
  type TelegramConfigDto,
} from '../lib/api';
import type {
  BrandInputType,
  BrandItem,
  CategoryItem,
  FaqItem,
  GamePromoConfig,
  HomeSection,
  InfoPost,
  ManualPaymentAccount,
  OrderItem,
  PaymentStatusCode,
  ProductItem,
  SliderItem,
  StoreSettings,
  TopupBalzStoreState,
  TopupStatusCode,
  VoucherItem,
  WhatsAppTemplates,
} from '../types/store';
import { GameImage } from './GameImage';
import { PaymentStatusBadge, TopupStatusBadge } from './StatusBadge';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'users'
  | 'catalog'
  | 'info'
  | 'web'
  | 'settings';
type SettingsSubTab =
  | 'general'
  | 'transfer'
  | 'telegram'
  | 'emailOtp'
  | 'whatsapp'
  | 'content'
  | 'maintenance'
  | 'backup';

interface AdminDashboardProps {
  store: TopupBalzStoreState;
  onUpdateOrder: (
    reference: string,
    patch: Partial<OrderItem>
  ) => void;
  onDeleteOrder: (reference: string) => void;
  onSaveBrand: (brand: BrandItem) => void;
  onDeleteBrand: (brandId: string) => void;
  onUpdateCategories?: (categories: CategoryItem[]) => void;
  onUpdateHomeSections: (sections: HomeSection[]) => void;
  onUpdateSliders: (sliders: SliderItem[]) => void;
  onUpdateVouchers: (vouchers: VoucherItem[]) => void;
  onUpdateFaqs: (faqs: FaqItem[]) => void;
  onUpdateInfoPosts: (posts: InfoPost[]) => void;
  onUpdatePaymentAccounts: (accounts: ManualPaymentAccount[]) => void;
  onUpdateWhatsappTemplates: (templates: WhatsAppTemplates) => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onUpdateGamePromo?: (promo: GamePromoConfig) => void;
  onImportState: (next: TopupBalzStoreState) => void;
  onResetState: () => void;
  onBackToStore: () => void;
  onRequireAdminLogin?: () => void;
}

const TAB_TITLES: Record<AdminTab, string> = {
  overview: 'Dashboard Ringkasan',
  orders: 'Pengurusan Pesanan',
  users: 'Senarai E-mel Pengguna',
  catalog: 'Katalog Game & Produk',
  info: 'Pengurusan Informasi',
  web: 'Promosi Game, Slider & FAQ',
  settings: 'Tetapan Sistem & WhatsApp',
};

function toLocalDatetimeInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminDashboard({
  store,
  onUpdateOrder,
  onDeleteOrder,
  onSaveBrand,
  onDeleteBrand,
  onUpdateHomeSections,
  onUpdateSliders,
  onUpdateVouchers,
  onUpdateFaqs,
  onUpdateInfoPosts,
  onUpdatePaymentAccounts,
  onUpdateWhatsappTemplates,
  onUpdateSettings,
  onUpdateGamePromo,
  onImportState,
  onResetState,
  onBackToStore,
  onRequireAdminLogin,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [settingsSubTab, setSettingsSubTab] =
    useState<SettingsSubTab>('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Optional PIN lock
  const [isUnlocked, setIsUnlocked] = useState(!store.settings.adminPin);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Orders filter + Inspector
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<
    'all' | 'pending_payment' | 'processing' | 'completed' | 'cancelled'
  >('all');
  const [inspectedRef, setInspectedRef] = useState<string | null>(null);

  // Catalog editing
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    store.brands[0]?.id ?? ''
  );
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandForm, setNewBrandForm] = useState({
    name: '',
    publisher: '',
    categorySlug: 'umum',
    currencyUnit: 'Diamonds',
    inputType: 'id' as BrandInputType,
    idLabel: 'User ID',
    serverLabel: 'Zone ID',
    image: '',
    banner: '',
  });
  const [newPkgForm, setNewPkgForm] = useState({
    name: '',
    bonus: '',
    description: '',
    sellPrice: '',
    originalPrice: '',
  });
  const [newSectionForm, setNewSectionForm] = useState({
    title: '',
    subtitle: '',
  });

  // Web content forms
  const [newVoucherForm, setNewVoucherForm] = useState({
    code: '',
    type: 'fixed' as 'fixed' | 'percent',
    value: '',
    minPurchase: '',
  });
  const [newFaqForm, setNewFaqForm] = useState({
    question: '',
    answer: '',
  });
  const [newSliderForm, setNewSliderForm] = useState({
    title: '',
    subtitle: '',
    ctaLabel: 'Topup Sekarang',
    targetBrandSlug: store.brands[0]?.slug ?? '',
    image: '',
  });
  const [newInfoForm, setNewInfoForm] = useState({
    title: '',
    content: '',
    image: '',
  });
  const [newPromoItem, setNewPromoItem] = useState(() => {
    const firstBrand = store.brands[0];
    const firstProd = firstBrand?.products[0];
    return {
      brandId: firstBrand?.id ?? '',
      productId: firstProd?.id ?? '',
      promoPrice: firstProd
        ? String(Math.max(1, Number((firstProd.sellPrice * 0.8).toFixed(2))))
        : '',
      maxQuota: '10',
    };
  });

  // Payment account form
  const [newPayForm, setNewPayForm] = useState({
    name: '',
    type: 'bank' as ManualPaymentAccount['type'],
    channelCode: '',
    accountLabel: '',
    accountNumber: '',
    instructions: '',
    notifyChannel: 'whatsapp' as 'whatsapp' | 'telegram',
  });

  // Telegram Info Channel config
  const [tgForm, setTgForm] = useState<TelegramConfigDto>({
    enabled: false,
    botToken: '',
    channelId: '',
    channelUrl: store.settings.telegramChannelUrl ?? '',
    channelName: store.settings.telegramChannelName ?? 'Telegram Info Channel',
  });
  const [tgLoaded, setTgLoaded] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgSaving, setTgSaving] = useState(false);
  const [tgTesting, setTgTesting] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [tgStatusMsg, setTgStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Email OTP (Gmail SMTP) config
  const [emailOtpForm, setEmailOtpForm] = useState<EmailOtpConfigDto>({
    enabled: false,
    gmailUser: '',
    senderName: 'TopupBalz',
    hasAppPassword: false,
    envConfigured: false,
  });
  const [gmailAppPasswordInput, setGmailAppPasswordInput] = useState('');
  const [showGmailPass, setShowGmailPass] = useState(false);
  const [emailOtpLoaded, setEmailOtpLoaded] = useState(false);
  const [emailOtpSaving, setEmailOtpSaving] = useState(false);
  const [emailOtpTesting, setEmailOtpTesting] = useState(false);
  const [emailOtpTestTo, setEmailOtpTestTo] = useState('');
  const [emailOtpStatusMsg, setEmailOtpStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (
      activeTab !== 'settings' ||
      store.user.role !== 'admin' ||
      tgLoaded
    ) {
      return;
    }
    let cancelled = false;
    setTgLoading(true);
    fetchAdminTelegramApi()
      .then((res) => {
        if (cancelled) return;
        setTgForm(res.telegram);
        setTgLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setTgStatusMsg({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Gagal memuatkan tetapan Telegram.',
        });
      })
      .finally(() => {
        if (!cancelled) setTgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, store.user.role, tgLoaded]);

  useEffect(() => {
    if (
      activeTab !== 'settings' ||
      store.user.role !== 'admin' ||
      emailOtpLoaded
    ) {
      return;
    }
    let cancelled = false;
    fetchAdminEmailOtpApi()
      .then((res) => {
        if (cancelled) return;
        setEmailOtpForm(res.emailOtp);
        if (!emailOtpTestTo && res.emailOtp.gmailUser) {
          setEmailOtpTestTo(res.emailOtp.gmailUser);
        }
        setEmailOtpLoaded(true);
      })
      .catch(() => {
        // ignore silent load error
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, store.user.role, emailOtpLoaded, emailOtpTestTo]);

  // Registered & Logged-in User Emails
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const loadAdminUsers = () => {
    if (store.user.role !== 'admin') return;
    setUsersLoading(true);
    setUsersError('');
    fetchAdminUsersApi()
      .then((res) => {
        setAdminUsers(res.users);
      })
      .catch((err) => {
        setUsersError(
          err instanceof Error
            ? err.message
            : 'Gagal memuatkan senarai pengguna.'
        );
      })
      .finally(() => {
        setUsersLoading(false);
      });
  };

  useEffect(() => {
    if (store.user.role !== 'admin') return;
    loadAdminUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.user.role]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return adminUsers;
    return adminUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
    );
  }, [adminUsers, userSearch]);

  const [toast, setToast] = useState('');
  const [importError, setImportError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? '' : prev)), 2500);
  };

  const readImageFile = (file: File, onLoaded: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl) return;
      if (file.size <= 220 * 1024 || file.type === 'image/svg+xml') {
        onLoaded(rawDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxWidth = 960;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onLoaded(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime =
          file.type === 'image/png' || file.type === 'image/webp'
            ? file.type
            : 'image/jpeg';
        onLoaded(canvas.toDataURL(mime, 0.85));
      };
      img.onerror = () => onLoaded(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const paymentReview = store.orders.filter((o) => o.paymentStatus === 0);
    const processing = store.orders.filter(
      (o) => o.paymentStatus === 2 && o.topupStatus !== 2 && o.topupStatus !== 3
    );
    const completed = store.orders.filter((o) => o.topupStatus === 2);
    const revenue = completed.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      paymentReviewOrders: paymentReview,
      processingOrders: processing,
      paymentReviewCount: paymentReview.length,
      processingCount: processing.length,
      completedCount: completed.length,
      totalOrders: store.orders.length,
      revenue,
    };
  }, [store.orders]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return store.orders.filter((o) => {
      if (orderFilter === 'pending_payment' && o.paymentStatus !== 0)
        return false;
      if (
        orderFilter === 'processing' &&
        !(o.paymentStatus === 2 && o.topupStatus !== 2 && o.topupStatus !== 3)
      )
        return false;
      if (orderFilter === 'completed' && o.topupStatus !== 2) return false;
      if (
        orderFilter === 'cancelled' &&
        o.paymentStatus !== -1 &&
        o.topupStatus !== 3
      )
        return false;

      if (!q) return true;
      return (
        o.reference.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.accountId.toLowerCase().includes(q) ||
        o.brandName.toLowerCase().includes(q) ||
        o.whatsapp.toLowerCase().includes(q)
      );
    });
  }, [store.orders, orderSearch, orderFilter]);

  const inspectedOrder = useMemo(
    () => store.orders.find((o) => o.reference === inspectedRef),
    [store.orders, inspectedRef]
  );

  const selectedBrand = useMemo(
    () =>
      store.brands.find((b) => b.id === selectedBrandId) ?? store.brands[0],
    [store.brands, selectedBrandId]
  );

  // Admin Account Gate
  if (!store.user.loggedIn || store.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0E1117] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] p-6 space-y-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              {store.settings.title}
            </p>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
              Akses Panel Admin Diperlukan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {store.user.loggedIn
                ? `Akaun semasa (${store.user.email}) tidak mempunyai peranan admin.`
                : 'Sila log masuk menggunakan akaun admin untuk mengurus pesanan, informasi, dan katalog.'}
            </p>
          </div>
          <div className="space-y-2.5">
            {onRequireAdminLogin ? (
              <button
                type="button"
                onClick={onRequireAdminLogin}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
              >
                {store.user.loggedIn
                  ? 'Tukar Akaun Admin'
                  : 'Log Masuk Akaun Admin'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onBackToStore}
              className="w-full py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Kembali ke Laman Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PIN Lock Gate
  if (!isUnlocked && store.settings.adminPin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0E1117] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] p-6 space-y-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              {store.settings.title}
            </p>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
              Log Masuk Panel Admin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Masukkan PIN keselamatan untuk mengurus pesanan dan katalog.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput.trim() === store.settings.adminPin) {
                setIsUnlocked(true);
                setPinError('');
              } else {
                setPinError('PIN tidak sepadan.');
              }
            }}
            className="space-y-3"
          >
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN Admin"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
            {pinError ? (
              <p className="text-xs text-rose-500">{pinError}</p>
            ) : null}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
            >
              Buka Dashboard
            </button>
            <button
              type="button"
              onClick={onBackToStore}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Kembali ke Laman Utama
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handlers
  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandForm.name.trim()) return;
    const slug = newBrandForm.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const created: BrandItem = {
      id: `brand-${Date.now()}`,
      slug,
      name: newBrandForm.name.trim(),
      publisher: newBrandForm.publisher.trim() || 'Penerbit Rasmi',
      categorySlug: newBrandForm.categorySlug,
      currencyUnit: newBrandForm.currencyUnit.trim() || 'Diamonds',
      inputType: newBrandForm.inputType,
      idLabel: newBrandForm.idLabel.trim() || 'User ID',
      idPlaceholder: 'Contoh: 123456789',
      serverLabel:
        newBrandForm.inputType === 'id+server'
          ? newBrandForm.serverLabel.trim() || 'Zone ID'
          : undefined,
      serverPlaceholder:
        newBrandForm.inputType === 'id+server' ? 'Contoh: 2001' : undefined,
      image: newBrandForm.image.trim(),
      banner: (newBrandForm.banner || newBrandForm.image).trim(),
      description: `Topup ${newBrandForm.name.trim()} pantas dengan bayaran manual WhatsApp.`,
      rating: 5.0,
      totalReviews: 100,
      featured: false,
      active: true,
      products: [
        {
          id: `prod-${Date.now()}`,
          name: `100 ${newBrandForm.currencyUnit.trim() || 'Diamonds'}`,
          description: 'Proses manual pantas.',
          sellPrice: 5.0,
          active: true,
        },
      ],
    };
    onSaveBrand(created);
    setSelectedBrandId(created.id);
    setAddingBrand(false);
    setNewBrandForm({
      name: '',
      publisher: '',
      categorySlug: 'umum',
      currencyUnit: 'Diamonds',
      inputType: 'id',
      idLabel: 'User ID',
      serverLabel: 'Zone ID',
      image: '',
      banner: '',
    });
    showToast(`${created.name} berjaya ditambah.`);
  };

  const handleAddProduct = (e: React.FormEvent, brand: BrandItem) => {
    e.preventDefault();
    const sell = parseFloat(newPkgForm.sellPrice);
    const orig = newPkgForm.originalPrice
      ? parseFloat(newPkgForm.originalPrice)
      : undefined;
    if (!newPkgForm.name.trim() || isNaN(sell) || sell <= 0) return;
    const item: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newPkgForm.name.trim(),
      bonus: newPkgForm.bonus.trim() || undefined,
      description:
        newPkgForm.description.trim() || 'Penghantaran manual pantas.',
      sellPrice: sell,
      originalPrice: orig && orig > sell ? orig : undefined,
      active: true,
    };
    onSaveBrand({ ...brand, products: [...brand.products, item] });
    setNewPkgForm({
      name: '',
      bonus: '',
      description: '',
      sellPrice: '',
      originalPrice: '',
    });
    showToast(`Produk "${item.name}" ditambah.`);
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
        if (!Array.isArray(parsed.brands) || !Array.isArray(parsed.orders)) {
          setImportError('Format fail JSON tidak sah.');
          return;
        }
        onImportState(parsed);
        showToast('Sandaran berjaya dipulihkan.');
      } catch {
        setImportError('Gagal membaca fail JSON.');
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
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Pesanan',
      icon: ShoppingBag,
      badge:
        stats.paymentReviewCount + stats.processingCount > 0
          ? stats.paymentReviewCount + stats.processingCount
          : undefined,
    },
    {
      id: 'users',
      label: 'E-mel Pengguna',
      icon: Users,
      badge: adminUsers.length > 0 ? adminUsers.length : undefined,
    },
    { id: 'catalog', label: 'Katalog Game', icon: Gamepad2 },
    { id: 'info', label: 'Informasi', icon: Info },
    { id: 'web', label: 'Konten Web', icon: Megaphone },
    { id: 'settings', label: 'Tetapan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1117] text-slate-900 dark:text-slate-100 flex">
      {sidebarOpen ? (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12161F] flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-16 px-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-left cursor-pointer"
            >
              <span className="font-display text-lg font-bold text-slate-900 dark:text-white block">
                {store.settings.title}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                CMS &amp; Admin Panel
              </span>
            </button>
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined ? (
                    <span
                      className={`text-xs font-mono-tabular font-semibold px-1.5 py-0.5 rounded ${
                        active
                          ? 'bg-black/20 text-white'
                          : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
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

        <div className="p-3 border-t border-slate-200 dark:border-white/[0.08] space-y-1.5">
          {store.settings.adminPin ? (
            <button
              type="button"
              onClick={() => setIsUnlocked(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kunci Panel Admin</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBackToStore}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kembali ke Laman Web</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0E1117]/95 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {TAB_TITLES[activeTab]}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {toast ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>{toast}</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <span>Lihat Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Semakan Bayaran Manual
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-orange-600 dark:text-orange-400 mt-2">
                    {stats.paymentReviewCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Menunggu pengesahan resit
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Perlu Diproses (Lunas)
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-sky-600 dark:text-sky-400 mt-2">
                    {stats.processingCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Bayaran sah, tunggu topup
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Pesanan Selesai
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-2">
                    {stats.completedCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Daripada {stats.totalOrders} jumlah pesanan
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Hasil Jualan Selesai
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white mt-2">
                    {formatMyr(stats.revenue)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Transaksi berjaya dikreditkan
                  </p>
                </div>
              </div>

              {/* 2-Column Action Queues (OrdersPaymentReviewTable & OrdersWaitingTable) */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Payment Review Table */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-200 dark:border-white/[0.08]">
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      Semakan Pembayaran (Payment Review)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pesanan manual menunggu pengesahan bayaran
                    </p>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                          <th className="py-3 px-4 font-semibold">Rujukan</th>
                          <th className="py-3 px-4 font-semibold">Jumlah</th>
                          <th className="py-3 px-4 font-semibold text-right">
                            Tindakan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                        {stats.paymentReviewOrders.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="py-10 text-center text-xs text-slate-500 dark:text-slate-400"
                            >
                              Tiada pesanan menunggu pengesahan bayaran.
                            </td>
                          </tr>
                        ) : (
                          stats.paymentReviewOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="py-3 px-4">
                                <p className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                                  {order.reference}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {order.customerName} · {order.brandName}
                                </p>
                              </td>
                              <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                {formatMyr(order.totalAmount)}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setInspectedRef(order.reference)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Sahkan</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Orders Waiting / In Progress */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-200 dark:border-white/[0.08]">
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      Giliran Topup (Lunas)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bayaran telah sah dan sedia untuk dikreditkan
                    </p>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                          <th className="py-3 px-4 font-semibold">Rujukan</th>
                          <th className="py-3 px-4 font-semibold">Item</th>
                          <th className="py-3 px-4 font-semibold text-right">
                            Tindakan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                        {stats.processingOrders.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="py-10 text-center text-xs text-slate-500 dark:text-slate-400"
                            >
                              Tiada pesanan dalam giliran topup.
                            </td>
                          </tr>
                        ) : (
                          stats.processingOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="py-3 px-4">
                                <p className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                                  {order.reference}
                                </p>
                                <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                                  {order.accountId}
                                  {order.serverId ? ` (${order.serverId})` : ''}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                                {order.brandName} · {order.productName}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateOrder(order.reference, {
                                      topupStatus: 2,
                                    });
                                    showToast(`${order.reference} ditandakan Sukses.`);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                                >
                                  Tandakan Sukses
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'Semua' },
                      { id: 'pending_payment', label: 'Menunggu Bayaran' },
                      { id: 'processing', label: 'Diproses' },
                      { id: 'completed', label: 'Sukses' },
                      { id: 'cancelled', label: 'Batal / Gagal' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderFilter(f.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                        orderFilter === f.id
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Cari invois, nama, UID..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#10141C]">
                      <tr className="text-slate-600 dark:text-slate-400">
                        <th className="py-3 px-4 font-semibold">No. Invois</th>
                        <th className="py-3 px-4 font-semibold">Pembeli</th>
                        <th className="py-3 px-4 font-semibold">Produk &amp; ID</th>
                        <th className="py-3 px-4 font-semibold text-right">Total</th>
                        <th className="py-3 px-4 font-semibold">Bayaran</th>
                        <th className="py-3 px-4 font-semibold">Topup</th>
                        <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                          >
                            Tiada pesanan ditemui.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          >
                            <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {order.reference}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900 dark:text-white">
                                {order.customerName}
                              </p>
                              <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                                {order.whatsapp}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {order.brandName} · {order.productName}
                              </p>
                              <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                                {order.accountId}
                                {order.serverId ? ` (${order.serverId})` : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {formatMyr(order.totalAmount)}
                            </td>
                            <td className="py-3 px-4">
                              <PaymentStatusBadge status={order.paymentStatus} />
                            </td>
                            <td className="py-3 px-4">
                              <TopupStatusBadge status={order.topupStatus} />
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setInspectedRef(order.reference)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                              >
                                Urus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {/* TAB 3: CATALOG (HOME SECTIONS, BRANDS & PRODUCTS) */}
          {activeTab === 'catalog' ? (
            <div className="space-y-6">
              {/* Customizable Homepage Sections (Rename, Reorder Up/Down, Add Section, Assign Games) */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      Tajuk &amp; Susunan Bahagian Halaman Utama
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Edit tajuk seperti &ldquo;Produk Unggulan&rdquo; atau &ldquo;Semua Game Populer&rdquo;, susun kedudukan atas/bawah, tambah bahagian baharu, dan pilih game untuk setiap bahagian.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(store.homeSections ?? []).map((section, idx) => {
                    const moveSection = (direction: -1 | 1) => {
                      const target = idx + direction;
                      if (
                        target < 0 ||
                        target >= (store.homeSections ?? []).length
                      )
                        return;
                      const next = [...store.homeSections];
                      const [moved] = next.splice(idx, 1);
                      next.splice(target, 0, moved);
                      onUpdateHomeSections(next);
                      showToast('Susunan bahagian dikemas kini.');
                    };

                    const toggleBrandInSection = (brandId: string) => {
                      const has = section.brandIds.includes(brandId);
                      const nextBrandIds = has
                        ? section.brandIds.filter((id) => id !== brandId)
                        : [...section.brandIds, brandId];
                      onUpdateHomeSections(
                        store.homeSections.map((s) =>
                          s.id === section.id
                            ? { ...s, brandIds: nextBrandIds }
                            : s
                        )
                      );
                    };

                    return (
                      <div
                        key={section.id}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Up / Down Reorder Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(-1)}
                              title="Naikkan ke atas"
                              aria-label="Naikkan bahagian ke atas"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-slate-600 dark:text-slate-300 hover:border-orange-500 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                idx === (store.homeSections ?? []).length - 1
                              }
                              onClick={() => moveSection(1)}
                              title="Turunkan ke bawah"
                              aria-label="Turunkan bahagian ke bawah"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-slate-600 dark:text-slate-300 hover:border-orange-500 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editable Title & Subtitle */}
                          <div className="grid sm:grid-cols-2 gap-2 flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) =>
                                onUpdateHomeSections(
                                  store.homeSections.map((s) =>
                                    s.id === section.id
                                      ? { ...s, title: e.target.value }
                                      : s
                                  )
                                )
                              }
                              placeholder="Tajuk bahagian"
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-semibold text-slate-900 dark:text-white"
                            />
                            <input
                              type="text"
                              value={section.subtitle ?? ''}
                              onChange={(e) =>
                                onUpdateHomeSections(
                                  store.homeSections.map((s) =>
                                    s.id === section.id
                                      ? { ...s, subtitle: e.target.value }
                                      : s
                                  )
                                )
                              }
                              placeholder="Subtajuk ringkas (pilihan)"
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs text-slate-700 dark:text-slate-300"
                            />
                          </div>

                          {/* Active & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateHomeSections(
                                  store.homeSections.map((s) =>
                                    s.id === section.id
                                      ? { ...s, active: !s.active }
                                      : s
                                  )
                                );
                                showToast('Status bahagian dikemas kini.');
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                section.active
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-600 text-white'
                              }`}
                            >
                              {section.active ? 'Aktif' : 'Tersembunyi'}
                            </button>
                            <button
                              type="button"
                              aria-label={`Padam bahagian ${section.title}`}
                              onClick={() => {
                                onUpdateHomeSections(
                                  store.homeSections.filter(
                                    (s) => s.id !== section.id
                                  )
                                );
                                showToast(`Bahagian "${section.title}" dipadam.`);
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Assign Games to This Section */}
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              Pilih Game dalam Bahagian Ini ({section.brandIds.length} dipilih):
                            </span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateHomeSections(
                                    store.homeSections.map((s) =>
                                      s.id === section.id
                                        ? {
                                            ...s,
                                            brandIds: store.brands.map(
                                              (b) => b.id
                                            ),
                                          }
                                        : s
                                    )
                                  );
                                  showToast('Semua game dipilih.');
                                }}
                                className="font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                              >
                                Pilih Semua
                              </button>
                              <span className="text-slate-400">·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateHomeSections(
                                    store.homeSections.map((s) =>
                                      s.id === section.id
                                        ? { ...s, brandIds: [] }
                                        : s
                                    )
                                  );
                                }}
                                className="font-medium text-slate-500 hover:text-rose-500 cursor-pointer"
                              >
                                Kosongkan
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {store.brands.map((brand) => {
                              const selected = section.brandIds.includes(
                                brand.id
                              );
                              return (
                                <button
                                  key={`${section.id}-${brand.id}`}
                                  type="button"
                                  onClick={() => toggleBrandInSection(brand.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                                    selected
                                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold'
                                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-slate-600 dark:text-slate-300 hover:border-orange-500/50'
                                  }`}
                                >
                                  <span className="h-4 w-4 rounded overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                                    <GameImage
                                      src={brand.image}
                                      alt={brand.name}
                                      title={brand.name}
                                    />
                                  </span>
                                  <span>{brand.name}</span>
                                  {selected ? (
                                    <Check className="w-3 h-3 text-orange-500" />
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Section Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSectionForm.title.trim()) return;
                    const created: HomeSection = {
                      id: `sec-${Date.now()}`,
                      title: newSectionForm.title.trim(),
                      subtitle: newSectionForm.subtitle.trim() || undefined,
                      brandIds: [],
                      active: true,
                    };
                    onUpdateHomeSections([
                      ...(store.homeSections ?? []),
                      created,
                    ]);
                    setNewSectionForm({ title: '', subtitle: '' });
                    showToast(`Bahagian "${created.title}" ditambah.`);
                  }}
                  className="grid sm:grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]"
                >
                  <input
                    type="text"
                    required
                    value={newSectionForm.title}
                    onChange={(e) =>
                      setNewSectionForm({
                        ...newSectionForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="Tajuk bahagian baharu (cth: Game Terkini)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  />
                  <input
                    type="text"
                    value={newSectionForm.subtitle}
                    onChange={(e) =>
                      setNewSectionForm({
                        ...newSectionForm,
                        subtitle: e.target.value,
                      })
                    }
                    placeholder="Subtajuk ringkas (pilihan)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bahagian</span>
                  </button>
                </form>
              </div>

              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Brands List */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      Senarai Game ({store.brands.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setAddingBrand((v) => !v)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Game</span>
                    </button>
                  </div>

                  {addingBrand ? (
                    <form
                      onSubmit={handleCreateBrand}
                      className="rounded-xl border border-orange-500/40 bg-white dark:bg-[#141923] p-4 space-y-2.5 text-xs"
                    >
                      <input
                        type="text"
                        required
                        value={newBrandForm.name}
                        onChange={(e) =>
                          setNewBrandForm({ ...newBrandForm, name: e.target.value })
                        }
                        placeholder="Nama Game (cth: Honor of Kings)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117]"
                      />
                      <input
                        type="text"
                        value={newBrandForm.publisher}
                        onChange={(e) =>
                          setNewBrandForm({
                            ...newBrandForm,
                            publisher: e.target.value,
                          })
                        }
                        placeholder="Penerbit (cth: Level Infinite)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newBrandForm.currencyUnit}
                          onChange={(e) =>
                            setNewBrandForm({
                              ...newBrandForm,
                              currencyUnit: e.target.value,
                            })
                          }
                          placeholder="Unit (Tokens)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117]"
                        />
                        <select
                          value={newBrandForm.inputType}
                          onChange={(e) =>
                            setNewBrandForm({
                              ...newBrandForm,
                              inputType: e.target.value as BrandInputType,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117]"
                        >
                          <option value="id">ID Sahaja</option>
                          <option value="id+server">ID + Server</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-medium cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-orange-500" />
                            <span>Pilih Fail Gambar Game</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                readImageFile(file, (dataUrl) => {
                                  setNewBrandForm((prev) => ({
                                    ...prev,
                                    image: dataUrl,
                                  }));
                                });
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {newBrandForm.image ? (
                            <button
                              type="button"
                              onClick={() =>
                                setNewBrandForm((prev) => ({
                                  ...prev,
                                  image: '',
                                }))
                              }
                              className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Buang
                            </button>
                          ) : null}
                        </div>
                        {newBrandForm.image ? (
                          <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img
                              src={newBrandForm.image}
                              alt="Pratonton"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2 pt-1">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-medium cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-orange-500" />
                            <span>Pilih Fail Banner Belakang Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                readImageFile(file, (dataUrl) => {
                                  setNewBrandForm((prev) => ({
                                    ...prev,
                                    banner: dataUrl,
                                  }));
                                });
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {newBrandForm.banner ? (
                            <button
                              type="button"
                              onClick={() =>
                                setNewBrandForm((prev) => ({
                                  ...prev,
                                  banner: '',
                                }))
                              }
                              className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Buang
                            </button>
                          ) : null}
                        </div>
                        {newBrandForm.banner ? (
                          <div className="h-16 w-28 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img
                              src={newBrandForm.banner}
                              alt="Pratonton Banner"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-orange-600 text-white font-semibold cursor-pointer"
                      >
                        Simpan Game Baharu
                      </button>
                    </form>
                  ) : null}

                  <div className="space-y-2">
                    {store.brands.map((brand) => {
                      const active = selectedBrand?.id === brand.id;
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => setSelectedBrandId(brand.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                              : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923]'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                            <GameImage
                              src={brand.image}
                              alt={brand.name}
                              title={brand.name}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {brand.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {brand.products.length} pakej ·{' '}
                              {brand.active ? 'Aktif' : 'Tersembunyi'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Brand Editor */}
                {selectedBrand ? (
                  <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 sm:p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
                      <div>
                        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                          {selectedBrand.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedBrand.publisher} · {selectedBrand.currencyUnit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSaveBrand({
                              ...selectedBrand,
                              featured: !selectedBrand.featured,
                            });
                            showToast('Status Unggulan dikemas kini.');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            selectedBrand.featured
                              ? 'bg-orange-600 text-white'
                              : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {selectedBrand.featured ? 'Unggulan: Ya' : 'Unggulan: Tidak'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveBrand({
                              ...selectedBrand,
                              active: !selectedBrand.active,
                            });
                            showToast('Status aktif dikemas kini.');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            selectedBrand.active
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}
                        >
                          {selectedBrand.active ? 'Aktif' : 'Disembunyikan'}
                        </button>
                        <button
                          type="button"
                          aria-label="Padam game"
                          onClick={() => {
                            onDeleteBrand(selectedBrand.id);
                            showToast(`${selectedBrand.name} dipadam.`);
                          }}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Game Card Image & Banner Upload */}
                    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1117] p-3.5">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                        Gambar Game &amp; Banner
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Card / Cover Image */}
                        <div className="space-y-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] p-3">
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            Gambar Kad Game (Ikon / Poster)
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                              <GameImage
                                src={selectedBrand.image}
                                alt={selectedBrand.name}
                                title={selectedBrand.name}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-[11px] font-semibold text-white cursor-pointer">
                                  <Upload className="w-3 h-3" />
                                  <span>Pilih Fail</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      readImageFile(file, (dataUrl) => {
                                        onSaveBrand({
                                          ...selectedBrand,
                                          image: dataUrl,
                                        });
                                        showToast(
                                          `Gambar kad ${selectedBrand.name} dikemas kini.`
                                        );
                                      });
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                {selectedBrand.image ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSaveBrand({
                                        ...selectedBrand,
                                        image: '',
                                      });
                                      showToast('Gambar kad dipadam.');
                                    }}
                                    className="px-2 py-1.5 rounded-lg border border-rose-500/30 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  >
                                    Padam
                                  </button>
                                ) : null}
                              </div>
                              <input
                                type="url"
                                value={
                                  selectedBrand.image.startsWith('data:')
                                    ? ''
                                    : selectedBrand.image
                                }
                                onChange={(e) =>
                                  onSaveBrand({
                                    ...selectedBrand,
                                    image: e.target.value,
                                  })
                                }
                                placeholder="Atau tampal URL gambar..."
                                className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-[11px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Banner Image */}
                        <div className="space-y-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] p-3">
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            Banner Belakang Logo Game (Halaman Topup)
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-24 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                              <GameImage
                                src={selectedBrand.banner || selectedBrand.image}
                                alt={`${selectedBrand.name} banner`}
                                title={selectedBrand.name}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-[11px] font-semibold text-white cursor-pointer">
                                  <Upload className="w-3 h-3" />
                                  <span>Pilih Fail</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      readImageFile(file, (dataUrl) => {
                                        onSaveBrand({
                                          ...selectedBrand,
                                          banner: dataUrl,
                                        });
                                        showToast(
                                          `Banner ${selectedBrand.name} dikemas kini.`
                                        );
                                      });
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                {selectedBrand.banner ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSaveBrand({
                                        ...selectedBrand,
                                        banner: '',
                                      });
                                      showToast('Banner dipadam.');
                                    }}
                                    className="px-2 py-1.5 rounded-lg border border-rose-500/30 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  >
                                    Padam
                                  </button>
                                ) : null}
                              </div>
                              <input
                                type="url"
                                value={
                                  selectedBrand.banner.startsWith('data:')
                                    ? ''
                                    : selectedBrand.banner
                                }
                                onChange={(e) =>
                                  onSaveBrand({
                                    ...selectedBrand,
                                    banner: e.target.value,
                                  })
                                }
                                placeholder="Atau tampal URL banner..."
                                className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="space-y-2.5">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Pakej Produk
                      </h4>
                      {selectedBrand.products.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1117]"
                        >
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) =>
                              onSaveBrand({
                                ...selectedBrand,
                                products: selectedBrand.products.map((p) =>
                                  p.id === pkg.id
                                    ? { ...p, name: e.target.value }
                                    : p
                                ),
                              })
                            }
                            className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-medium"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400">RM</span>
                            <input
                              type="number"
                              step="0.1"
                              value={pkg.sellPrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (isNaN(val)) return;
                                onSaveBrand({
                                  ...selectedBrand,
                                  products: selectedBrand.products.map((p) =>
                                    p.id === pkg.id
                                      ? { ...p, sellPrice: val }
                                      : p
                                  ),
                                });
                              }}
                              className="w-20 px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-mono-tabular font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onSaveBrand({
                                ...selectedBrand,
                                products: selectedBrand.products.map((p) =>
                                  p.id === pkg.id
                                    ? { ...p, active: !p.active }
                                    : p
                                ),
                              })
                            }
                            className={`px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                              pkg.active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-500/15 text-slate-500'
                            }`}
                          >
                            {pkg.active ? 'Aktif' : 'Mati'}
                          </button>
                          <button
                            type="button"
                            aria-label="Padam produk"
                            onClick={() => {
                              onSaveBrand({
                                ...selectedBrand,
                                products: selectedBrand.products.filter(
                                  (p) => p.id !== pkg.id
                                ),
                              });
                              showToast('Produk dipadam.');
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Product Form */}
                    <form
                      onSubmit={(e) => handleAddProduct(e, selectedBrand)}
                      className="pt-4 border-t border-slate-200 dark:border-white/[0.08] grid sm:grid-cols-4 gap-2.5"
                    >
                      <input
                        type="text"
                        required
                        value={newPkgForm.name}
                        onChange={(e) =>
                          setNewPkgForm({ ...newPkgForm, name: e.target.value })
                        }
                        placeholder="Nama pakej (cth: 1,412 Diamonds)"
                        className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                      />
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={newPkgForm.sellPrice}
                        onChange={(e) =>
                          setNewPkgForm({
                            ...newPkgForm,
                            sellPrice: e.target.value,
                          })
                        }
                        placeholder="Harga (RM)"
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        + Tambah Pakej
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* TAB 4: WEB CONTENT (GAME PROMO, SLIDERS, VOUCHERS, FAQS) */}
          {activeTab === 'web' ? (
            <div className="space-y-6">
              {/* Promosi Game Bawah Banner */}
              {(() => {
                const currentPromo: GamePromoConfig = {
                  ...DEFAULT_GAME_PROMO,
                  ...(store.gamePromo ?? {}),
                };
                const promoItems = Array.isArray(currentPromo.items)
                  ? currentPromo.items
                  : [];
                const endMs = new Date(currentPromo.endAt).getTime();
                const isExpired =
                  !Number.isFinite(endMs) || endMs <= Date.now();
                const isFull =
                  promoItems.length > 0
                    ? promoItems.every(
                        (it) => getPromoItemQuota(it, currentPromo).isFull
                      )
                    : currentPromo.claimedCount >= currentPromo.maxQuota;
                const updatePromo = (patch: Partial<GamePromoConfig>) => {
                  const nextItems =
                    patch.items !== undefined ? patch.items : promoItems;
                  const syncedBrandIds = Array.from(
                    new Set(nextItems.map((it) => it.brandId))
                  );
                  onUpdateGamePromo?.({
                    ...currentPromo,
                    ...patch,
                    items: nextItems,
                    brandIds:
                      patch.brandIds !== undefined
                        ? patch.brandIds
                        : syncedBrandIds,
                  });
                };

                const pickerBrand =
                  store.brands.find((b) => b.id === newPromoItem.brandId) ??
                  store.brands[0];
                const pickerProducts = pickerBrand?.products ?? [];
                const pickerProduct =
                  pickerProducts.find((p) => p.id === newPromoItem.productId) ??
                  pickerProducts[0];

                return (
                  <div className="rounded-xl border border-orange-500/30 bg-white dark:bg-[#141923] p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Flame
                            className="w-4 h-4 text-orange-500"
                            aria-hidden="true"
                          />
                          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                            Promosi Game (Bawah Banner)
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              !currentPromo.active
                                ? 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                                : isExpired
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  : isFull
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {!currentPromo.active
                              ? 'Dimatikan'
                              : isExpired
                                ? 'Tamat Masa'
                                : isFull
                                  ? 'Semua Kuota Habis'
                                  : 'Sedang Berjalan'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Tetapkan masa tamat promosi dan had orang tercepat serta harga promo bagi setiap game.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextActive = !currentPromo.active;
                          if (nextActive && isExpired) {
                            updatePromo({
                              active: true,
                              endAt: new Date(
                                Date.now() + 24 * 60 * 60 * 1000
                              ).toISOString(),
                            });
                            showToast(
                              'Promosi Game diaktifkan dan masa tamat ditetapkan +24 jam.'
                            );
                          } else {
                            updatePromo({ active: nextActive });
                            showToast(
                              nextActive
                                ? 'Promosi Game diaktifkan.'
                                : 'Promosi Game dimatikan.'
                            );
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer shrink-0 ${
                          currentPromo.active
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                      >
                        {currentPromo.active
                          ? 'Status: Aktif (Klik Matikan)'
                          : 'Status: Mati (Klik Aktifkan)'}
                      </button>
                    </div>

                    {isExpired ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-300">
                        <span>
                          Masa tamat promosi telah lepas. Promosi tidak akan dipaparkan di Home selagi masa tamat tidak ditetapkan ke masa hadapan.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updatePromo({
                              active: true,
                              endAt: new Date(
                                Date.now() + 24 * 60 * 60 * 1000
                              ).toISOString(),
                            });
                            showToast(
                              'Masa tamat disambung +24 jam dan promosi kini aktif di Home.'
                            );
                          }}
                          className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          Aktifkan +24 Jam
                        </button>
                      </div>
                    ) : null}

                    {/* Masa & Tarikh Tamat + Quick Masa Presets */}
                    <div className="grid gap-3.5 sm:grid-cols-2 sm:items-end">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Masa &amp; Tarikh Tamat
                        </label>
                        <input
                          type="datetime-local"
                          value={toLocalDatetimeInputValue(currentPromo.endAt)}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const dt = new Date(e.target.value);
                            if (!Number.isNaN(dt.getTime())) {
                              updatePromo({ endAt: dt.toISOString() });
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Set Masa Pantas:</span>
                        </span>
                        {[
                          { label: '+1 Jam', hours: 1 },
                          { label: '+6 Jam', hours: 6 },
                          { label: '+24 Jam', hours: 24 },
                          { label: '+3 Hari', hours: 72 },
                          { label: '+7 Hari', hours: 168 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              updatePromo({
                                endAt: new Date(
                                  Date.now() + preset.hours * 60 * 60 * 1000
                                ).toISOString(),
                              });
                              showToast(`Masa tamat ditetapkan ${preset.label}.`);
                            }}
                            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] hover:border-orange-500/60 text-[11px] font-semibold cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Senarai Game & Harga Promosi */}
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Senarai Game Promosi ({promoItems.length})
                      </p>

                      {promoItems.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          Belum ada item promosi. Pilih game, pakej, harga promosi, dan had orang di bawah.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {promoItems.map((it) => {
                            const b = store.brands.find(
                              (x) => x.id === it.brandId
                            );
                            const p = b?.products.find(
                              (x) => x.id === it.productId
                            );
                            if (!b || !p) return null;
                            const quota = getPromoItemQuota(it, currentPromo);
                            return (
                              <div
                                key={`${it.brandId}-${it.productId}`}
                                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] p-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-10 w-10 rounded overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                                    <GameImage
                                      src={b.image}
                                      alt={b.name}
                                      title={b.name}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                      {b.name} · {p.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                                      Asal: {formatMyr(p.sellPrice)} · Baki {quota.remainingQuota}/{quota.maxQuota} org
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Promo (RM):
                                    </span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min={0.1}
                                      value={it.promoPrice}
                                      onChange={(e) => {
                                        const val = Math.max(
                                          0.1,
                                          parseFloat(e.target.value) || 0.1
                                        );
                                        updatePromo({
                                          items: promoItems.map((row) =>
                                            row.brandId === it.brandId &&
                                            row.productId === it.productId
                                              ? { ...row, promoPrice: val }
                                              : row
                                          ),
                                        });
                                      }}
                                      className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-mono-tabular font-semibold text-orange-600 dark:text-orange-400"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Had Org:
                                    </span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={quota.maxQuota}
                                      onChange={(e) => {
                                        const maxQuota = Math.max(
                                          1,
                                          parseInt(e.target.value, 10) || 1
                                        );
                                        updatePromo({
                                          items: promoItems.map((row) =>
                                            row.brandId === it.brandId &&
                                            row.productId === it.productId
                                              ? { ...row, maxQuota }
                                              : row
                                          ),
                                        });
                                      }}
                                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-mono-tabular"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Dibeli:
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={quota.claimedCount}
                                      onChange={(e) => {
                                        const claimedCount = Math.max(
                                          0,
                                          parseInt(e.target.value, 10) || 0
                                        );
                                        updatePromo({
                                          items: promoItems.map((row) =>
                                            row.brandId === it.brandId &&
                                            row.productId === it.productId
                                              ? { ...row, claimedCount }
                                              : row
                                          ),
                                        });
                                      }}
                                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-mono-tabular"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updatePromo({
                                          items: promoItems.map((row) =>
                                            row.brandId === it.brandId &&
                                            row.productId === it.productId
                                              ? { ...row, claimedCount: 0 }
                                              : row
                                          ),
                                        });
                                        showToast(`Kiraan ${b.name} diset semula ke 0.`);
                                      }}
                                      className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-[11px] font-semibold cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    aria-label="Buang item promosi"
                                    onClick={() => {
                                      updatePromo({
                                        items: promoItems.filter(
                                          (row) =>
                                            !(
                                              row.brandId === it.brandId &&
                                              row.productId === it.productId
                                            )
                                        ),
                                      });
                                      showToast('Item promosi dibuang.');
                                    }}
                                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Tambah Game & Harga Promosi Baharu */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!pickerBrand || !pickerProduct) return;
                          const priceVal = parseFloat(newPromoItem.promoPrice);
                          const quotaVal = Math.max(
                            1,
                            parseInt(newPromoItem.maxQuota, 10) || 10
                          );
                          if (isNaN(priceVal) || priceVal <= 0) return;
                          const existsIdx = promoItems.findIndex(
                            (row) =>
                              row.brandId === pickerBrand.id &&
                              row.productId === pickerProduct.id
                          );
                          const nextItems =
                            existsIdx >= 0
                              ? promoItems.map((row, idx) =>
                                  idx === existsIdx
                                    ? {
                                        ...row,
                                        promoPrice: priceVal,
                                        maxQuota: quotaVal,
                                      }
                                    : row
                                )
                              : [
                                  ...promoItems,
                                  {
                                    brandId: pickerBrand.id,
                                    productId: pickerProduct.id,
                                    promoPrice: priceVal,
                                    maxQuota: quotaVal,
                                    claimedCount: 0,
                                  },
                                ];
                          const nextEndAt = isExpired
                            ? new Date(
                                Date.now() + 24 * 60 * 60 * 1000
                              ).toISOString()
                            : currentPromo.endAt;
                          updatePromo({
                            active: true,
                            endAt: nextEndAt,
                            items: nextItems,
                          });
                          showToast(
                            isExpired
                              ? `${pickerBrand.name} (${pickerProduct.name}) ditetapkan RM ${priceVal.toFixed(2)} untuk ${quotaVal} orang (masa tamat disambung +24 jam).`
                              : `${pickerBrand.name} (${pickerProduct.name}) ditetapkan RM ${priceVal.toFixed(2)} untuk ${quotaVal} orang.`
                          );
                        }}
                        className="grid sm:grid-cols-5 gap-2 pt-2"
                      >
                        <select
                          value={pickerBrand?.id ?? ''}
                          onChange={(e) => {
                            const b = store.brands.find(
                              (x) => x.id === e.target.value
                            );
                            const p = b?.products[0];
                            setNewPromoItem({
                              ...newPromoItem,
                              brandId: e.target.value,
                              productId: p?.id ?? '',
                              promoPrice: p
                                ? String(
                                    Math.max(
                                      0.5,
                                      Number((p.sellPrice * 0.8).toFixed(2))
                                    )
                                  )
                                : '',
                            });
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                        >
                          {store.brands.map((b) => (
                            <option key={`sel-b-${b.id}`} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={pickerProduct?.id ?? ''}
                          onChange={(e) => {
                            const p = pickerProducts.find(
                              (x) => x.id === e.target.value
                            );
                            setNewPromoItem({
                              ...newPromoItem,
                              brandId: pickerBrand?.id ?? '',
                              productId: e.target.value,
                              promoPrice: p
                                ? String(
                                    Math.max(
                                      0.5,
                                      Number((p.sellPrice * 0.8).toFixed(2))
                                    )
                                  )
                                : '',
                            });
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                        >
                          {pickerProducts.map((p) => (
                            <option key={`sel-p-${p.id}`} value={p.id}>
                              {p.name} ({formatMyr(p.sellPrice)})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          required
                          value={newPromoItem.promoPrice}
                          onChange={(e) =>
                            setNewPromoItem({
                              ...newPromoItem,
                              promoPrice: e.target.value,
                            })
                          }
                          placeholder="Harga Promo (RM)"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                        />

                        <input
                          type="number"
                          min="1"
                          required
                          value={newPromoItem.maxQuota}
                          onChange={(e) =>
                            setNewPromoItem({
                              ...newPromoItem,
                              maxQuota: e.target.value,
                            })
                          }
                          placeholder="Had Orang (cth: 10)"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                        />

                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                        >
                          + Tambah Promosi
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })()}

              {/* Vouchers */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 sm:p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Kod Voucher Diskaun
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {store.vouchers.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] p-3.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-mono-tabular text-sm font-bold text-orange-600 dark:text-orange-400">
                          {v.code}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {v.type === 'fixed'
                            ? `Potongan ${formatMyr(v.value)}`
                            : `Diskaun ${v.value}%`}{' '}
                          · Min {formatMyr(v.minPurchase)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateVouchers(
                            store.vouchers.filter((x) => x.id !== v.id)
                          );
                          showToast('Voucher dipadam.');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = parseFloat(newVoucherForm.value);
                    const minP = parseFloat(newVoucherForm.minPurchase) || 0;
                    if (!newVoucherForm.code.trim() || isNaN(val) || val <= 0)
                      return;
                    onUpdateVouchers([
                      ...store.vouchers,
                      {
                        id: `v-${Date.now()}`,
                        code: newVoucherForm.code.trim().toUpperCase(),
                        type: newVoucherForm.type,
                        value: val,
                        minPurchase: minP,
                        active: true,
                      },
                    ]);
                    setNewVoucherForm({
                      code: '',
                      type: 'fixed',
                      value: '',
                      minPurchase: '',
                    });
                    showToast('Kod voucher baharu ditambah.');
                  }}
                  className="grid sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]"
                >
                  <input
                    type="text"
                    required
                    value={newVoucherForm.code}
                    onChange={(e) =>
                      setNewVoucherForm({
                        ...newVoucherForm,
                        code: e.target.value,
                      })
                    }
                    placeholder="Kod (cth: RAYA20)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs uppercase"
                  />
                  <select
                    value={newVoucherForm.type}
                    onChange={(e) =>
                      setNewVoucherForm({
                        ...newVoucherForm,
                        type: e.target.value as 'fixed' | 'percent',
                      })
                    }
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  >
                    <option value="fixed">Tetap (RM)</option>
                    <option value="percent">Peratus (%)</option>
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newVoucherForm.value}
                    onChange={(e) =>
                      setNewVoucherForm({
                        ...newVoucherForm,
                        value: e.target.value,
                      })
                    }
                    placeholder="Nilai"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={newVoucherForm.minPurchase}
                    onChange={(e) =>
                      setNewVoucherForm({
                        ...newVoucherForm,
                        minPurchase: e.target.value,
                      })
                    }
                    placeholder="Min Belian (RM)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    Tambah Voucher
                  </button>
                </form>
              </div>

              {/* Hero Sliders */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 sm:p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Hero Banner Slider
                </h2>
                <div className="space-y-2.5">
                  {store.sliders.map((slide) => (
                    <div
                      key={slide.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-12 w-20 rounded-md overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800">
                          <GameImage
                            src={slide.image}
                            alt={slide.title}
                            title={slide.title}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {slide.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {slide.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-[11px] font-medium cursor-pointer">
                          <Upload className="w-3 h-3 text-orange-500" />
                          <span>Pilih Gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              readImageFile(file, (dataUrl) => {
                                onUpdateSliders(
                                  store.sliders.map((s) =>
                                    s.id === slide.id
                                      ? { ...s, image: dataUrl }
                                      : s
                                  )
                                );
                                showToast('Gambar slaid dikemas kini.');
                              });
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSliders(
                              store.sliders.filter((s) => s.id !== slide.id)
                            )
                          }
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSliderForm.title.trim()) return;
                    onUpdateSliders([
                      ...store.sliders,
                      {
                        id: `slide-${Date.now()}`,
                        title: newSliderForm.title.trim(),
                        subtitle: newSliderForm.subtitle.trim(),
                        ctaLabel: newSliderForm.ctaLabel.trim() || 'Topup Sekarang',
                        targetBrandSlug: newSliderForm.targetBrandSlug || undefined,
                        image:
                          newSliderForm.image || store.sliders[0]?.image || '',
                        active: true,
                      },
                    ]);
                    setNewSliderForm({
                      title: '',
                      subtitle: '',
                      ctaLabel: 'Topup Sekarang',
                      targetBrandSlug: store.brands[0]?.slug ?? '',
                      image: '',
                    });
                    showToast('Slaid banner ditambah.');
                  }}
                  className="grid sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]"
                >
                  <input
                    type="text"
                    required
                    value={newSliderForm.title}
                    onChange={(e) =>
                      setNewSliderForm({
                        ...newSliderForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="Tajuk slaid"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  />
                  <input
                    type="text"
                    value={newSliderForm.subtitle}
                    onChange={(e) =>
                      setNewSliderForm({
                        ...newSliderForm,
                        subtitle: e.target.value,
                      })
                    }
                    placeholder="Subtajuk ringkas"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    <span className="truncate">
                      {newSliderForm.image ? 'Gambar Dipilih' : 'Pilih Gambar'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        readImageFile(file, (dataUrl) => {
                          setNewSliderForm((prev) => ({
                            ...prev,
                            image: dataUrl,
                          }));
                        });
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    + Tambah Slaid
                  </button>
                </form>
              </div>

              {/* FAQs */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 sm:p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Soalan Lazim (FAQ)
                </h2>
                <div className="space-y-2.5">
                  {store.faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {faq.question}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {faq.answer}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateFaqs(
                            store.faqs.filter((f) => f.id !== faq.id)
                          )
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newFaqForm.question.trim() || !newFaqForm.answer.trim())
                      return;
                    onUpdateFaqs([
                      ...store.faqs,
                      {
                        id: `faq-${Date.now()}`,
                        question: newFaqForm.question.trim(),
                        answer: newFaqForm.answer.trim(),
                        active: true,
                      },
                    ]);
                    setNewFaqForm({ question: '', answer: '' });
                    showToast('FAQ baharu ditambah.');
                  }}
                  className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]"
                >
                  <input
                    type="text"
                    required
                    value={newFaqForm.question}
                    onChange={(e) =>
                      setNewFaqForm({ ...newFaqForm, question: e.target.value })
                    }
                    placeholder="Soalan"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  />
                  <textarea
                    rows={2}
                    required
                    value={newFaqForm.answer}
                    onChange={(e) =>
                      setNewFaqForm({ ...newFaqForm, answer: e.target.value })
                    }
                    placeholder="Jawapan"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    + Tambah FAQ
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {/* TAB: INFORMASI (Bar 4 Public Feed Management) */}
          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Create Info Post Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newInfoForm.title.trim() || !newInfoForm.content.trim()) {
                    return;
                  }
                  const created: InfoPost = {
                    id: `info-${Date.now()}`,
                    title: newInfoForm.title.trim(),
                    content: newInfoForm.content.trim(),
                    image: newInfoForm.image.trim() || undefined,
                    createdAt: new Date().toISOString(),
                    active: true,
                  };
                  onUpdateInfoPosts([created, ...store.infoPosts]);
                  setNewInfoForm({ title: '', content: '', image: '' });
                  showToast('Informasi baharu diterbitkan.');
                }}
                className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 space-y-4"
              >
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Tambah Informasi / Pengumuman Baharu
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paparan gambar dan teks ini akan muncul pada Bar 4 (Informasi).
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Tajuk Informasi
                    </label>
                    <input
                      type="text"
                      required
                      value={newInfoForm.title}
                      onChange={(e) =>
                        setNewInfoForm({ ...newInfoForm, title: e.target.value })
                      }
                      placeholder="Contoh: Jadual Penyelenggaraan atau Promosi Terkini"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Gambar (Muat Naik atau URL Gambar)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={newInfoForm.image}
                        onChange={(e) =>
                          setNewInfoForm({
                            ...newInfoForm,
                            image: e.target.value,
                          })
                        }
                        placeholder="https://... (atau muat naik gambar di sebelah)"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Muat Naik Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const res = String(reader.result || '');
                              if (res) {
                                setNewInfoForm((prev) => ({
                                  ...prev,
                                  image: res,
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    {newInfoForm.image ? (
                      <div className="mt-2 relative w-48 aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                        <GameImage
                          src={newInfoForm.image}
                          alt="Pratonton gambar informasi"
                          title="Pratonton"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewInfoForm({ ...newInfoForm, image: '' })
                          }
                          aria-label="Buang gambar"
                          className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Tulisan / Kandungan Informasi
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newInfoForm.content}
                      onChange={(e) =>
                        setNewInfoForm({
                          ...newInfoForm,
                          content: e.target.value,
                        })
                      }
                      placeholder="Tulis maklumat penuh di sini..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Terbitkan Informasi</span>
                </button>
              </form>

              {/* Existing Info Posts */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Senarai Informasi ({store.infoPosts.length})
                </h2>

                {store.infoPosts.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Tiada informasi diterbitkan lagi.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {store.infoPosts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {post.image ? (
                              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                                <GameImage
                                  src={post.image}
                                  alt={post.title}
                                  title={post.title}
                                />
                              </div>
                            ) : null}
                            <div className="flex-1 min-w-0 space-y-2">
                              <input
                                type="text"
                                value={post.title}
                                onChange={(e) =>
                                  onUpdateInfoPosts(
                                    store.infoPosts.map((p) =>
                                      p.id === post.id
                                        ? { ...p, title: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-semibold"
                              />
                              <textarea
                                rows={2}
                                value={post.content}
                                onChange={(e) =>
                                  onUpdateInfoPosts(
                                    store.infoPosts.map((p) =>
                                      p.id === post.id
                                        ? { ...p, content: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <label className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-[11px] font-medium cursor-pointer">
                              <span>Gambar</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const res = String(reader.result || '');
                                    if (res) {
                                      onUpdateInfoPosts(
                                        store.infoPosts.map((p) =>
                                          p.id === post.id
                                            ? { ...p, image: res }
                                            : p
                                        )
                                      );
                                      showToast('Gambar dikemas kini.');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateInfoPosts(
                                  store.infoPosts.map((p) =>
                                    p.id === post.id
                                      ? { ...p, active: !p.active }
                                      : p
                                  )
                                );
                                showToast('Status informasi dikemas kini.');
                              }}
                              className={`px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                                post.active
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-600 text-white'
                              }`}
                            >
                              {post.active ? 'Aktif' : 'Sembunyi'}
                            </button>
                            <button
                              type="button"
                              aria-label="Padam informasi"
                              onClick={() => {
                                onUpdateInfoPosts(
                                  store.infoPosts.filter((p) => p.id !== post.id)
                                );
                                showToast('Informasi dipadam.');
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* TAB 5: SETTINGS (Ported from cms/setting/setting/Index.vue) */}
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              {/* Settings Sub-Tabs */}
              <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/[0.08] pb-2">
                {(
                  [
                    { id: 'general', label: 'Maklumat Umum' },
                    { id: 'transfer', label: 'Bayaran Manual' },
                    { id: 'telegram', label: 'Telegram Info Channel' },
                    { id: 'emailOtp', label: 'E-mel OTP (Gmail)' },
                    { id: 'whatsapp', label: 'Templat WhatsApp' },
                    { id: 'content', label: 'Halaman Kandungan' },
                    { id: 'maintenance', label: 'Penyelenggaraan' },
                    { id: 'backup', label: 'Sandaran JSON' },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSettingsSubTab(sub.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      settingsSubTab === sub.id
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab: General */}
              {settingsSubTab === 'general' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Nama Laman Web
                      </label>
                      <input
                        type="text"
                        value={store.settings.title}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Nombor WhatsApp Admin / CS
                      </label>
                      <input
                        type="text"
                        value={store.settings.whatsappCs}
                        onChange={(e) => {
                          const nextWa = e.target.value;
                          const prevWaDigits = store.settings.whatsappCs.replace(
                            /\D/g,
                            ''
                          );
                          const currentPhoneDigits = store.settings.phone.replace(
                            /\D/g,
                            ''
                          );
                          const shouldSyncPhone =
                            !store.settings.phone.trim() ||
                            store.settings.phone === '+60 11-2345 6789' ||
                            currentPhoneDigits === prevWaDigits;
                          onUpdateSettings({
                            ...store.settings,
                            whatsappCs: nextWa,
                            ...(shouldSyncPhone
                              ? {
                                  phone: nextWa.trim().startsWith('+')
                                    ? nextWa.trim()
                                    : nextWa.trim()
                                      ? `+${nextWa.replace(/\D/g, '')}`
                                      : '',
                                }
                              : {}),
                          });
                        }}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Nombor Telefon (Hubungi Kami)
                      </label>
                      <input
                        type="text"
                        value={store.settings.phone}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Contoh: +60 14-805 4339"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        E-mel Sokongan
                      </label>
                      <input
                        type="email"
                        value={store.settings.email}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        PIN Admin (Kosong = Tiada Kunci)
                      </label>
                      <input
                        type="text"
                        value={store.settings.adminPin}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...store.settings,
                            adminPin: e.target.value,
                          })
                        }
                        placeholder="Contoh: 1234"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                      Deskripsi Footer
                    </label>
                    <textarea
                      rows={3}
                      value={store.settings.footerDescription}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          footerDescription: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                    />
                  </div>
                </div>
              ) : null}

              {/* Sub-tab: Manual Transfer */}
              {settingsSubTab === 'transfer' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold">
                        Akaun Bayaran Manual
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tetapkan sama ada saluran bayaran menghantar pembeli ke WhatsApp atau menyemak transaksi di Telegram Info Channel.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('telegram')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-xs font-semibold cursor-pointer self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tetapkan Telegram Channel</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {store.paymentAccounts.map((rawAcc) => {
                      const acc = resolvePaymentAccountDisplay(
                        rawAcc,
                        store.settings
                      );
                      const effectiveFlow =
                        acc.notifyChannel ??
                        (acc.channelCode.toUpperCase() === 'TNG'
                          ? 'telegram'
                          : 'whatsapp');
                      return (
                        <div
                          key={acc.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] space-y-3"
                        >
                          <div className="grid sm:grid-cols-5 gap-3 items-end">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                Nama Saluran
                              </label>
                              <input
                                type="text"
                                value={acc.name}
                                onChange={(e) =>
                                  onUpdatePaymentAccounts(
                                    store.paymentAccounts.map((p) =>
                                      p.id === acc.id
                                        ? { ...p, name: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                No. Akaun / Tel
                              </label>
                              <input
                                type="text"
                                value={acc.accountNumber}
                                onChange={(e) =>
                                  onUpdatePaymentAccounts(
                                    store.paymentAccounts.map((p) =>
                                      p.id === acc.id
                                        ? { ...p, accountNumber: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-mono-tabular"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                Atas Nama
                              </label>
                              <input
                                type="text"
                                value={acc.accountLabel}
                                onChange={(e) =>
                                  onUpdatePaymentAccounts(
                                    store.paymentAccounts.map((p) =>
                                      p.id === acc.id
                                        ? { ...p, accountLabel: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                Aliran Butang
                              </label>
                              <select
                                aria-label={`Aliran notifikasi ${acc.name}`}
                                value={effectiveFlow}
                                onChange={(e) =>
                                  onUpdatePaymentAccounts(
                                    store.paymentAccounts.map((p) =>
                                      p.id === acc.id
                                        ? {
                                            ...p,
                                            notifyChannel: e.target.value as
                                              | 'whatsapp'
                                              | 'telegram',
                                          }
                                        : p
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs font-semibold"
                              >
                                <option value="whatsapp">Hantar WhatsApp</option>
                                <option value="telegram">
                                  Telegram Info Channel
                                </option>
                              </select>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdatePaymentAccounts(
                                    store.paymentAccounts.map((p) =>
                                      p.id === acc.id
                                        ? { ...p, active: !p.active }
                                        : p
                                    )
                                  )
                                }
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                                  acc.active
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-600 text-white'
                                }`}
                              >
                                {acc.active ? 'Aktif' : 'Mati'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdatePaymentAccounts(
                                    store.paymentAccounts.filter(
                                      (p) => p.id !== acc.id
                                    )
                                  )
                                }
                                className="p-1.5 text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06]">
                            <div className="flex flex-wrap items-center gap-2.5">
                              {acc.qrImageUrl ? (
                                <img
                                  src={acc.qrImageUrl}
                                  alt={`QR ${acc.name}`}
                                  className="h-12 w-12 rounded-lg border border-slate-200 dark:border-white/15 object-contain bg-black"
                                />
                              ) : null}
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#141923] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-orange-500">
                                <Upload className="w-3.5 h-3.5" />
                                <span>
                                  {acc.qrImageUrl
                                    ? 'Tukar Gambar QR'
                                    : 'Muat Naik Gambar QR'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    readImageFile(file, (dataUrl) => {
                                      onUpdatePaymentAccounts(
                                        store.paymentAccounts.map((p) =>
                                          p.id === acc.id
                                            ? { ...p, qrImageUrl: dataUrl }
                                            : p
                                        )
                                      );
                                      showToast(
                                        `Gambar QR untuk ${acc.name} dikemas kini.`
                                      );
                                    });
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              {acc.qrImageUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdatePaymentAccounts(
                                      store.paymentAccounts.map((p) =>
                                        p.id === acc.id
                                          ? { ...p, qrImageUrl: '' }
                                          : p
                                      )
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                >
                                  Buang QR
                                </button>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePaymentAccounts(
                                  store.paymentAccounts.map((p) =>
                                    p.id === acc.id
                                      ? {
                                          ...p,
                                          requireProof: !acc.requireProof,
                                        }
                                      : p
                                  )
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                acc.requireProof
                                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300'
                                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {acc.requireProof
                                ? 'Bukti Bayaran: Wajib Pilih Fail'
                                : 'Bukti Bayaran: Pilihan'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newPayForm.name.trim() || !newPayForm.accountNumber.trim())
                        return;
                      onUpdatePaymentAccounts([
                        ...store.paymentAccounts,
                        {
                          id: `pay-${Date.now()}`,
                          name: newPayForm.name.trim(),
                          type: newPayForm.type,
                          channelCode: (
                            newPayForm.channelCode.trim() || newPayForm.name
                          )
                            .toUpperCase()
                            .slice(0, 10),
                          accountLabel:
                            newPayForm.accountLabel.trim() ||
                            store.settings.title,
                          accountNumber: newPayForm.accountNumber.trim(),
                          instructions:
                            newPayForm.instructions.trim() ||
                            (newPayForm.notifyChannel === 'telegram'
                              ? 'Selepas buat bayaran, semak transaksi anda di Telegram Info Channel.'
                              : 'Pindahkan jumlah tepat dan hantar resit ke WhatsApp admin.'),
                          notifyChannel: newPayForm.notifyChannel,
                          active: true,
                        },
                      ]);
                      setNewPayForm({
                        name: '',
                        type: 'bank',
                        channelCode: '',
                        accountLabel: '',
                        accountNumber: '',
                        instructions: '',
                        notifyChannel: 'whatsapp',
                      });
                      showToast('Saluran bayaran ditambah.');
                    }}
                    className="grid sm:grid-cols-5 gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]"
                  >
                    <input
                      type="text"
                      required
                      value={newPayForm.name}
                      onChange={(e) =>
                        setNewPayForm({ ...newPayForm, name: e.target.value })
                      }
                      placeholder="Nama Bank / eWallet"
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={newPayForm.accountNumber}
                      onChange={(e) =>
                        setNewPayForm({
                          ...newPayForm,
                          accountNumber: e.target.value,
                        })
                      }
                      placeholder="Nombor Akaun / No. TNG"
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                    />
                    <input
                      type="text"
                      value={newPayForm.accountLabel}
                      onChange={(e) =>
                        setNewPayForm({
                          ...newPayForm,
                          accountLabel: e.target.value,
                        })
                      }
                      placeholder="Atas Nama"
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                    />
                    <select
                      aria-label="Aliran notifikasi akaun baru"
                      value={newPayForm.notifyChannel}
                      onChange={(e) =>
                        setNewPayForm({
                          ...newPayForm,
                          notifyChannel: e.target.value as
                            | 'whatsapp'
                            | 'telegram',
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-semibold"
                    >
                      <option value="whatsapp">Aliran: WhatsApp</option>
                      <option value="telegram">Aliran: Telegram Info</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                    >
                      + Tambah Akaun
                    </button>
                  </form>
                </div>
              ) : null}

              {/* Sub-tab: Telegram Info Channel */}
              {settingsSubTab === 'telegram' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-bold flex items-center gap-2">
                        <Send className="w-4 h-4 text-sky-500" />
                        <span>Telegram Info Channel &amp; Notif Pembelian</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Apabila pembeli memilih bayaran TNG (atau saluran beraliran Telegram), butang invoice akan mengarahkan pembeli menyemak status di Channel Telegram ini, dan setiap pembelian baharu akan dihantar automatik ke Channel.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTgForm((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }))
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        tgForm.enabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white'
                      }`}
                    >
                      {tgForm.enabled
                        ? 'Notif Auto: Aktif'
                        : 'Notif Auto: Mati'}
                    </button>
                  </div>

                  {tgLoading ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Memuatkan tetapan Telegram...
                    </p>
                  ) : null}

                  {tgStatusMsg ? (
                    <div
                      className={`p-3 rounded-lg border text-xs font-medium ${
                        tgStatusMsg.type === 'success'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {tgStatusMsg.text}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Nama Channel (Paparan Pembeli)
                      </label>
                      <input
                        type="text"
                        value={tgForm.channelName}
                        onChange={(e) =>
                          setTgForm({ ...tgForm, channelName: e.target.value })
                        }
                        placeholder="Telegram Info Channel"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Pautan / Username Channel Info (Untuk Pembeli)
                      </label>
                      <input
                        type="text"
                        value={tgForm.channelUrl}
                        onChange={(e) =>
                          setTgForm({ ...tgForm, channelUrl: e.target.value })
                        }
                        placeholder="https://t.me/topupbalzinfo atau @topupbalzinfo"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Channel ID / @Username (Untuk Bot Hantar Notif)
                      </label>
                      <input
                        type="text"
                        value={tgForm.channelId}
                        onChange={(e) =>
                          setTgForm({ ...tgForm, channelId: e.target.value })
                        }
                        placeholder="Contoh: @topupbalzinfo atau -1001234567890"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Bot Token Telegram (@BotFather)
                      </label>
                      <div className="relative">
                        <input
                          type={showBotToken ? 'text' : 'password'}
                          value={tgForm.botToken}
                          onChange={(e) =>
                            setTgForm({ ...tgForm, botToken: e.target.value })
                          }
                          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                          className="w-full pr-10 pl-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                        />
                        <button
                          type="button"
                          onClick={() => setShowBotToken((v) => !v)}
                          aria-label={
                            showBotToken
                              ? 'Sembunyikan token bot'
                              : 'Tunjukkan token bot'
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          {showBotToken ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={tgSaving}
                      onClick={async () => {
                        setTgSaving(true);
                        setTgStatusMsg(null);
                        try {
                          const saved = await saveAdminTelegramApi(tgForm);
                          setTgForm(saved.telegram);
                          onUpdateSettings({
                            ...store.settings,
                            telegramChannelUrl: saved.telegram.channelUrl,
                            telegramChannelName: saved.telegram.channelName,
                          });
                          setTgStatusMsg({
                            type: 'success',
                            text: 'Tetapan Telegram Info Channel berjaya disimpan.',
                          });
                          showToast('Tetapan Telegram disimpan.');
                        } catch (err) {
                          setTgStatusMsg({
                            type: 'error',
                            text:
                              err instanceof Error
                                ? err.message
                                : 'Gagal menyimpan tetapan Telegram.',
                          });
                        } finally {
                          setTgSaving(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {tgSaving
                          ? 'Menyimpan...'
                          : 'Simpan Tetapan Telegram'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={tgTesting}
                      onClick={async () => {
                        setTgTesting(true);
                        setTgStatusMsg(null);
                        try {
                          await testAdminTelegramApi({
                            botToken: tgForm.botToken,
                            channelId: tgForm.channelId,
                          });
                          setTgStatusMsg({
                            type: 'success',
                            text: 'Mesej ujian berjaya dihantar ke Channel Telegram anda!',
                          });
                          showToast('Ujian Telegram berjaya!');
                        } catch (err) {
                          setTgStatusMsg({
                            type: 'error',
                            text:
                              err instanceof Error
                                ? err.message
                                : 'Gagal menghantar mesej ujian ke Telegram.',
                          });
                        } finally {
                          setTgTesting(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-60 text-xs font-semibold text-sky-600 dark:text-sky-300 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {tgTesting
                          ? 'Menghantar ujian...'
                          : 'Uji Hantar Notif ke Channel'}
                      </span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1117] p-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Cara Penyediaan Pantas:
                    </p>
                    <p>
                      1. Cipta bot melalui <span className="font-mono-tabular">@BotFather</span> di Telegram dan salin <strong>Bot Token</strong> ke ruangan di atas.
                    </p>
                    <p>
                      2. Masukkan bot tersebut sebagai <strong>Admin</strong> dalam Telegram Info Channel anda (beri kebenaran <em>Post Messages</em>).
                    </p>
                    <p>
                      3. Isi <strong>Pautan Channel</strong> (contoh: <span className="font-mono-tabular">https://t.me/namachannel</span>) supaya pembeli boleh menekan butang <em>Cek Transaksi di Telegram Info Channel</em> selepas beli.
                    </p>
                    <p>
                      4. Isi <strong>Channel ID / @Username</strong> (contoh: <span className="font-mono-tabular">@namachannel</span> atau ID <span className="font-mono-tabular">-100...</span> untuk channel private), aktifkan <strong>Notif Auto</strong>, simpan, dan tekan butang ujian.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Sub-tab: Email OTP (Gmail SMTP) */}
              {settingsSubTab === 'emailOtp' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-bold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-500" />
                        <span>Penghantaran Kod OTP ke Gmail (SMTP)</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Sambungkan akaun Gmail anda dengan Google App Password supaya kod OTP pendaftaran dihantar terus ke peti masuk Gmail pelanggan secara nyata.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEmailOtpForm((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }))
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        emailOtpForm.enabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white'
                      }`}
                    >
                      {emailOtpForm.enabled
                        ? 'Gmail SMTP: Aktif'
                        : 'Gmail SMTP: Mati'}
                    </button>
                  </div>

                  {emailOtpStatusMsg ? (
                    <div
                      className={`p-3 rounded-lg border text-xs font-medium ${
                        emailOtpStatusMsg.type === 'success'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {emailOtpStatusMsg.text}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Nama Pengirim
                      </label>
                      <input
                        type="text"
                        value={emailOtpForm.senderName}
                        onChange={(e) =>
                          setEmailOtpForm({
                            ...emailOtpForm,
                            senderName: e.target.value,
                          })
                        }
                        placeholder="TopupBalz"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Alamat Gmail Pengirim
                      </label>
                      <input
                        type="email"
                        value={emailOtpForm.gmailUser}
                        onChange={(e) =>
                          setEmailOtpForm({
                            ...emailOtpForm,
                            gmailUser: e.target.value,
                          })
                        }
                        placeholder="contoh@gmail.com"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        Google App Password (16 Aksara){' '}
                        {emailOtpForm.hasAppPassword ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            · Sudah disimpan
                          </span>
                        ) : null}
                      </label>
                      <div className="relative">
                        <input
                          type={showGmailPass ? 'text' : 'password'}
                          value={gmailAppPasswordInput}
                          onChange={(e) =>
                            setGmailAppPasswordInput(e.target.value)
                          }
                          placeholder={
                            emailOtpForm.hasAppPassword
                              ? 'Biarkan kosong untuk kekalkan kata laluan sedia ada'
                              : 'xxxx xxxx xxxx xxxx'
                          }
                          className="w-full pr-10 pl-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGmailPass((v) => !v)}
                          aria-label={
                            showGmailPass
                              ? 'Sembunyikan App Password'
                              : 'Tunjukkan App Password'
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          {showGmailPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                        E-mel Penerima Ujian
                      </label>
                      <input
                        type="email"
                        value={emailOtpTestTo}
                        onChange={(e) => setEmailOtpTestTo(e.target.value)}
                        placeholder={
                          emailOtpForm.gmailUser || 'siuiqbal23@gmail.com'
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm font-mono-tabular"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={emailOtpSaving}
                      onClick={async () => {
                        setEmailOtpSaving(true);
                        setEmailOtpStatusMsg(null);
                        try {
                          const res = await saveAdminEmailOtpApi({
                            enabled: emailOtpForm.enabled,
                            gmailUser: emailOtpForm.gmailUser,
                            gmailAppPassword:
                              gmailAppPasswordInput.trim() || undefined,
                            senderName: emailOtpForm.senderName,
                          });
                          setEmailOtpForm(res.emailOtp);
                          setGmailAppPasswordInput('');
                          setEmailOtpStatusMsg({
                            type: 'success',
                            text: 'Tetapan Gmail SMTP berjaya disimpan.',
                          });
                          showToast('Tetapan Gmail OTP disimpan.');
                        } catch (err) {
                          setEmailOtpStatusMsg({
                            type: 'error',
                            text:
                              err instanceof Error
                                ? err.message
                                : 'Gagal menyimpan tetapan Gmail OTP.',
                          });
                        } finally {
                          setEmailOtpSaving(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {emailOtpSaving
                          ? 'Menyimpan...'
                          : 'Simpan Tetapan Gmail'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={emailOtpTesting}
                      onClick={async () => {
                        setEmailOtpTesting(true);
                        setEmailOtpStatusMsg(null);
                        try {
                          await testAdminEmailOtpApi({
                            gmailUser: emailOtpForm.gmailUser,
                            gmailAppPassword:
                              gmailAppPasswordInput.trim() || undefined,
                            senderName: emailOtpForm.senderName,
                            toEmail:
                              emailOtpTestTo.trim() || emailOtpForm.gmailUser,
                          });
                          setEmailOtpStatusMsg({
                            type: 'success',
                            text: 'E-mel ujian berjaya dihantar ke peti masuk Gmail! Semak Inbox / Spam.',
                          });
                          showToast('E-mel ujian berjaya dihantar!');
                        } catch (err) {
                          setEmailOtpStatusMsg({
                            type: 'error',
                            text:
                              err instanceof Error
                                ? err.message
                                : 'Gagal menghantar e-mel ujian melalui Gmail SMTP.',
                          });
                        } finally {
                          setEmailOtpTesting(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-60 text-xs font-semibold text-orange-600 dark:text-orange-300 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>
                        {emailOtpTesting
                          ? 'Menghantar ujian...'
                          : 'Uji Hantar E-mel ke Gmail'}
                      </span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1117] p-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Cara Dapatkan Google App Password (Untuk Hantar OTP Sebenar ke Gmail):
                    </p>
                    <p>
                      1. Pastikan <strong>2-Step Verification</strong> diaktifkan pada akaun Google anda.
                    </p>
                    <p>
                      2. Buka <strong>myaccount.google.com/apppasswords</strong>, cipta App Password baharu (pilih nama <em>TopupBalz</em>), dan salin kod 16 aksara ke ruangan di atas.
                    </p>
                    <p>
                      3. Aktifkan suis <strong>Gmail SMTP: Aktif</strong> di atas, klik <strong>Simpan Tetapan Gmail</strong>, kemudian tekan <strong>Uji Hantar E-mel ke Gmail</strong>.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Sub-tab: WhatsApp Templates */}
              {settingsSubTab === 'whatsapp' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pemboleh ubah tersedia: {'{customer_name}'}, {'{order_id}'},{' '}
                    {'{app_name}'}, {'{brand_name}'}, {'{product_name}'},{' '}
                    {'{account_id}'}, {'{payment_method}'}, {'{total_amount}'}
                  </p>
                  {(
                    [
                      {
                        key: 'customerCheckout',
                        label: 'Templat Checkout Pembeli ke WhatsApp Admin',
                      },
                      {
                        key: 'orderCreated',
                        label: 'Templat Admin: Pesanan Diterima',
                      },
                      {
                        key: 'orderCompleted',
                        label: 'Templat Admin: Topup Selesai',
                      },
                      {
                        key: 'orderFailed',
                        label: 'Templat Admin: Pesanan Gagal / Batal',
                      },
                    ] as const
                  ).map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                        {item.label}
                      </label>
                      <textarea
                        rows={4}
                        value={store.whatsappTemplates[item.key]}
                        onChange={(e) =>
                          onUpdateWhatsappTemplates({
                            ...store.whatsappTemplates,
                            [item.key]: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Sub-tab: Content Pages */}
              {settingsSubTab === 'content' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Syarat &amp; Ketentuan
                    </label>
                    <textarea
                      rows={6}
                      value={store.settings.termsText}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          termsText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Kebijakan Privasi
                    </label>
                    <textarea
                      rows={6}
                      value={store.settings.privacyPolicyText}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          privacyPolicyText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ) : null}

              {/* Sub-tab: Maintenance */}
              {settingsSubTab === 'maintenance' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Mod Penyelenggaraan</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Aktifkan untuk menutup storefront sementara kepada pengunjung.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...store.settings,
                          maintenanceActive: !store.settings.maintenanceActive,
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        store.settings.maintenanceActive
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white'
                      }`}
                    >
                      {store.settings.maintenanceActive ? 'Aktif (Tutup Web)' : 'Tidak Aktif'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Tajuk Penyelenggaraan
                    </label>
                    <input
                      type="text"
                      value={store.settings.maintenanceTitle}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          maintenanceTitle: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Mesej Penyelenggaraan
                    </label>
                    <textarea
                      rows={3}
                      value={store.settings.maintenanceDescription}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...store.settings,
                          maintenanceDescription: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-sm"
                    />
                  </div>
                </div>
              ) : null}

              {/* Sub-tab: Backup */}
              {settingsSubTab === 'backup' ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Semua data disimpan secara tempatan pada pelayar. Muat turun sandaran JSON sebelum mengosongkan pelayar atau memindahkan data.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white/10 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Muat Turun JSON</span>
                    </button>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Pulihkan JSON</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onResetState();
                        showToast('Data dipulihkan kepada tetapan asal.');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600/15 text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Set Semula Data Asal</span>
                    </button>
                  </div>
                  {importError ? (
                    <p className="text-xs text-rose-500">{importError}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* TAB: REGISTERED & LOGGED-IN USER EMAILS */}
          {activeTab === 'users' ? (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jumlah E-mel Berdaftar / Log Masuk
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular mt-1">
                    {adminUsers.length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    E-mel Disahkan (OTP / Google)
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-1">
                    {adminUsers.filter((u) => u.emailVerified).length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pengguna Pernah Membeli
                  </p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-orange-600 dark:text-orange-400 mt-1">
                    {adminUsers.filter((u) => u.orderCount > 0).length}
                  </p>
                </div>
              </div>

              {/* Search & Refresh */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold">
                      Semua E-mel Log Masuk &amp; Akaun Pengguna
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Setiap akaun yang pernah daftar atau log masuk melalui Google / E-mel dipaparkan di sini.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search
                        className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Cari e-mel, nama, no. tel..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={loadAdminUsers}
                      disabled={usersLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Muat Semula</span>
                    </button>
                  </div>
                </div>

                {usersError ? (
                  <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-500">
                    {usersError}
                  </p>
                ) : null}

                {usersLoading && adminUsers.length === 0 ? (
                  <p className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                    Memuatkan senarai e-mel pengguna...
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                    Tiada e-mel pengguna ditemui.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.uid}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-tabular text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-all">
                              {u.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(u.email);
                                showToast(`E-mel ${u.email} disalin.`);
                              }}
                              title="Salin e-mel"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" aria-hidden="true" />
                              <span>Salin</span>
                            </button>
                            {u.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-semibold">
                                Admin
                              </span>
                            ) : null}
                            {u.emailVerified ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                Disahkan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                                Belum Disahkan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {u.name}
                            {u.phone ? ` · ${u.phone}` : ''}
                            {u.providers && u.providers.length > 0
                              ? ` · Kaedah: ${u.providers
                                  .map((p) =>
                                    p === 'google.com'
                                      ? 'Google'
                                      : p === 'password'
                                        ? 'E-mel & Kata Laluan'
                                        : p
                                  )
                                  .join(', ')}`
                              : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap sm:flex-col sm:items-end gap-x-4 gap-y-1 text-[11px] shrink-0">
                          <span className="font-mono-tabular font-semibold text-slate-800 dark:text-slate-200">
                            {u.orderCount} pesanan · {formatMyr(u.totalSpent)}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Log masuk terakhir:{' '}
                            {new Date(u.lastLoginAt).toLocaleString('ms-MY', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Order Inspector & Payment Validation Modal */}
      {inspectedOrder ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono-tabular text-xs font-semibold text-orange-600 dark:text-orange-400">
                  {inspectedOrder.reference}
                </p>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Semakan &amp; Pengesahan Pesanan
                </h3>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setInspectedRef(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.06] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pembeli:</span>
                <span className="font-semibold">
                  {inspectedOrder.customerName} ({inspectedOrder.whatsapp})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Produk:</span>
                <span className="font-semibold">
                  {inspectedOrder.brandName} · {inspectedOrder.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Akaun:</span>
                <span className="font-mono-tabular font-semibold">
                  {inspectedOrder.accountId}
                  {inspectedOrder.serverId ? ` (${inspectedOrder.serverId})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saluran Bayaran:</span>
                <span className="font-semibold">
                  {inspectedOrder.paymentMethodName}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                <span className="font-semibold">Total Bayaran:</span>
                <span className="font-mono-tabular text-sm font-bold text-orange-600 dark:text-orange-400">
                  {formatMyr(inspectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {inspectedOrder.paymentProofUrl ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Bukti Transfer Dimuat Naik:
                </p>
                <img
                  src={inspectedOrder.paymentProofUrl}
                  alt="Bukti bayaran pelanggan"
                  className="max-h-56 w-full rounded-xl border border-slate-200 dark:border-white/10 object-contain bg-black/20"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tiada gambar resit dimuat naik dalam invois (semak resit di WhatsApp).
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Status Pembayaran
                </label>
                <select
                  value={inspectedOrder.paymentStatus}
                  onChange={(e) => {
                    onUpdateOrder(inspectedOrder.reference, {
                      paymentStatus: Number(e.target.value) as PaymentStatusCode,
                    });
                    showToast('Status bayaran dikemas kini.');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                >
                  <option value={0}>Menunggu Bayaran</option>
                  <option value={2}>Lunas</option>
                  <option value={-1}>Dibatalkan</option>
                  <option value={-2}>Tamat Tempoh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Status Topup
                </label>
                <select
                  value={inspectedOrder.topupStatus}
                  onChange={(e) => {
                    onUpdateOrder(inspectedOrder.reference, {
                      topupStatus: Number(e.target.value) as TopupStatusCode,
                    });
                    showToast('Status topup dikemas kini.');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
                >
                  <option value={0}>Menunggu</option>
                  <option value={1}>Dalam Proses</option>
                  <option value={2}>Sukses</option>
                  <option value={3}>Gagal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Nota Admin
              </label>
              <input
                type="text"
                value={inspectedOrder.notes ?? ''}
                onChange={(e) =>
                  onUpdateOrder(inspectedOrder.reference, {
                    notes: e.target.value,
                  })
                }
                placeholder="Tambah nota dalaman..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs"
              />
            </div>

            {/* Quick WhatsApp Customer Update Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Hantar Kemaskini WhatsApp kepada Pembeli:
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildAdminWhatsAppUpdateUrl(
                    store,
                    inspectedOrder,
                    'orderCreated'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Minta Bayaran</span>
                </a>
                <a
                  href={buildAdminWhatsAppUpdateUrl(
                    store,
                    inspectedOrder,
                    'orderCompleted'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Maklumkan Selesai</span>
                </a>
                <a
                  href={buildAdminWhatsAppUpdateUrl(
                    store,
                    inspectedOrder,
                    'orderFailed'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-xs font-semibold text-rose-600 dark:text-rose-400"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Maklumkan Gagal</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(inspectedOrder.reference);
                  setInspectedRef(null);
                  showToast('Pesanan dipadam.');
                }}
                className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
              >
                Padam Pesanan
              </button>
              <button
                type="button"
                onClick={() => setInspectedRef(null)}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
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
