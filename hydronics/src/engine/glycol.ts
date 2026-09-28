import type { FluidReferenceId } from './contract.js';
import { assertFiniteNumber, LB_FT3_TO_KG_M3, PA_S_PER_CP } from './units.js';
import type { FluidProperties } from './water.js';

type Node = readonly [temperatureF: number, densityLbFt3: number, viscosityCp: number];
export interface GlycolDataset { readonly referenceId: Exclude<FluidReferenceId, 'iapws-liquid-water-sr6-08-2011'>; readonly product: string; readonly concentrationVolumePercentGlycol: 30 | 40 | 50; readonly nodes: readonly Node[]; readonly source: string; }
const temperatures = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] as const;

function makeNodes(density: readonly number[], viscosity: readonly number[]): readonly Node[] {
  if (density.length !== temperatures.length || viscosity.length !== temperatures.length) throw new Error('Glycol node arrays must match the declared temperature grid.');
  const nodes = temperatures.map((temperatureF, index) => Object.freeze([temperatureF, density[index]!, viscosity[index]!] as const));
  for (let index = 0; index < nodes.length; index += 1) {
    const [temperatureF, densityLbFt3, viscosityCp] = nodes[index]!;
    if (![temperatureF, densityLbFt3, viscosityCp].every((value) => Number.isFinite(value) && value > 0)) throw new Error('Glycol nodes must be finite and positive.');
    if (index > 0 && nodes[index - 1]![0] >= temperatureF) throw new Error('Glycol temperature nodes must be strictly increasing.');
  }
  return Object.freeze(nodes);
}
function freezeDataset(dataset: GlycolDataset): GlycolDataset { return Object.freeze({ ...dataset, nodes: Object.freeze([...dataset.nodes]) }); }

/**
 * Dated, named-product typical-property transcription: DOWFROST September 2001 and
 * DOWTHERM SR-1 February 2008 English tables. Raw sources remain temp-only; test fixtures are
 * independently extracted from parent-reviewed cells rather than derived from this table.
 */
