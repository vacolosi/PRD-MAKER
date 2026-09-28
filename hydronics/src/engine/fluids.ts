import type { FluidReferenceId } from './contract.js';
import { glycolReferenceProperties } from './glycol.js';
import { fluidPropertiesIp, iapwsLiquidWater, type FluidProperties, type FluidPropertiesIp } from './water.js';

/** Public lookup boundary: unknown runtime IDs are errors, never a water fallback. */
export function referenceProperties(referenceId: FluidReferenceId, temperatureF: number): FluidProperties {
  if (referenceId === 'iapws-liquid-water-sr6-08-2011') return iapwsLiquidWater(temperatureF);
  return glycolReferenceProperties(referenceId, temperatureF);
}
/** Named public IP adapter; calculation/reference properties themselves remain SI. */
export function referencePropertiesIp(referenceId: FluidReferenceId, temperatureF: number): FluidPropertiesIp {
  return fluidPropertiesIp(referenceProperties(referenceId, temperatureF));
}
