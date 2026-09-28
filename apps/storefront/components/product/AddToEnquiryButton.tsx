'use client';

import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useEnquiryList, type EnquiryItem } from '../common/EnquiryList';

export function AddToEnquiryButton({ item, className, compact }: { item: EnquiryItem; className?: string; compact?: boolean }) {
  const { add, items } = useEnquiryList();
  const [flash, setFlash] = useState(false);
  const inList = items.some((i) => i.productId === item.productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        add(item);
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      }}
      aria-label={`Add ${item.name} to enquiry list`}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition',
        compact ? 'h-9 w-9' : 'h-10 px-4 text-sm',
        flash || inList ? 'bg-emerald-600 text-white' : 'bg-ink-950 text-white hover:bg-brand-500',
        className,
      )}
    >
      {flash || inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {!compact && (inList ? 'Added' : 'Add')}
    </button>
  );
}
