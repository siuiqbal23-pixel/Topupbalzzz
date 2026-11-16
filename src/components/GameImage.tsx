import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';

interface GameImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function GameImage({
  src,
  alt,
  title,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: GameImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-200 via-slate-100 to-orange-100/60 dark:from-[#1B2230] dark:via-[#141923] dark:to-[#24160E] text-slate-600 dark:text-slate-300 p-4 text-center"
        aria-label={alt}
      >
        <Gamepad2 className="w-8 h-8 text-orange-500" aria-hidden="true" />
        {title ? (
          <span className="text-xs font-semibold tracking-tight line-clamp-2">
            {title}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
