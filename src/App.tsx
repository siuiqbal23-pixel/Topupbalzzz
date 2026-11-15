import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { Navbar } from './components/Navbar';
import { StorefrontView } from './components/StorefrontView';
import {
  loadStoreState,
  resetStoreState,
  saveStoreState,
} from './data/initialStoreData';
import type {
  GameItem,
  LeaderboardEntry,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  StoreSettings,
  TopupBalzStoreState,
} from './types/store';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function App() {
  const [store, setStore] = useState<TopupBalzStoreState>(() => loadStoreState());
  const [route, setRoute] = useState<'store' | 'admin'>(() =>
    typeof window !== 'undefined' && isAdminPath(window.location.pathname)
      ? 'admin'
      : 'store'
  );

  useEffect(() => {
    saveStoreState(store);
  }, [store]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(isAdminPath(window.location.pathname) ? 'admin' : 'store');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (target: 'store' | 'admin', sectionId?: string) => {
    const nextPath = target === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setRoute(target);

    if (target === 'store') {
      requestAnimationFrame(() => {
        if (sectionId) {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } else {
      window.scrollTo({ top: 0 });
    }
  };

  const handleCreateOrder = (
    payload: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>
  ): OrderRecord => {
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const created: OrderRecord = {
      ...payload,
      id: `TBZ-${yymmdd}-${suffix}`,
      createdAt: now.toISOString(),
      status: 'Menunggu Bayaran',
    };

    setStore((prev) => ({
      ...prev,
      orders: [created, ...prev.orders],
    }));

    return created;
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    notes?: string
  ) => {
    setStore((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status, notes: notes ?? o.notes } : o
      ),
    }));
  };

  const handleDeleteOrder = (orderId: string) => {
    setStore((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== orderId),
    }));
  };

  const handleSaveGame = (game: GameItem) => {
    setStore((prev) => {
      const exists = prev.games.some((g) => g.id === game.id);
      return {
        ...prev,
        games: exists
          ? prev.games.map((g) => (g.id === game.id ? game : g))
          : [...prev.games, game],
      };
    });
  };

  const handleDeleteGame = (gameId: string) => {
    setStore((prev) => ({
      ...prev,
      games: prev.games.filter((g) => g.id !== gameId),
    }));
  };

  const handleUpdatePaymentMethods = (paymentMethods: PaymentMethod[]) => {
    setStore((prev) => ({ ...prev, paymentMethods }));
  };

  const handleUpdateLeaderboard = (
    leaderboardBonusEntries: LeaderboardEntry[]
  ) => {
    setStore((prev) => ({ ...prev, leaderboardBonusEntries }));
  };

  const handleUpdateSettings = (settings: StoreSettings) => {
    setStore((prev) => ({ ...prev, settings }));
  };

  if (route === 'admin') {
    return (
      <AdminDashboard
        store={store}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        onSaveGame={handleSaveGame}
        onDeleteGame={handleDeleteGame}
        onUpdatePaymentMethods={handleUpdatePaymentMethods}
        onUpdateLeaderboard={handleUpdateLeaderboard}
        onUpdateSettings={handleUpdateSettings}
        onImportState={(nextState) => setStore(nextState)}
        onResetState={() => setStore(resetStoreState())}
        onBackToStore={() => navigateTo('store')}
      />
    );
  }

  return (
    <>
      <Navbar
        storeName={store.settings.storeName}
        onNavigateHomeSection={(sectionId) => navigateTo('store', sectionId)}
        onOpenAdmin={() => navigateTo('admin')}
      />
      <StorefrontView
        store={store}
        onCreateOrder={handleCreateOrder}
        onOpenAdmin={() => navigateTo('admin')}
      />
    </>
  );
}
