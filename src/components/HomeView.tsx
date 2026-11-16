import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDeviceMode } from '../hooks/useDeviceMode';
import type { BrandItem, TopupBalzStoreState } from '../types/store';
import { BrandCard } from './BrandCard';
import { HeroBanner } from './HeroBanner';

interface HomeViewProps {
  store: TopupBalzStoreState;
  onSelectBrand: (slug: string) => void;
}

export function HomeView({ store, onSelectBrand }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { isMobile } = useDeviceMode();

  const activeBrands = useMemo(
    () => store.brands.filter((b) => b.active),
    [store.brands]
  );

  const activeBrandsMap = useMemo(() => {
    const map = new Map<string, BrandItem>();
    for (const b of activeBrands) {
      map.set(b.id, b);
    }
    return map;
  }, [activeBrands]);

  const activeSections = useMemo(
    () =>
      (store.homeSections ?? [])
        .filter((sec) => sec.active)
        .map((sec) => ({
          ...sec,
          brands: sec.brandIds
            .map((id) => activeBrandsMap.get(id))
            .filter((b): b is BrandItem => Boolean(b)),
        }))
        .filter((sec) => sec.brands.length > 0),
    [store.homeSections, activeBrandsMap]
  );

  const searchedBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return activeBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        b.currencyUnit.toLowerCase().includes(q)
    );
  }, [activeBrands, searchQuery]);

  const gridClass = isMobile
    ? 'grid grid-cols-3 gap-2.5'
    : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5';

  return (
    <div className="flex-1">
      {/* Slim Dismissible Promo Bar */}
      {store.settings.promoBannerEnabled && !bannerDismissed ? (
        <div className="border-b border-slate-200 dark:border-white/[0.06] bg-orange-50 dark:bg-[#151923] px-3 py-1.5 text-[11px] text-slate-800 dark:text-slate-200">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
            <p className="truncate font-medium">
              <span className="font-semibold text-orange-600 dark:text-orange-400 mr-1.5">
                Promosi
              </span>
              {store.settings.promoBannerText}
            </p>
            <button
              type="button"
              aria-label="Tutup banner promosi"
              onClick={() => setBannerDismissed(true)}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-4 sm:py-6 space-y-6">
        {/* Hero Carousel Banner */}
        <HeroBanner
          slides={store.sliders}
          onSelectBrandSlug={(slug) => onSelectBrand(slug)}
        />

        {/* Game Search Bar */}
        <div className="flex justify-end">
          <div className="relative w-full sm:w-72">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama game..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141923] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Search Results OR Admin-Ordered Sections */}
        {searchQuery.trim() ? (
          <section aria-labelledby="heading-search" className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="heading-search"
                className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                Hasil Carian
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {searchedBrands.length} game
              </span>
            </div>

            {searchedBrands.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] p-6 text-center space-y-2.5">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Tiada game ditemui untuk carian anda.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Tunjuk Semua Game
                </button>
              </div>
            ) : (
              <div className={gridClass}>
                {searchedBrands.map((brand) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    onSelect={onSelectBrand}
                  />
                ))}
              </div>
            )}
          </section>
        ) : activeSections.length > 0 ? (
          activeSections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`heading-${section.id}`}
              className="space-y-2.5"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    id={`heading-${section.id}`}
                    className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                  >
                    {section.title}
                  </h2>
                  {section.subtitle ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  {section.brands.length} game
                </span>
              </div>
              <div className={gridClass}>
                {section.brands.map((brand) => (
                  <BrandCard
                    key={`${section.id}-${brand.id}`}
                    brand={brand}
                    onSelect={onSelectBrand}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Senarai Game
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {activeBrands.length} game
              </span>
            </div>
            <div className={gridClass}>
              {activeBrands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  onSelect={onSelectBrand}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
