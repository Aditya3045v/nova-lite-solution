import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../cn';

const control =
  'block w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 shadow-[0_1px_1px_rgb(11_16_32/0.03)] transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/15';

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-800">
          {label}
          {required && <span className="ml-0.5 text-brand-600">*</span>}
        </label>
      )}
      {children(id, describedBy)}
      {(error || hint) && (
        <p id={hintId} className={cn('text-xs', error ? 'text-red-600' : 'text-ink-500')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, className, containerClassName, required, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {(id, describedBy) => (
        <div className="relative">
          {leftIcon && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">{leftIcon}</span>}
          <input
            ref={ref}
            id={rest.id ?? id}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(control, 'h-10', leftIcon && 'pl-10', rightSlot && 'pr-10', className)}
            {...rest}
          />
          {rightSlot && <span className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</span>}
        </div>
      )}
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, required, rows = 4, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {(id, describedBy) => (
        <textarea
          ref={ref}
          id={rest.id ?? id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, 'py-2.5 leading-relaxed', className)}
          {...rest}
        />
      )}
    </Field>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  options?: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, containerClassName, children, required, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {(id, describedBy) => (
        <div className="relative">
          <select
            ref={ref}
            id={rest.id ?? id}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(control, 'h-10 appearance-none pr-9', className)}
            {...rest}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options?.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
        </div>
      )}
    </Field>
  );
});

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      {(label || description) && (
        <label htmlFor={id} className="min-w-0 cursor-pointer">
          {label && <span className="block text-sm font-medium text-ink-800">{label}</span>}
          {description && <span className="block text-xs text-ink-500">{description}</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-brand-500' : 'bg-ink-200',
        )}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, ...rest }, ref) {
  const id = useId();
  return (
    <label htmlFor={rest.id ?? id} className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-ink-800', className)}>
      <input
        ref={ref}
        id={rest.id ?? id}
        type="checkbox"
        className="h-4 w-4 rounded border-ink-300 text-brand-500 accent-brand-500 focus:ring-brand-500"
        {...rest}
      />
      {label}
    </label>
  );
});
