import * as Dialog from '@radix-ui/react-dialog';
import * as DM from '@radix-ui/react-dropdown-menu';
import * as RTabs from '@radix-ui/react-tabs';
import { X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '../cn';
import { Button } from './button';

export function Modal({
  open, onOpenChange, title, description, children, footer, size = 'md', className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-float outline-none data-[state=open]:animate-slide-up sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl',
            w,
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-lg font-semibold text-ink-950">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-ink-500">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-6 py-4 safe-bottom">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Drawer({
  open, onOpenChange, title, description, children, footer, side = 'right', className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-float outline-none data-[state=open]:animate-fade-in',
            side === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-lg font-semibold text-ink-950">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-ink-500">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === 'string' ? title : 'Panel'}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-6 py-4 safe-bottom">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirm', tone = 'danger', onConfirm, children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => Promise<unknown> | unknown;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } catch {
                /* caller shows the error */
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export const DropdownMenu = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({ children, align = 'end', className }: { children: ReactNode; align?: 'start' | 'end' | 'center'; className?: string }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn('z-50 min-w-48 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-float data-[state=open]:animate-fade-in', className)}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function DropdownItem({
  children, onSelect, icon, danger, disabled,
}: { children: ReactNode; onSelect?: () => void; icon?: ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <DM.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
        danger ? 'text-red-600 data-[highlighted]:bg-red-50' : 'text-ink-700 data-[highlighted]:bg-ink-100 data-[highlighted]:text-ink-950',
      )}
    >
      {icon && <span className="text-current opacity-80">{icon}</span>}
      {children}
    </DM.Item>
  );
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1 h-px bg-ink-100" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{children}</DM.Label>;
}

export function Tabs({
  value, onValueChange, items, className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  items: { value: string; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange}>
      <RTabs.List className={cn('flex gap-1 overflow-x-auto scrollbar-none rounded-2xl bg-ink-100/80 p-1', className)} aria-label="Filter">
        {items.map((it) => (
          <RTabs.Trigger
            key={it.value}
            value={it.value}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-ink-600 transition hover:text-ink-900 data-[state=active]:bg-white data-[state=active]:text-ink-950 data-[state=active]:shadow-sm"
          >
            {it.label}
            {it.count != null && (
              <span className="rounded-full bg-ink-200/70 px-1.5 text-[11px] font-semibold text-ink-600">{it.count}</span>
            )}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
    </RTabs.Root>
  );
}
