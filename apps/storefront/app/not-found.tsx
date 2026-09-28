import Link from 'next/link';
import { btn } from '@/components/common/Button';

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink-950">This page switched off</h1>
      <p className="mt-2 max-w-md text-ink-500">The page you are looking for does not exist or has moved. Try our catalogue or head back home.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={btn('dark')}>Go home</Link>
        <Link href="/products" className={btn('outline')}>Browse products</Link>
      </div>
    </div>
  );
}
