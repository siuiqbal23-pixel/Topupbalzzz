interface BrandWordmarkProps {
  appName: string;
  compact?: boolean;
}

export const OFFICIAL_LOGO_URL =
  '/assets/aistudio/IMG-20260919-WA0003_d97bab37.jpg';

export function LightningBMark({ className = 'h-[1.05em] w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`inline-block align-[-0.14em] ${className}`}
      fill="#F97316"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31 8H65C83 8 88 23 82 37C79 44 73 48 67 50C83 53 90 66 85 80C81 89 72 91 59 91H26L37 77H58C67 77 72 72 72 66C72 59 67 55 57 55H52L57 48L13 94L24 60H8L31 8ZM41 22H58C66 22 68 28 66 35C64 40 60 42 53 42H32L41 22Z"
      />
    </svg>
  );
}

export function BrandWordmark({ appName, compact = false }: BrandWordmarkProps) {
  const cleanName = appName.trim() || 'TopupBalz';
  const balzIndex = cleanName.toLowerCase().indexOf('balz');

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <img
        src={OFFICIAL_LOGO_URL}
        alt={`${cleanName} logo rasmi`}
        className={`${
          compact ? 'h-6 w-6' : 'h-7 w-7 sm:h-8 sm:w-8'
        } rounded-lg object-cover bg-black border border-orange-500/40 shrink-0 shadow-sm`}
      />
      <span
        className={`font-display ${
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
        } font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap inline-flex items-baseline`}
      >
        {balzIndex >= 0 ? (
          <>
            <span>{cleanName.slice(0, balzIndex)}</span>
            <span className="inline-flex items-center mx-[0.5px]">
              <LightningBMark className="h-[1.08em] w-[1.02em] -mr-[1px]" />
            </span>
            <span>{cleanName.slice(balzIndex + 1)}</span>
          </>
        ) : (
          cleanName
        )}
      </span>
    </span>
  );
}
