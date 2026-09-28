import { assertFiniteNumber, fahrenheitToKelvin, KG_M3_TO_LB_FT3, PA_S_TO_CP } from './units.js';
/** Internal/reference boundary: explicitly SI density and dynamic viscosity. */
export interface FluidProperties { readonly densityKgM3: number; readonly dynamicViscosityPaS: number; readonly provenance: string; readonly provisional: boolean; }
/** Public integration/reporting adapter: explicitly IP density and dynamic viscosity. */
export interface FluidPropertiesIp { readonly densityLbFt3: number; readonly dynamicViscosityLbFtS: number; readonly provenance: string; readonly provisional: boolean; }
const R = 461.51805, TR = 10, P0 = 100000, TA = 593, TB = 232;
const A5 = 1.93763157e-2;
const A: readonly [number, number][] = [[6.74458446e3, 4], [-2.22521604e5, 5], [1.00231247e8, 7], [-1.63552118e9, 8], [8.32299658e9, 9]];
const B: readonly [number, number][] = [[5.78545292e-3, 1], [-1.53195665e-2, 2], [3.11337859e-2, 3], [-4.23546241e-2, 4], [3.38713507e-2, 5], [-1.19946761e-2, 6]];
/** IAPWS SR6-08(2011) Eq. (2), at p0=0.1 MPa; this package intentionally does not infer absolute-pressure suitability. */
export function iapwsLiquidWater(temperatureF: number): FluidProperties {
  assertFiniteNumber(temperatureF, 'Water temperature');
  if (temperatureF < 32 || temperatureF > 200) throw new RangeError('Water reference range is 32–200 °F; extrapolation is prohibited.');
  const temperatureK = fahrenheitToKelvin(temperatureF), alpha = TR / (TA - temperatureK), beta = TR / (temperatureK - TB);
  const specificVolume = R * TR / P0 * (A5 + A.reduce((sum, [coefficient, power]) => sum + coefficient * alpha ** power, 0) + B.reduce((sum, [coefficient, power]) => sum + coefficient * beta ** power, 0));
  const densityKgM3 = 1 / specificVolume;
  const reduced = temperatureK / 300;
  const dynamicViscosityPaS = 1e-6 * (280.68 * reduced ** -1.9 + 511.45 * reduced ** -7.7 + 61.131 * reduced ** -19.6 + 0.45903 * reduced ** -40);
  return Object.freeze({ densityKgM3, dynamicViscosityPaS, provenance: 'IAPWS SR6-08(2011), Eq. (2)/Eq. (7), p0=0.1 MPa', provisional: false });
}
/** Named SI-to-IP reporting adapter; engine math keeps SI properties until an explicit boundary conversion. */
export function fluidPropertiesIp(properties: FluidProperties): FluidPropertiesIp {
  return Object.freeze({
    densityLbFt3: properties.densityKgM3 * KG_M3_TO_LB_FT3,
    // 1 Pa·s = 0.671968975 lb/(ft·s); expressed from exact SI base conversion.
    dynamicViscosityLbFtS: properties.dynamicViscosityPaS * 0.6719689751395068,
    provenance: properties.provenance,
    provisional: properties.provisional,
  });
}
/** cP conversion is exported for reports needing the conventional dynamic-viscosity display. */
export const dynamicViscosityCp = (properties: FluidProperties): number => properties.dynamicViscosityPaS * PA_S_TO_CP;
