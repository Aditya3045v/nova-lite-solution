import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { Card, EmptyState, buttonClasses } from '@novalite/ui';
import { useTitle } from '@/hooks/useTitle';

export function NotFoundPage() {
  useTitle('Page not found');
  return (
    <Card className="mx-auto max-w-xl">
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="We couldn't find that page"
        description="The link may be old or mistyped. Head back home or browse the catalogue."
        action={
          <>
            <Link to="/" className={buttonClasses('primary', 'md')}>Go home</Link>
            <Link to="/products" className={buttonClasses('outline', 'md')}>Browse products</Link>
          </>
        }
      />
    </Card>
  );
}
