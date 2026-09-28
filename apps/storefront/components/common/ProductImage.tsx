import Image from 'next/image';
import { mediaUrl } from '@novalite/shared';
import { cn } from '@/lib/cn';

/** next/image for uploaded photos (responsive, AVIF/WebP); SVG art is served as-is. */
export function ProductImage({
  src, alt, sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw', priority, className,
}: { src: string | null | undefined; alt: string; sizes?: string; priority?: boolean; className?: string }) {
  const url = mediaUrl(src);
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={url.endsWith('.svg')}
      className={cn('object-contain', className)}
    />
  );
}
