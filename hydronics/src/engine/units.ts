export const GPM_TO_M3_S = 6.30901964e-5;
export const LB_FT3_TO_KG_M3 = 16.01846337396014;
export const KG_M3_TO_LB_FT3 = 1 / LB_FT3_TO_KG_M3;
export const IN_TO_M = 0.0254;
export const FT_TO_M = 0.3048;
export const PA_S_PER_CP = 1e-3;
export const PA_S_TO_CP = 1 / PA_S_PER_CP;
export const fahrenheitToKelvin = (fahrenheit: number): number => (fahrenheit - 32) * 5 / 9 + 273.15;
export const kelvinToFahrenheit = (kelvin: number): number => (kelvin - 273.15) * 9 / 5 + 32;
export const psiToPa = (psi: number): number => psi * 6894.757293168;

/** Runtime boundary guard for public calculation/property entry points. */
export function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(`${label} must be a finite number.`);
}
