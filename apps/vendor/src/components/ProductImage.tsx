import { useState } from 'react';
import { mediaUrl, PLACEHOLDER_IMAGE } from '@novalite/shared';
import { cn } from '@novalite/ui';

/** Product art on a soft tile; falls back to the placeholder if the file is missing. */
export function ProductImage({
  src, alt, className, imgClassName, eager,
}: { src: string | null | undefined; alt: string; className?: string; imgClassName?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-ink-50 to-ink-100/70', className)}>
      <img
        src={failed ? PLACEHOLDER_IMAGE : mediaUrl(src)}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-contain', imgClassName)}
      />
    </div>
  );
}
