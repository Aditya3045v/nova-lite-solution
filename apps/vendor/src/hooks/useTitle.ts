import { useEffect } from 'react';

export function useTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Novalite Vendor` : 'Novalite Vendor Portal';
  }, [title]);
}
