import { useState } from 'react';
import { Home, Info, Receipt, User, X } from 'lucide-react';
import { useDeviceMode } from '../hooks/useDeviceMode';

interface BottomNavBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

function NineDotsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  );
}

export function BottomNavBar({ currentPath, onNavigate }: BottomNavBarProps) {
  const [nineDotsOpen, setNineDotsOpen] = useState(false);
  const { isMobile } = useDeviceMode();

  const isHome = currentPath === '/' || currentPath.startsWith('/brand/');
  const isTx =
    currentPath === '/transaction' || currentPath.startsWith('/transaction/');
  const isInfo = currentPath === '/info';
  const isProfile =
    currentPath === '/profile' ||
    currentPath === '/settings' ||
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/forgot-password';

  const handleSelectRoute = (path: string) => {
    setNineDotsOpen(false);
    onNavigate(path);
  };

  return (
    <>
      {/* 9-Dot Menu Drawer / Modal (intentionally empty inside for future shortcuts) */}
      {nineDotsOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu Pintasan"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
        >
          <div
            className="fixed inset-0"
            onClick={() => setNineDotsOpen(false)}
          />
          <div
            className={`relative z-10 w-full ${
              isMobile ? 'rounded-t-2xl pb-8' : 'max-w-md rounded-2xl'
            } border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] shadow-2xl overflow-hidden`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <NineDotsIcon className="w-4 h-4 text-orange-500" />
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Menu Pintasan
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setNineDotsOpen(false)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Empty container ready for future shortcut bars */}
            <div className="min-h-[180px] p-6 flex items-center justify-center text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Ruang pintasan tambahan — masih kosong buat masa ini.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Fixed 5-Tab Bottom Bar */}
      <nav
        aria-label="Bar navigasi bawah"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0E1117]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-4xl grid grid-cols-5 h-14">
          {/* Bar 1: Home */}
          <button
            type="button"
            onClick={() => handleSelectRoute('/')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer min-h-[44px] ${
              isHome && !nineDotsOpen
                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </button>

          {/* Bar 2: Transaksi */}
          <button
            type="button"
            onClick={() => handleSelectRoute('/transaction')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer min-h-[44px] ${
              isTx && !nineDotsOpen
                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" aria-hidden="true" />
            <span>Transaksi</span>
          </button>

          {/* Bar 3: Titik 9 */}
          <button
            type="button"
            onClick={() => setNineDotsOpen((prev) => !prev)}
            aria-expanded={nineDotsOpen}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer min-h-[44px] ${
              nineDotsOpen
                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <NineDotsIcon className="w-4 h-4" />
            <span>Menu</span>
          </button>

          {/* Bar 4: Informasi */}
          <button
            type="button"
            onClick={() => handleSelectRoute('/info')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer min-h-[44px] ${
              isInfo && !nineDotsOpen
                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" aria-hidden="true" />
            <span>Informasi</span>
          </button>

          {/* Bar 5: Profil */}
          <button
            type="button"
            onClick={() => handleSelectRoute('/profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer min-h-[44px] ${
              isProfile && !nineDotsOpen
                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" aria-hidden="true" />
            <span>Profil</span>
          </button>
        </div>
      </nav>
    </>
  );
}
