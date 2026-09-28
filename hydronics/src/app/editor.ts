/** UI-only draft helpers. Engine inputs remain separate from raw editor text. */
export interface NumericParse { readonly value?: number; readonly error?: string }
const fullNumber = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
export function parseEditorNumber(text: string): NumericParse {
  const trimmed = text.trim();
  if (trimmed === '') return { error: 'A number is required.' };
  if (!fullNumber.test(trimmed)) return { error: 'Enter a complete decimal or scientific number.' };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: 'Number must be finite.' };
  // Only a non-zero significand that became zero is underflow. Exponent digits never count.
  const significand = trimmed.split(/[eE]/)[0]!.replace(/[+\-.]/g, '');
  if (value === 0 && /[1-9]/.test(significand)) return { error: 'Nonzero input underflowed to zero.' };
  return { value: value === 0 ? 0 : value };
}
export function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return 'unavailable';
  if (value !== 0 && Math.abs(value) < .001) return value.toExponential(3);
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
export function freshId(prefix: string): string { return `${prefix}-${crypto.randomUUID()}`; }
export function withoutDraftKeys<T extends Record<string, string>>(draft: T, prefixes: readonly string[]): T {
  return Object.fromEntries(Object.entries(draft).filter(([key]) => !prefixes.some((prefix) => key.startsWith(prefix)))) as T;
}
