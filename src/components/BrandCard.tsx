import { formatMyr } from '../data/initialStoreData';
import type { BrandItem } from '../types/store';
import { GameImage } from './GameImage';

interface BrandCardProps {
  brand: BrandItem;
  onSelect: (slug: string) => void;
}

export function BrandCard({ brand, onSelect }: BrandCardProps) {
  const activePrices = brand.products
    .filter((p) => p.active)
    .map((p) => p.sellPrice);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(brand.slug)}
      className="group w-full text-left overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141923] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/70 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-[#0D1017]">
        <GameImage
          src={brand.image}
          alt={brand.name}
          title={brand.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      <div className="p-2 sm:p-2.5">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
          {brand.publisher}
        </p>
        <h3 className="mt-0.5 font-display text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
          {brand.name}
        </h3>
        <p className="mt-1 text-[11px] font-mono-tabular font-semibold text-orange-600 dark:text-orange-400">
          {minPrice > 0 ? `${formatMyr(minPrice)}` : 'Lihat Pakej'}
        </p>
      </div>
    </button>
  );
}
