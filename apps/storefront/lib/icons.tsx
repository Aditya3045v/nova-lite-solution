import {
  BadgeCheck, BatteryCharging, Building2, Factory, Leaf, Lightbulb, MessagesSquare, PackageCheck, ShieldCheck, Sparkles, Store, Sun, Truck, Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  store: Store,
  building: Building2,
  'battery-charging': BatteryCharging,
  battery: BatteryCharging,
  'shield-check': ShieldCheck,
  shield: ShieldCheck,
  'messages-square': MessagesSquare,
  leaf: Leaf,
  badge: BadgeCheck,
  sun: Sun,
  zap: Zap,
  truck: Truck,
  factory: Factory,
  sparkles: Sparkles,
  package: PackageCheck,
};

export function iconFor(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Lightbulb;
}
