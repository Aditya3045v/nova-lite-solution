import { z } from 'zod';

const digits = (v: string) => v.replace(/\D/g, '');

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => /^[+\d\s()-]+$/.test(v) && digits(v).length >= 10 && digits(v).length <= 13, 'Enter a valid 10-digit mobile number');

export const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^[+\d\s()-]+$/.test(v) && digits(v).length >= 10 && digits(v).length <= 13), 'Enter a valid 10-digit number');

export const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Enter a valid email address');

export const optionalPincode = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{6}$/.test(v), 'Pincode must be 6 digits');

export const emptyToNull = (v: string | undefined | null) => {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
};
