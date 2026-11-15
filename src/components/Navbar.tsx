import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  storeName: string;
  onNavigateHomeSection: (sectionId?: string) => void;
  onOpenAdmin: () => void;
}

export function Navbar({
  storeName,
  onNavigateHomeSection,
  onOpenAdmin,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSectionClick = (sectionId?: string) => {
    setMobileOpen(false);
    onNavigateHomeSection(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0B0D12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleSectionClick();
          }}
          className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md px-1"
        >
          {storeName}
        </a>

        {/* Zone 2: 4 Clean Single-Line Nav Links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <a
            href="#katalog"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('katalog');
            }}
            className="hover:text-white hover:underline underline-offset-4 decoration-orange-500 transition-colors whitespace-nowrap shrink-0"
          >
            Katalog
          </a>
          <a
            href="#topup-pantas"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('topup-pantas');
            }}
            className="hover:text-white hover:underline underline-offset-4 decoration-orange-500 transition-colors whitespace-nowrap shrink-0"
          >
            Topup Pantas
          </a>
          <a
            href="#ranking"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('ranking');
            }}
            className="hover:text-white hover:underline underline-offset-4 decoration-orange-500 transition-colors whitespace-nowrap shrink-0"
          >
            Ranking
          </a>
          <a
            href="#semak-pesanan"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('semak-pesanan');
            }}
            className="hover:text-white hover:underline underline-offset-4 decoration-orange-500 transition-colors whitespace-nowrap shrink-0"
          >
            Semak Pesanan
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Panel Admin
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileOpen ? (
        <div className="md:hidden border-t border-white/[0.07] bg-[#0F131B] px-4 py-3 space-y-1">
          <a
            href="#katalog"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('katalog');
            }}
            className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
          >
            Katalog Game
          </a>
          <a
            href="#topup-pantas"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('topup-pantas');
            }}
            className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
          >
            Topup Pantas
          </a>
          <a
            href="#ranking"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('ranking');
            }}
            className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
          >
            Ranking Topup
          </a>
          <a
            href="#semak-pesanan"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('semak-pesanan');
            }}
            className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
          >
            Semak Pesanan
          </a>
        </div>
      ) : null}
    </header>
  );
}
