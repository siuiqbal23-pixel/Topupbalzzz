import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  formatMyr,
  getPromoItemQuota,
  isGamePromoWithinTime,
} from '../data/initialStoreData';
import { useDeviceMode } from '../hooks/useDeviceMode';
import type { BrandItem, ProductItem, TopupBalzStoreState } from '../types/store';
import { BrandCard } from './BrandCard';
import { GameImage } from './GameImage';
import { HeroBanner } from './HeroBanner';

interface HomeViewProps {
  store: TopupBalzStoreState;
  onSelectBrand: (slug: string, productId?: string) => void;
}

function formatCountdownParts(remainingMs: number) {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return { days, hours, mins, secs };
}

export function HomeView({ store, onSelectBrand }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { isMobile } = useDeviceMode();

  const gamePromo = store.gamePromo;

  useEffect(() => {
    if (!gamePromo?.active) return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gamePromo?.active, gamePromo?.endAt]);

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

  const promoCards = useMemo(() => {
    if (!gamePromo) return [];
    const items = Array.isArray(gamePromo.items) ? gamePromo.items : [];
    const cards: Array<{
      brand: BrandItem;
      product: ProductItem;
      promoPrice: number;
      maxQuota: number;
      claimedCount: number;
      remainingQuota: number;
      isFull: boolean;
    }> = [];

    if (items.length > 0) {
      for (const it of items) {
        const brand = activeBrandsMap.get(it.brandId);
        if (!brand) continue;
        const product = brand.products.find(
          (p) => p.id === it.productId && p.active
        );
        if (!product) continue;
        const quota = getPromoItemQuota(it, gamePromo);
        cards.push({
          brand,
          product,
          promoPrice: Math.max(0, Number(it.promoPrice)),
          ...quota,
        });
      }
      return cards;
    }

    // Fallback if only legacy brandIds + discountPercent configured
    const pct = Math.max(0, Math.min(90, Number(gamePromo.discountPercent || 0)));
    for (const id of gamePromo.brandIds ?? []) {
      const brand = activeBrandsMap.get(id);
      if (!brand) continue;
      const product = brand.products.find((p) => p.active);
      if (!product) continue;
      const quota = getPromoItemQuota({}, gamePromo);
      cards.push({
        brand,
        product,
        promoPrice:
          pct > 0
            ? Math.round(product.sellPrice * (1 - pct / 100) * 100) / 100
            : product.sellPrice,
        ...quota,
      });
    }
    return cards;
  }, [gamePromo, activeBrandsMap]);

  const showGamePromo =
    isGamePromoWithinTime(gamePromo, nowMs) && promoCards.length > 0;

  const promoEndMs = gamePromo?.endAt ? new Date(gamePromo.endAt).getTime() : 0;
  const remainingMs = Math.max(0, promoEndMs - nowMs);
  const countdown = formatCountdownParts(remainingMs);

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

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const timerBoxClass =
    'inline-flex h-7 min-w-[28px] items-center justify-center rounded-md bg-orange-600 px-1.5 font-mono-tabular text-xs font-bold text-white shadow-sm';

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-4 sm:py-6 space-y-6">
        {/* Hero Carousel Banner */}
        <HeroBanner
          slides={store.sliders}
          onSelectBrandSlug={(slug) => onSelectBrand(slug)}
        />

        {/* Minimal Horizontal Swipeable Promosi Game Below Banner */}
        {showGamePromo && gamePromo ? (
          <section aria-label="Promosi Game" className="space-y-3">
            <div className="flex items-center gap-1" aria-label="Masa promosi">
              {countdown.days > 0 ? (
                <>
                  <span className={timerBoxClass}>{pad2(countdown.days)}h</span>
                  <span className="font-mono-tabular text-xs font-bold text-orange-500">
                    :
                  </span>
                </>
              ) : null}
              <span className={timerBoxClass}>{pad2(countdown.hours)}</span>
              <span className="font-mono-tabular text-xs font-bold text-orange-500">
                :
              </span>
              <span className={timerBoxClass}>{pad2(countdown.mins)}</span>
              <span className="font-mono-tabular text-xs font-bold text-orange-500">
                :
              </span>
              <span className={timerBoxClass}>{pad2(countdown.secs)}</span>
            </div>

            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]">
              {promoCards.map(
                ({
                  brand,
                  product,
                  promoPrice,
                  maxQuota,
                  remainingQuota,
                  isFull,
                }) => (
                  <button
                    key={`promo-${brand.id}-${product.id}`}
                    type="button"
                    onClick={() => onSelectBrand(brand.slug, product.id)}
                    className="group w-[144px] sm:w-[164px] shrink-0 snap-start rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] overflow-hidden text-left shadow-sm transition-all hover:border-orange-500/70 cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-[#0D1017]">
                      <GameImage
                        src={brand.image}
                        alt={brand.name}
                        title={brand.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {isFull ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[11px] font-bold uppercase tracking-wider text-white">
                          Habis
                        </span>
                      ) : null}
                    </div>

                    <div className="p-2.5 space-y-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {brand.name}
                      </p>
                      <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                        <span className="text-xs sm:text-sm font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
                          {formatMyr(promoPrice)}
                        </span>
                        {product.sellPrice > promoPrice ? (
                          <span className="text-[10px] font-mono-tabular text-slate-400 line-through">
                            {formatMyr(product.sellPrice)}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`text-[10px] font-mono-tabular font-semibold ${
                          isFull
                            ? 'text-rose-500'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isFull
                          ? `Habis (${maxQuota}/${maxQuota})`
                          : `Baki ${remainingQuota}/${maxQuota} org`}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
          </section>
        ) : null}

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
