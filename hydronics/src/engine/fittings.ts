import type { PresetEquivalentLengthElementData } from './contract.js';

export interface FittingPreset {
  readonly id: PresetEquivalentLengthElementData['presetId'];
  readonly identity: string;
  readonly equivalentLengthToDiameterRatio: number;
  readonly source: string;
  readonly connectionAndManufacturer: 'unspecified';
  readonly applicability: 'generic-darcy-estimate; turbulent-only; explicit current-fluid/service engineer confirmation required';
}

const presets: readonly FittingPreset[] = Object.freeze([
  Object.freeze({
    id: 'doe-hdbk-1012-3-92-standard-90-elbow',
    identity: 'DOE generic standard 90° elbow',
    equivalentLengthToDiameterRatio: 30,
    source: 'DOE-HDBK-1012/3-92, June 1992, HT-03 Table 1, printed p.35/PDF p.57; Darcy basis.',
    connectionAndManufacturer: 'unspecified',
    applicability: 'generic-darcy-estimate; turbulent-only; explicit current-fluid/service engineer confirmation required',
  }),
  Object.freeze({
    id: 'doe-hdbk-1012-3-92-standard-45-elbow',
    identity: 'DOE generic standard 45° elbow',
    equivalentLengthToDiameterRatio: 16,
    source: 'DOE-HDBK-1012/3-92, June 1992, HT-03 Table 1, printed p.35/PDF p.57; Darcy basis.',
    connectionAndManufacturer: 'unspecified',
    applicability: 'generic-darcy-estimate; turbulent-only; explicit current-fluid/service engineer confirmation required',
  }),
]);

export const fittingPresets: readonly FittingPreset[] = presets;

export function getFittingPreset(id: FittingPreset['id']): FittingPreset {
  const preset = presets.find((entry) => entry.id === id);
  if (!preset) throw new RangeError(`Unsupported fitting preset ${id}`);
  return preset;
}

/** Equivalent length is always recalculated from the current actual section ID; no stale fixed EL is stored. */
export function presetEquivalentLengthFt(presetId: FittingPreset['id'], currentActualInsideDiameterIn: number): number {
  if (typeof currentActualInsideDiameterIn !== 'number' || !Number.isFinite(currentActualInsideDiameterIn) || currentActualInsideDiameterIn <= 0) {
    throw new RangeError('Current actual inside diameter must be a finite positive number.');
  }
  return getFittingPreset(presetId).equivalentLengthToDiameterRatio * currentActualInsideDiameterIn / 12;
}
