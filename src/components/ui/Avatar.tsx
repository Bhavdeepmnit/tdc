import { useState } from 'react';
import { getInitials } from '@utils/format';
import { cn } from '@utils/cn';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'h-9 w-9 text-body-sm',
  md: 'h-12 w-12 text-body',
  lg: 'h-16 w-16 text-h4',
  xl: 'h-24 w-24 text-h2',
} as const;

/** Pixel dimensions per size — set on the <img> so the box is reserved before load. */
const PX = { sm: 36, md: 48, lg: 64, xl: 96 } as const;

/**
 * Circular avatar. Renders the image when `src` is provided and loads cleanly,
 * otherwise falls back to the person's initials on a brand-tinted background.
 */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-brand-50 font-display font-semibold text-brand-600',
        SIZES[size],
        className,
      )}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          width={PX[size]}
          height={PX[size]}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
          decoding="async"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
