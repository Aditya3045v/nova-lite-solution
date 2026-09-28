import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { friendlyError, mediaUrl } from '@novalite/shared';
import { Button, cn, toast } from '@novalite/ui';
import { uploadImage, type MediaBucket } from '@/lib/storage';

/** Single image field (category art, banners, portfolio). Stores the public URL. */
export function ImageField({
  value, onChange, bucket = 'site-media', folder, label = 'Image', aspect = 'aspect-[4/3]', className,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  bucket?: MediaBucket;
  folder: string;
  label?: string;
  aspect?: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(bucket, folder, file);
      onChange(url);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm font-medium text-ink-800">{label}</p>
      <div
        className={cn('group relative overflow-hidden rounded-2xl border border-dashed border-ink-200 bg-ink-50', aspect)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <img src={mediaUrl(value)} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-ink-500 hover:text-brand-600">
            <ImagePlus className="h-6 w-6" />
            Click or drop an image
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        )}
        {value && !busy && (
          <div className="absolute right-2 bottom-2 flex gap-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <Button size="xs" variant="outline" onClick={() => input.current?.click()}>Replace</Button>
            <Button size="xs" variant="outline" aria-label="Remove image" onClick={() => onChange(null)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
