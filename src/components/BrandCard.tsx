import type { BrandItem } from '../types/store';
import { GameImage } from './GameImage';

interface BrandCardProps {
  brand: BrandItem;
  onSelect: (slug: string) => void;
  promoTag?: string;
}

export function BrandCard({ brand, onSelect, promoTag }: BrandCardProps) {
  return (
    <button
      type="button"
      aria-label={brand.name}
      title={brand.name}
      onClick={() => onSelect(brand.slug)}
      className="group w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#141923] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/70 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-[#0D1017]">
        <GameImage
          src={brand.image}
          alt={brand.name}
          title={brand.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {promoTag ? (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-orange-600/95 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
            {promoTag}
          </span>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </button>
  );
}
