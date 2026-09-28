export function Logo({ light = false, className = 'h-7' }: { light?: boolean; className?: string }) {
  return <img src={light ? '/brand/logo-light.svg' : '/brand/logo.svg'} alt="Novalite" className={className} />;
}
