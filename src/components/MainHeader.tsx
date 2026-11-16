import { useState } from 'react';
import {
  ArrowLeft,
  Laptop,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Smartphone,
  Sun,
} from 'lucide-react';
import { useDeviceMode } from '../hooks/useDeviceMode';
import type { AppearanceMode, UserProfile } from '../types/store';

interface MainHeaderProps {
  appName: string;
  currentPath: string;
  showBackButton?: boolean;
  appearance: AppearanceMode;
  onChangeAppearance: (mode: AppearanceMode) => void;
  user: UserProfile;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function MainHeader({
  appName,
  currentPath,
  showBackButton = false,
  appearance,
  onChangeAppearance,
  user,
  onNavigate,
  onLogout,
}: MainHeaderProps) {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { isMobile } = useDeviceMode();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Transaksi', path: '/transaction' },
    { label: 'Informasi', path: '/info' },
    { label: 'Profil', path: '/profile' },
    { label: 'Admin', path: '/admin' },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
  };

  return (
    <header className="relative md:sticky md:top-0 z-40 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0E1117]/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-3 sm:px-5 h-12 md:h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark + subtle device indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            {appName}
          </a>
          <span
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0"
            title={isMobile ? 'Mod Telefon Pintar' : 'Mod Komputer'}
          >
            {isMobile ? (
              <>
                <Smartphone className="w-3 h-3 text-orange-500" aria-hidden="true" />
                <span>Telefon</span>
              </>
            ) : (
              <>
                <Laptop className="w-3 h-3 text-orange-500" aria-hidden="true" />
                <span>Komputer</span>
              </>
            )}
          </span>
        </div>

        {/* Zone 2: Clean single-line desktop navigation links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-5 text-xs font-medium"
        >
          {navItems.map((item) => {
            const active =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.path);
                }}
                className={`whitespace-nowrap shrink-0 transition-colors underline-offset-4 hover:underline ${
                  active
                    ? 'text-orange-600 dark:text-orange-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Theme Switcher + Compact Primary Action / Back */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme Switcher */}
          <div className="relative">
            <button
              type="button"
              aria-label="Tukar tema paparan"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {appearance === 'light' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : appearance === 'dark' ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Monitor className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {themeMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setThemeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-32 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161B24] shadow-lg py-1 z-50">
                  {(
                    [
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onChangeAppearance(opt.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                          appearance === opt.id
                            ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>

          {showBackButton ? (
            <button
              type="button"
              onClick={() => handleNav('/')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161B24] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kembali</span>
            </button>
          ) : user.loggedIn ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161B24] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Log Keluar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav('/login')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
