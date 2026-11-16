import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthView } from './components/AuthView';
import { BottomNavBar } from './components/BottomNavBar';
import { BrandDetailView } from './components/BrandDetailView';
import { HomeView } from './components/HomeView';
import { InfoView } from './components/InfoView';
import { MainFooter } from './components/MainFooter';
import { MainHeader } from './components/MainHeader';
import { ProfileView } from './components/ProfileView';
import {
  MaintenanceView,
  StaticContentPage,
} from './components/StaticPagesView';
import { TransactionCheckView } from './components/TransactionCheckView';
import { TransactionShowView } from './components/TransactionShowView';
import {
  DEFAULT_GAME_PROMO,
  INITIAL_STORE_STATE,
  formatLocalMyPhone,
  getPromoItemQuota,
  isGamePromoLive,
  isGamePromoWithinTime,
  isPlaceholderPhoneValue,
  resolvePaymentAccountDisplay,
} from './data/initialStoreData';
import {
  createOrderApi,
  deleteAdminOrderApi,
  fetchAdminOrdersApi,
  fetchBootstrap,
  fetchMyOrders,
  fetchMyProfile,
  fetchOrderByReference,
  fetchPublicTransactions,
  saveAdminInfoPostsApi,
  saveAdminStoreConfigApi,
  updateAdminOrderApi,
  updateMyProfile,
  uploadOrderProofApi,
} from './lib/api';
import { auth } from './lib/firebase';
import type {
  AppearanceMode,
  BrandItem,
  CategoryItem,
  FaqItem,
  GamePromoConfig,
  HomeSection,
  InfoPost,
  ManualPaymentAccount,
  OrderItem,
  PublicOrderSummary,
  SliderItem,
  StoreSettings,
  TopupBalzStoreState,
  UserProfile,
  VoucherItem,
  WhatsAppTemplates,
} from './types/store';

