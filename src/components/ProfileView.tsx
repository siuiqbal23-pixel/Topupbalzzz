import { useEffect, useMemo, useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Lock,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Receipt,
  Search,
  Settings,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { formatMyr } from '../data/initialStoreData';
import { auth } from '../lib/firebase';
import type { AppearanceMode, OrderItem, UserProfile } from '../types/store';
import { PaymentStatusBadge, TopupStatusBadge } from './StatusBadge';

type ProfileTab = 'transactions' | 'settings';

interface ProfileViewProps {
  user: UserProfile;
  orders: OrderItem[];
  initialTab?: ProfileTab;
  appearance: AppearanceMode;
  onChangeAppearance: (mode: AppearanceMode) => void;
  onUpdateUser: (patch: { name: string; phone: string }) => Promise<void>;
  onViewOrder: (reference: string) => void;
  onNavigateAuth: (mode: 'login' | 'register') => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function ProfileView({
  user,
  orders,
  initialTab = 'transactions',
  appearance,
  onChangeAppearance,
  onUpdateUser,
  onViewOrder,
  onNavigateAuth,
  onOpenAdmin,
  onLogout,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
  }, [user.name, user.phone]);

  const filteredOrders = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (!q) return true;
      return (
        o.reference.toLowerCase().includes(q) ||
        o.brandName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.accountId.toLowerCase().includes(q)
      );
    });
  }, [orders, txSearch]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onUpdateUser({
        name: name.trim() || user.name,
        phone: phone.trim(),
      });
      setSavedNotice('Profil berjaya dikemas kini.');
      setTimeout(() => setSavedNotice(''), 2400);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordNotice('');
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      setPasswordError('Sila log masuk semula.');
      return;
    }
    const usesPasswordProvider = fbUser.providerData.some(
      (p) => p.providerId === 'password'
    );
    if (!usesPasswordProvider) {
      setPasswordError(
        'Akaun anda menggunakan Log Masuk Google. Kata laluan diurus melalui tetapan Google.'
      );
      return;
    }
    if (!currentPassword || !newPassword) {
      setPasswordError('Sila isi kata laluan semasa dan kata laluan baharu.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Pengesahan kata laluan tidak sepadan.');
      return;
    }
    try {
      const cred = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);
      await updatePassword(fbUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice('Kata laluan Firebase berjaya dikemas kini.');
      setTimeout(() => setPasswordNotice(''), 2400);
    } catch {
      setPasswordError('Kata laluan semasa tidak tepat atau sesi tamat.');
    }
  };

  if (!user.loggedIn) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-3 sm:px-5 py-8 flex items-center justify-center">
        <div className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto h-11 w-11 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <User className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Log Masuk Akaun Anda
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Log masuk dengan Google atau Emel untuk membeli topup, menyemak kod ID pembelian, dan mengurus tetapan akaun anda.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigateAuth('login')}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateAuth('register')}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Daftar</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-3 sm:px-5 py-5 sm:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {activeTab === 'settings' ? 'Tetapan Akaun' : 'Akaun & Profil Saya'}
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            <span>
              {user.name} · {user.email}
            </span>
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                <span>Disahkan</span>
              </span>
            ) : null}
          </div>
        </div>

        {user.role === 'admin' ? (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
            <span>Panel Admin</span>
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-4 items-start">
        <aside className="lg:col-span-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-2 shadow-sm">
          <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1">
            {(
              [
                { id: 'transactions', label: 'Kod & Sejarah', icon: Receipt },
                { id: 'settings', label: 'Tetapan Akaun', icon: Settings },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center lg:justify-start gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'transactions' ? (
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Sejarah Transaksi &amp; Kod ID Pembelian
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hanya rekod pembelian sebenar akaun anda dipaparkan di sini.
                  </p>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search
                    className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Cari kod ID atau game..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Anda belum mempunyai sebarang transaksi pembelian lagi.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => onViewOrder(order.reference)}
                      className="w-full text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1117] hover:border-orange-500/60 p-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono-tabular text-xs font-bold text-orange-600 dark:text-orange-400">
                            {order.reference}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-tabular">
                            {new Date(order.createdAt).toLocaleDateString('ms-MY', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {order.brandName} · {order.productName}
                        </p>
                        <p className="text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400">
                          ID Game: {order.accountId}
                          {order.serverId ? ` (${order.serverId})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                        <div className="text-left sm:text-right space-y-1">
                          <p className="font-mono-tabular text-xs font-bold text-slate-900 dark:text-white">
                            {formatMyr(order.totalAmount)}
                          </p>
                          <div className="flex items-center gap-1">
                            <PaymentStatusBadge status={order.paymentStatus} />
                            <TopupStatusBadge status={order.topupStatus} />
                          </div>
                        </div>
                        <ExternalLink
                          className="w-3.5 h-3.5 text-slate-400 shrink-0"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'settings' ? (
            <div className="space-y-4">
              {/* 1. Maklumat Profil Akaun */}
              <form
                onSubmit={handleSaveProfile}
                className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 sm:p-5 shadow-sm space-y-3.5"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" aria-hidden="true" />
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Maklumat Profil Akaun
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profileName"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Nama Penuh
                    </label>
                    <input
                      id="profileName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profilePhone"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Nombor WhatsApp
                    </label>
                    <input
                      id="profilePhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="profileEmail"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Alamat E-mel
                    </label>
                    <input
                      id="profileEmail"
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0E1117]/60 text-xs text-slate-500 dark:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                  {savedNotice ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>{savedNotice}</span>
                    </span>
                  ) : null}
                </div>
              </form>

              {/* 2. Keselamatan & Kata Laluan */}
              <form
                onSubmit={handleSavePassword}
                className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 sm:p-5 shadow-sm space-y-3.5"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-500" aria-hidden="true" />
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Keselamatan &amp; Tukar Kata Laluan
                  </h2>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="curPass"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Kata Laluan Semasa
                    </label>
                    <input
                      id="curPass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newPass"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Kata Laluan Baharu
                    </label>
                    <input
                      id="newPass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confPass"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Sahkan Kata Laluan
                    </label>
                    <input
                      id="confPass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {passwordError ? (
                  <p className="text-xs text-rose-500">{passwordError}</p>
                ) : null}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                  >
                    Kemas Kini Kata Laluan
                  </button>
                  {passwordNotice ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>{passwordNotice}</span>
                    </span>
                  ) : null}
                </div>
              </form>

              {/* 3. Tema Paparan */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-4 sm:p-5 shadow-sm space-y-3">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Tema Paparan Aplikasi
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'light', label: 'Cerah (Light)', icon: Sun },
                      { id: 'dark', label: 'Gelap (Dark)', icon: Moon },
                      { id: 'system', label: 'Sistem', icon: Monitor },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const active = appearance === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeAppearance(opt.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                          active
                            ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1117] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Sesi Akaun & Log Keluar (semua dalam Tetapan Akaun) */}
              <div className="rounded-xl border border-rose-500/20 bg-white dark:bg-[#141923] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Sesi Akaun
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Log keluar daripada akaun {user.email} pada peranti ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log Keluar Akaun</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
