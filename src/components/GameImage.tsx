import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';

interface GameImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  fallbackClassName?: string;
}

export function GameImage({
  src,
  alt,
  title,
  className = 'w-full h-full object-cover',
  fallbackClassName = '',
}: GameImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#171C28] via-[#12161F] to-[#0E1118] text-slate-300 p-4 text-center ${fallbackClassName}`}
      >
        <Gamepad2 className="w-8 h-8 text-orange-500" aria-hidden="true" />
        {title ? (
          <span className="text-xs font-semibold tracking-wide text-slate-200 line-clamp-1">
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
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