function getStoredAppearance(): AppearanceMode {
  try {
    const val = localStorage.getItem('appearance');
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch {
    // ignore
  }
  return 'dark';
}

function applyTheme(mode: AppearanceMode) {
  if (typeof window === 'undefined') return;
  const isDark =
    mode === 'dark' ||
    (mode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export default function App() {
  const [store, setStore] = useState<TopupBalzStoreState>(INITIAL_STORE_STATE);
  const safeUser = store.user ?? INITIAL_STORE_STATE.user;
  const [publicTransactions, setPublicTransactions] = useState<
    PublicOrderSummary[]
  >([]);
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [adminOrders, setAdminOrders] = useState<OrderItem[]>([]);
  const [lookedUpOrder, setLookedUpOrder] = useState<OrderItem | null>(null);
  const [appearance, setAppearance] = useState<AppearanceMode>(() =>
    getStoredAppearance()
  );
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );
  const [pendingReturnPath, setPendingReturnPath] = useState<string | null>(
    null
  );
  const [preselectedProductId, setPreselectedProductId] = useState<
    string | undefined
  >(undefined);

  const refreshPublicTransactions = useCallback(() => {
    fetchPublicTransactions()
      .then((res) => setPublicTransactions(res.transactions))
      .catch(() => {});
  }, []);

  const refreshOrdersForUser = useCallback((role: UserProfile['role']) => {
    if (!auth.currentUser) {
      setMyOrders([]);
      setAdminOrders([]);
      return;
    }
    fetchMyOrders()
      .then((res) => setMyOrders(res.orders))
      .catch(() => {});
    if (role === 'admin') {
      fetchAdminOrdersApi()
        .then((res) => setAdminOrders(res.orders))
        .catch(() => {});
    } else {
      setAdminOrders([]);
    }
  }, []);

  // Load initial storefront configuration & real anonymized transactions from PostgreSQL
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchBootstrap().catch(() => null),
      fetchPublicTransactions().catch(() => ({ transactions: [] })),
    ]).then(([boot, pub]) => {
      if (cancelled) return;
      if (pub?.transactions) {
        setPublicTransactions(pub.transactions);
      }
      if (boot) {
        setStore((prev) => {
          const nextSettings = boot.config?.settings
            ? (() => {
                const merged = { ...prev.settings, ...boot.config.settings };
                const waDigits = (merged.whatsappCs || '').replace(/\D/g, '');
                if (
                  (!merged.phone?.trim() ||
                    merged.phone === '+60 11-2345 6789') &&
                  waDigits &&
                  waDigits !== '601123456789'
                ) {
                  merged.phone = `+${waDigits}`;
                }
                return merged;
              })()
            : prev.settings;

          const rawPaymentAccounts =
            Array.isArray(boot.config?.paymentAccounts) &&
            boot.config.paymentAccounts.length > 0
              ? boot.config.paymentAccounts
              : prev.paymentAccounts;

          return {
            ...prev,
            categories: Array.isArray(boot.config?.categories)
              ? boot.config.categories
              : prev.categories,
            homeSections: Array.isArray(boot.config?.homeSections)
              ? boot.config.homeSections
              : prev.homeSections,
            brands:
              Array.isArray(boot.config?.brands) &&
              boot.config.brands.length > 0
                ? boot.config.brands
                : prev.brands,
            sliders:
              Array.isArray(boot.config?.sliders) &&
              boot.config.sliders.length > 0
                ? boot.config.sliders
                : prev.sliders,
            vouchers: Array.isArray(boot.config?.vouchers)
              ? boot.config.vouchers
              : prev.vouchers,
            faqs: Array.isArray(boot.config?.faqs)
              ? boot.config.faqs
              : prev.faqs,
            paymentAccounts: rawPaymentAccounts.map((acc) =>
              resolvePaymentAccountDisplay(acc, nextSettings)
            ),
            whatsappTemplates: boot.config?.whatsappTemplates
              ? { ...prev.whatsappTemplates, ...boot.config.whatsappTemplates }
              : prev.whatsappTemplates,
            settings: nextSettings,
            gamePromo: boot.config?.gamePromo
              ? { ...DEFAULT_GAME_PROMO, ...boot.config.gamePromo }
              : prev.gamePromo,
            infoPosts:
              boot.infoPosts.length > 0 || boot.config !== null
                ? boot.infoPosts
                : prev.infoPosts,
          };
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to Firebase Auth state changes & hydrate profile/orders from PostgreSQL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setStore((prev) => ({
          ...prev,
          user: INITIAL_STORE_STATE.user,
        }));
        setMyOrders([]);
        setAdminOrders([]);
        setLookedUpOrder(null);
        return;
      }

      try {
        const { user: profile } = await fetchMyProfile();
        if (!profile) {
          throw new Error('Profil tidak sah.');
        }
        setStore((prev) => ({
          ...prev,
          user: profile,
        }));
        refreshOrdersForUser(profile.role);
      } catch {
        const email = fbUser.email || '';
        const fallbackRole: UserProfile['role'] =
          email.trim().toLowerCase() === 'siuiqbal23@gmail.com'
            ? 'admin'
            : 'customer';
        setStore((prev) => ({
          ...prev,
          user: {
            uid: fbUser.uid,
            name:
              fbUser.displayName ||
              email.split('@')[0] ||
              'Pelanggan',
            email,
            phone: '',
            loggedIn: true,
            emailVerified: fbUser.emailVerified,
            role: fallbackRole,
          },
        }));
      }
    });

    return () => unsubscribe();
  }, [refreshOrdersForUser]);

  useEffect(() => {
    applyTheme(appearance);
    try {
      localStorage.setItem('appearance', appearance);
    } catch {
      // ignore
    }
    if (appearance !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [appearance]);

  useEffect(() => {
    const handlePopState = () => {
      setPreselectedProductId(undefined);
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, options?: { productId?: string }) => {
    const target = path || '/';
    setPreselectedProductId(options?.productId);
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    setCurrentPath(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  const isAdmin =
    currentPath === '/admin' || currentPath.startsWith('/admin/');
  const brandSlugMatch = currentPath.startsWith('/brand/')
    ? decodeURIComponent(currentPath.slice('/brand/'.length).split('/')[0])
    : null;
  const txRefMatch = currentPath.startsWith('/transaction/')
    ? decodeURIComponent(
        currentPath.slice('/transaction/'.length).split('/')[0]
      )
    : null;

  const matchedBrand = useMemo(
    () =>
      brandSlugMatch
        ? store.brands.find((b) => b.slug === brandSlugMatch && b.active)
        : undefined,
    [brandSlugMatch, store.brands]
  );

  const matchedOrder = useMemo(() => {
    if (!txRefMatch) return undefined;
    const target = txRefMatch.toLowerCase();
    return (
      myOrders.find((o) => o.reference.toLowerCase() === target) ??
      adminOrders.find((o) => o.reference.toLowerCase() === target) ??
      (lookedUpOrder && lookedUpOrder.reference.toLowerCase() === target
        ? lookedUpOrder
        : undefined)
    );
  }, [txRefMatch, myOrders, adminOrders, lookedUpOrder]);

  useEffect(() => {
    if (!txRefMatch || !safeUser.loggedIn || matchedOrder) return;
    let cancelled = false;
    fetchOrderByReference(txRefMatch)
      .then((res) => {
        if (!cancelled) setLookedUpOrder(res.order);
      })
      .catch(() => {
        if (!cancelled) setLookedUpOrder(null);
      });
    return () => {
      cancelled = true;
    };
  }, [txRefMatch, safeUser.loggedIn, matchedOrder]);

  const persistStoreConfig = (next: TopupBalzStoreState) => {
    if (!auth.currentUser || (next.user ?? safeUser).role !== 'admin') return;
    const {
      categories,
      homeSections,
      brands,
      sliders,
      vouchers,
      faqs,
      paymentAccounts,
      whatsappTemplates,
      settings,
      gamePromo,
    } = next;
    saveAdminStoreConfigApi({
      categories,
      homeSections,
      brands,
      sliders,
      vouchers,
      faqs,
      paymentAccounts,
      whatsappTemplates,
      settings,
      gamePromo,
    }).catch((err) => {
      console.error('Failed to persist store configuration:', err);
    });
  };

  // Real Order Checkout (PostgreSQL + Mandatory Firebase Auth)
  const handleCreateOrder = async (
    payload: Omit<
      OrderItem,
      'id' | 'reference' | 'createdAt' | 'paymentStatus' | 'topupStatus'
    >
  ): Promise<OrderItem | null> => {
    if (!safeUser.loggedIn || !auth.currentUser) {
      setPendingReturnPath(`/brand/${payload.brandSlug}`);
      navigate('/login');
      return null;
    }

    const { order } = await createOrderApi(payload);
    setMyOrders((prev) => [order, ...prev]);
    if (store.user.role === 'admin') {
      setAdminOrders((prev) => [order, ...prev]);
    }
    setStore((prev) => {
      const promo = prev.gamePromo;
      if (!promo || !isGamePromoWithinTime(promo) || !isGamePromoLive(promo)) {
        return prev;
      }
      const items = Array.isArray(promo.items) ? promo.items : [];
      if (items.length > 0) {
        const matchIdx = items.findIndex(
          (it) =>
            it.brandId === payload.brandId && it.productId === payload.productId
        );
        if (matchIdx < 0) return prev;
        const quota = getPromoItemQuota(items[matchIdx], promo);
        if (quota.isFull) return prev;
        const nextItems = items.map((it, idx) =>
          idx === matchIdx
            ? {
                ...it,
                maxQuota: quota.maxQuota,
                claimedCount: quota.claimedCount + 1,
              }
            : it
        );
        return {
          ...prev,
          gamePromo: {
            ...promo,
            items: nextItems,
          },
        };
      }
      if (!promo.brandIds.includes(payload.brandId)) {
        return prev;
      }
      return {
        ...prev,
        gamePromo: {
          ...promo,
          claimedCount: Math.min(promo.maxQuota, promo.claimedCount + 1),
        },
      };
    });
    refreshPublicTransactions();
    return order;
  };

  const handleUploadProof = (orderReference: string, dataUrl: string) => {
    uploadOrderProofApi(orderReference, dataUrl)
      .then(({ order }) => {
        setMyOrders((prev) =>
          prev.map((o) => (o.reference === orderReference ? order : o))
        );
        setAdminOrders((prev) =>
          prev.map((o) => (o.reference === orderReference ? order : o))
        );
        setLookedUpOrder((prev) =>
          prev?.reference === orderReference ? order : prev
        );
      })
      .catch((err) => {
        console.error('Failed to save payment proof:', err);
      });
  };

  const handleUpdateOrder = (reference: string, patch: Partial<OrderItem>) => {
    setAdminOrders((prev) =>
      prev.map((o) => (o.reference === reference ? { ...o, ...patch } : o))
    );
    setMyOrders((prev) =>
      prev.map((o) => (o.reference === reference ? { ...o, ...patch } : o))
    );
    updateAdminOrderApi(reference, {
      paymentStatus: patch.paymentStatus,
      topupStatus: patch.topupStatus,
      notes: patch.notes,
    })
      .then(({ order }) => {
        setAdminOrders((prev) =>
          prev.map((o) => (o.reference === reference ? order : o))
        );
        setMyOrders((prev) =>
          prev.map((o) => (o.reference === reference ? order : o))
        );
        refreshPublicTransactions();
      })
      .catch((err) => {
        console.error('Failed to update order:', err);
      });
  };

  const handleDeleteOrder = (reference: string) => {
    setAdminOrders((prev) => prev.filter((o) => o.reference !== reference));
    setMyOrders((prev) => prev.filter((o) => o.reference !== reference));
    deleteAdminOrderApi(reference)
      .then(() => {
        refreshPublicTransactions();
      })
      .catch((err) => {
        console.error('Failed to delete order:', err);
      });
  };

  const handleSaveBrand = (brand: BrandItem) => {
    setStore((prev) => {
      const exists = prev.brands.some((b) => b.id === brand.id);
      const next: TopupBalzStoreState = {
        ...prev,
        brands: exists
          ? prev.brands.map((b) => (b.id === brand.id ? brand : b))
          : [...prev.brands, brand],
      };
      persistStoreConfig(next);
      return next;
    });
  };

  const handleDeleteBrand = (brandId: string) => {
    setStore((prev) => {
      const next: TopupBalzStoreState = {
        ...prev,
        brands: prev.brands.filter((b) => b.id !== brandId),
        homeSections: prev.homeSections.map((sec) => ({
          ...sec,
          brandIds: sec.brandIds.filter((id) => id !== brandId),
        })),
      };
      persistStoreConfig(next);
      return next;
    });
  };

  const handleUpdateCategories = (categories: CategoryItem[]) =>
    setStore((prev) => {
      const next = { ...prev, categories };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateHomeSections = (homeSections: HomeSection[]) =>
    setStore((prev) => {
      const next = { ...prev, homeSections };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateSliders = (sliders: SliderItem[]) =>
    setStore((prev) => {
      const next = { ...prev, sliders };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateVouchers = (vouchers: VoucherItem[]) =>
    setStore((prev) => {
      const next = { ...prev, vouchers };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateFaqs = (faqs: FaqItem[]) =>
    setStore((prev) => {
      const next = { ...prev, faqs };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateInfoPosts = (infoPosts: InfoPost[]) => {
    setStore((prev) => ({ ...prev, infoPosts }));
    if (auth.currentUser && safeUser.role === 'admin') {
      saveAdminInfoPostsApi(infoPosts).catch((err) => {
        console.error('Failed to persist info posts:', err);
      });
    }
  };

  const handleUpdatePaymentAccounts = (paymentAccounts: ManualPaymentAccount[]) =>
    setStore((prev) => {
      const next = { ...prev, paymentAccounts };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateWhatsappTemplates = (
    whatsappTemplates: WhatsAppTemplates
  ) =>
    setStore((prev) => {
      const next = { ...prev, whatsappTemplates };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateSettings = (settings: StoreSettings) =>
    setStore((prev) => {
      const prevAdminDigits = (
        prev.settings.whatsappCs ||
        prev.settings.phone ||
        ''
      ).replace(/\D/g, '');
      const prevLocalDigits =
        prevAdminDigits.startsWith('60') && prevAdminDigits.length >= 10
          ? `0${prevAdminDigits.slice(2)}`
          : prevAdminDigits;
      const newSource = !isPlaceholderPhoneValue(settings.whatsappCs)
        ? settings.whatsappCs
        : !isPlaceholderPhoneValue(settings.phone)
          ? settings.phone
          : '';
      const newFormatted = newSource ? formatLocalMyPhone(newSource) : '';

      const syncedPaymentAccounts = newFormatted
        ? prev.paymentAccounts.map((acc) => {
            const isPhoneChannel =
              acc.type === 'whatsapp' ||
              acc.id === 'pay-whatsapp' ||
              acc.id === 'pay-tng' ||
              acc.channelCode.toUpperCase() === 'TNG';
            if (!isPhoneChannel) return acc;
            const accDigits = (acc.accountNumber || '').replace(/\D/g, '');
            const matchesOld =
              isPlaceholderPhoneValue(acc.accountNumber) ||
              (prevLocalDigits && accDigits === prevLocalDigits) ||
              (prevAdminDigits && accDigits === prevAdminDigits);
            if (!matchesOld) return acc;
            return { ...acc, accountNumber: newFormatted };
          })
        : prev.paymentAccounts;

      const next = {
        ...prev,
        settings,
        paymentAccounts: syncedPaymentAccounts,
      };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateGamePromo = (gamePromo: GamePromoConfig) =>
    setStore((prev) => {
      const next = { ...prev, gamePromo };
      persistStoreConfig(next);
      return next;
    });

  const handleUpdateUser = async (patch: { name: string; phone: string }) => {
    const { user } = await updateMyProfile(patch);
    if (user) {
      setStore((prev) => ({ ...prev, user }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore signOut errors
    }
    setStore((prev) => ({
      ...prev,
      user: INITIAL_STORE_STATE.user,
    }));
    setMyOrders([]);
    setAdminOrders([]);
    setLookedUpOrder(null);
    navigate('/');
  };

  const handleRequireLogin = (returnTo: string) => {
    setPendingReturnPath(returnTo);
    navigate('/login');
  };

  const adminStoreView: TopupBalzStoreState = useMemo(
    () => ({
      ...store,
      user: safeUser,
      orders: adminOrders,
    }),
    [store, safeUser, adminOrders]
  );

  // Admin Dashboard Route
  if (isAdmin) {
    return (
      <AdminDashboard
        store={adminStoreView}
        onUpdateOrder={handleUpdateOrder}
        onDeleteOrder={handleDeleteOrder}
        onSaveBrand={handleSaveBrand}
        onDeleteBrand={handleDeleteBrand}
        onUpdateCategories={handleUpdateCategories}
        onUpdateHomeSections={handleUpdateHomeSections}
        onUpdateSliders={handleUpdateSliders}
        onUpdateVouchers={handleUpdateVouchers}
        onUpdateFaqs={handleUpdateFaqs}
        onUpdateInfoPosts={handleUpdateInfoPosts}
        onUpdatePaymentAccounts={handleUpdatePaymentAccounts}
        onUpdateWhatsappTemplates={handleUpdateWhatsappTemplates}
        onUpdateSettings={handleUpdateSettings}
        onUpdateGamePromo={handleUpdateGamePromo}
        onImportState={(next) => {
          const merged: TopupBalzStoreState = {
            ...next,
            user: safeUser,
            orders: adminOrders,
          };
          setStore(merged);
          persistStoreConfig(merged);
          if (Array.isArray(next.infoPosts)) {
            handleUpdateInfoPosts(next.infoPosts);
          }
        }}
        onResetState={() => {
          const resetStore: TopupBalzStoreState = {
            ...INITIAL_STORE_STATE,
            user: safeUser,
            orders: adminOrders,
          };
          setStore(resetStore);
          persistStoreConfig(resetStore);
          handleUpdateInfoPosts(INITIAL_STORE_STATE.infoPosts);
        }}
        onBackToStore={() => navigate('/')}
        onRequireAdminLogin={() => handleRequireLogin('/admin')}
      />
    );
  }

  // Auth Routes
  if (
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/forgot-password'
  ) {
    const mode =
      currentPath === '/register'
        ? 'register'
        : currentPath === '/forgot-password'
          ? 'forgot'
          : 'login';
    return (
      <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip pb-16">
        <MainHeader
          appName={store.settings.title}
          currentPath={currentPath}
          showBackButton
          appearance={appearance}
          onChangeAppearance={setAppearance}
          user={safeUser}
          onNavigate={navigate}
        />
        <AuthView
          mode={mode}
          appName={store.settings.title}
          returnPath={pendingReturnPath}
          onSuccessAuth={(nextUser) => {
            if (nextUser) {
              setStore((prev) => ({ ...prev, user: nextUser }));
              refreshOrdersForUser(nextUser.role);
            }
            setPendingReturnPath(null);
          }}
          onNavigate={navigate}
        />
        <MainFooter settings={store.settings} onNavigate={navigate} />
        <BottomNavBar currentPath={currentPath} onNavigate={navigate} />
      </div>
    );
  }

  // Maintenance Gate (for non-admin storefront)
  if (store.settings.maintenanceActive) {
    return (
      <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip pb-16">
        <MainHeader
          appName={store.settings.title}
          currentPath={currentPath}
          appearance={appearance}
          onChangeAppearance={setAppearance}
          user={safeUser}
          onNavigate={navigate}
        />
        <MaintenanceView
          settings={store.settings}
          onOpenAdmin={() => navigate('/admin')}
        />
        <MainFooter settings={store.settings} onNavigate={navigate} />
        <BottomNavBar currentPath={currentPath} onNavigate={navigate} />
      </div>
    );
  }

  const showBackButton = Boolean(
    brandSlugMatch || txRefMatch || currentPath === '/settings'
  );

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip pb-16">
      <MainHeader
        appName={store.settings.title}
        currentPath={currentPath}
        showBackButton={showBackButton}
        appearance={appearance}
        onChangeAppearance={setAppearance}
        user={safeUser}
        onNavigate={navigate}
      />

      {brandSlugMatch ? (
        matchedBrand ? (
          <BrandDetailView
            brand={matchedBrand}
            store={{ ...store, user: safeUser }}
            initialProductId={preselectedProductId}
            onCreateOrder={handleCreateOrder}
            onOrderCreated={(ref) => navigate(`/transaction/${ref}`)}
            onRequireLogin={() =>
              handleRequireLogin(`/brand/${matchedBrand.slug}`)
            }
          />
        ) : (
          <main className="mx-auto max-w-3xl flex-1 px-4 py-12 text-center space-y-3">
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Game Tidak Ditemui
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Produk yang anda cari tidak wujud atau telah dinyahaktifkan.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-orange-600 text-xs font-semibold text-white cursor-pointer"
            >
              Kembali ke Home
            </button>
          </main>
        )
      ) : txRefMatch ? (
        matchedOrder ? (
          <TransactionShowView
            order={matchedOrder}
            store={{ ...store, user: safeUser }}
            onUploadProof={handleUploadProof}
          />
        ) : (
          <main className="mx-auto max-w-3xl flex-1 px-4 py-12 text-center space-y-3">
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Invois Tidak Ditemui
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {safeUser.loggedIn
                ? `Nombor rujukan ${txRefMatch} tidak ditemui dalam rekod akaun anda.`
                : 'Sila log masuk untuk melihat butiran invois pesanan anda.'}
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(safeUser.loggedIn ? '/profile' : '/login')
              }
              className="px-4 py-2 rounded-lg bg-orange-600 text-xs font-semibold text-white cursor-pointer"
            >
              {safeUser.loggedIn ? 'Semak di Profil' : 'Log Masuk Sekarang'}
            </button>
          </main>
        )
      ) : currentPath === '/transaction' ? (
        <TransactionCheckView
          transactions={publicTransactions}
          onGoToProfile={() => navigate('/profile')}
        />
      ) : currentPath === '/info' ? (
        <InfoView posts={store.infoPosts} />
      ) : currentPath === '/profile' || currentPath === '/settings' ? (
        <ProfileView
          user={safeUser}
          orders={myOrders}
          initialTab={currentPath === '/settings' ? 'settings' : 'transactions'}
          appearance={appearance}
          onChangeAppearance={setAppearance}
          onUpdateUser={handleUpdateUser}
          onViewOrder={(ref) => navigate(`/transaction/${ref}`)}
          onNavigateAuth={(mode) => navigate(`/${mode}`)}
          onOpenAdmin={() => navigate('/admin')}
          onLogout={handleLogout}
        />
      ) : currentPath === '/terms' ? (
        <StaticContentPage
          title="Syarat & Ketentuan"
          body={store.settings.termsText}
        />
      ) : currentPath === '/privacy-policy' ? (
        <StaticContentPage
          title="Kebijakan Privasi"
          body={store.settings.privacyPolicyText}
        />
      ) : (
        <HomeView
          store={{ ...store, user: safeUser }}
          onSelectBrand={(slug, productId) =>
            navigate(`/brand/${slug}`, { productId })
          }
        />
      )}

      <MainFooter settings={store.settings} onNavigate={navigate} />
      <BottomNavBar currentPath={currentPath} onNavigate={navigate} />
    </div>
  );
}