const DATASETS: readonly GlycolDataset[] = Object.freeze([
  freezeDataset({ referenceId: 'dowfrost-pg-30vol-2001-09', product: 'DOWFROST (published September 2001)', concentrationVolumePercentGlycol: 30, source: 'Dow DOWFROST Engineering and Operating Guide, Form 180-01286-0901 AMS, Table 9 printed p.18/PDF p.17 and Table 13 printed p.22/PDF p.21 (English)', nodes: makeNodes([64.79, 64.67, 64.53, 64.39, 64.24, 64.08, 63.91, 63.73, 63.54, 63.33, 63.12, 62.90, 62.67, 62.43, 62.18, 61.92, 61.65, 61.37], [7.46, 5.75, 4.52, 3.62, 2.94, 2.43, 2.04, 1.73, 1.49, 1.30, 1.14, 1.01, .91, .82, .74, .68, .62, .58]) }),
  freezeDataset({ referenceId: 'dowfrost-pg-40vol-2001-09', product: 'DOWFROST (published September 2001)', concentrationVolumePercentGlycol: 40, source: 'Dow DOWFROST Engineering and Operating Guide, Form 180-01286-0901 AMS, Table 9 printed p.18/PDF p.17 and Table 13 printed p.22/PDF p.21 (English)', nodes: makeNodes([65.35, 65.21, 65.06, 64.90, 64.73, 64.55, 64.36, 64.16, 63.95, 63.74, 63.51, 63.27, 63.02, 62.76, 62.49, 62.22, 61.93, 61.63], [13.12, 9.60, 7.21, 5.56, 4.38, 3.52, 2.88, 2.40, 2.03, 1.73, 1.50, 1.31, 1.16, 1.04, .93, .85, .77, .71]) }),
  freezeDataset({ referenceId: 'dowfrost-pg-50vol-2001-09', product: 'DOWFROST (published September 2001)', concentrationVolumePercentGlycol: 50, source: 'Dow DOWFROST Engineering and Operating Guide, Form 180-01286-0901 AMS, Table 9 printed p.18/PDF p.17 and Table 13 printed p.22/PDF p.21 (English)', nodes: makeNodes([65.82, 65.67, 65.50, 65.33, 65.14, 64.95, 64.74, 64.53, 64.30, 64.06, 63.82, 63.57, 63.30, 63.03, 62.74, 62.45, 62.14, 61.83], [19.66, 14.28, 10.65, 8.13, 6.34, 5.04, 4.08, 3.35, 2.79, 2.36, 2.02, 1.75, 1.53, 1.35, 1.20, 1.08, .97, .88]) }),
  freezeDataset({ referenceId: 'dowtherm-sr1-eg-30vol-2008-02', product: 'DOWTHERM SR-1 (published February 2008)', concentrationVolumePercentGlycol: 30, source: 'Dow DOWTHERM SR-1 Engineering Guide, Form 180-01190-0208 AMS, Table 10 printed/PDF p.18 and Table 14 printed/PDF p.22 (English)', nodes: makeNodes([65.76, 65.66, 65.55, 65.43, 65.30, 65.17, 65.02, 64.86, 64.70, 64.52, 64.34, 64.15, 63.95, 63.73, 63.51, 63.28, 63.04, 62.79], [4.33, 3.54, 2.95, 2.49, 2.13, 1.84, 1.60, 1.41, 1.25, 1.11, 1.00, .90, .82, .75, .68, .63, .58, .54]) }),
  freezeDataset({ referenceId: 'dowtherm-sr1-eg-40vol-2008-02', product: 'DOWTHERM SR-1 (published February 2008)', concentrationVolumePercentGlycol: 40, source: 'Dow DOWTHERM SR-1 Engineering Guide, Form 180-01190-0208 AMS, Table 10 printed/PDF p.18 and Table 14 printed/PDF p.22 (English)', nodes: makeNodes([66.70, 66.59, 66.47, 66.34, 66.20, 66.05, 65.90, 65.73, 65.56, 65.37, 65.18, 64.98, 64.76, 64.54, 64.31, 64.07, 63.82, 63.56], [6.09, 4.91, 4.04, 3.38, 2.87, 2.46, 2.13, 1.87, 1.64, 1.46, 1.30, 1.17, 1.05, .95, .87, .79, .73, .67]) }),
  freezeDataset({ referenceId: 'dowtherm-sr1-eg-50vol-2008-02', product: 'DOWTHERM SR-1 (published February 2008)', concentrationVolumePercentGlycol: 50, source: 'Dow DOWTHERM SR-1 Engineering Guide, Form 180-01190-0208 AMS, Table 10 printed/PDF p.18 and Table 14 printed/PDF p.22 (English)', nodes: makeNodes([67.59, 67.47, 67.34, 67.20, 67.05, 66.90, 66.73, 66.55, 66.37, 66.17, 65.97, 65.75, 65.53, 65.30, 65.05, 64.80, 64.54, 64.27], [8.48, 6.77, 5.50, 4.55, 3.81, 3.23, 2.76, 2.39, 2.08, 1.82, 1.61, 1.43, 1.28, 1.15, 1.04, .94, .85, .78]) }),
]);

/** Frozen read-only inspection data; mutation attempts cannot change future calculations. */
export const glycolDatasets: readonly GlycolDataset[] = DATASETS;
export function glycolReferenceProperties(referenceId: Exclude<FluidReferenceId, 'iapws-liquid-water-sr6-08-2011'>, temperatureF: number): FluidProperties {
  assertFiniteNumber(temperatureF, 'Glycol temperature');
  const dataset = DATASETS.find((entry) => entry.referenceId === referenceId);
  if (!dataset) throw new RangeError(`Unknown glycol reference ${String(referenceId)}`);
  if (temperatureF < 30 || temperatureF > 200) throw new RangeError('Glycol reference range is 30–200 °F; extrapolation is prohibited.');
  const exact = dataset.nodes.find((node) => node[0] === temperatureF);
  let densityLbFt3: number; let viscosityCp: number;
  if (exact) [, densityLbFt3, viscosityCp] = exact;
  else {
    const upperIndex = dataset.nodes.findIndex((node) => node[0] > temperatureF);
    const lower = dataset.nodes[upperIndex - 1]; const upper = dataset.nodes[upperIndex];
    if (!lower || !upper) throw new RangeError('No adjacent verified glycol nodes; extrapolation is prohibited.');
    const weight = (temperatureF - lower[0]) / (upper[0] - lower[0]);
    densityLbFt3 = lower[1] + weight * (upper[1] - lower[1]);
    viscosityCp = Math.exp(Math.log(lower[2]) + weight * (Math.log(upper[2]) - Math.log(lower[2])));
  }
  return Object.freeze({ densityKgM3: densityLbFt3 * LB_FT3_TO_KG_M3, dynamicViscosityPaS: viscosityCp * PA_S_PER_CP, provenance: `${dataset.source}; linear density/log-linear dynamic viscosity interpolation`, provisional: false });
}
