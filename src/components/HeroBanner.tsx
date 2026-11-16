import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeviceMode } from '../hooks/useDeviceMode';
import type { SliderItem } from '../types/store';
import { GameImage } from './GameImage';

interface HeroBannerProps {
  slides: SliderItem[];
  onSelectBrandSlug: (slug: string) => void;
}

export function HeroBanner({ slides, onSelectBrandSlug }: HeroBannerProps) {
  const activeSlides = slides.filter((s) => s.active);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const { isMobile } = useDeviceMode();

  useEffect(() => {
    if (paused || activeSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, activeSlides.length]);

  if (activeSlides.length === 0) return null;

  const safeIndex = currentSlide % activeSlides.length;

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-900 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`relative w-full ${
          isMobile
            ? 'h-40 sm:h-48'
            : 'aspect-[3.4/1] max-h-[250px]'
        }`}
      >
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === safeIndex
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <GameImage
              src={slide.image}
              alt={slide.title}
              title={slide.title}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-3.5 sm:p-7 max-w-xl">
              <h1 className="font-display text-base sm:text-2xl font-bold text-white leading-tight text-balance">
                {slide.title}
              </h1>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-200 line-clamp-2 max-w-md">
                {slide.subtitle}
              </p>
              {slide.targetBrandSlug ? (
                <div className="mt-2.5 sm:mt-3">
                  <button
                    type="button"
                    onClick={() => onSelectBrandSlug(slide.targetBrandSlug!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-[11px] sm:text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>{slide.ctaLabel || 'Topup Sekarang'}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {activeSlides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Slaid sebelumnya"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/15 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Slaid seterusnya"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/15 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Pergi ke slaid ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  index === safeIndex
                    ? 'w-5 bg-orange-500'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
