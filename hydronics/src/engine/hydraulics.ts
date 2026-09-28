import { applicabilityDiagnostic, isFluidReferenceId, isLossCategory, isValidApplicabilityConfirmation, isValidLossElementData, lossElementData } from './applicability.js';
import { HYDRONIC_REFERENCE_DATA_VERSION, type ApplicabilityBasis, type Diagnostic, type FluidReferenceId, type LossCategory, type LossElement, type PipeGeometry, type Section } from './contract.js';
import { presetEquivalentLengthFt } from './fittings.js';
import { referenceProperties } from './fluids.js';
import { getPipeCatalogEntry } from './pipes.js';
import { FT_TO_M, GPM_TO_M3_S, IN_TO_M, psiToPa } from './units.js';

export type FlowRegime = 'zero-flow' | 'laminar' | 'transition' | 'turbulent';
export interface ResolvedGeometry { readonly actualInsideDiameterIn: number; readonly roughnessFt: number; }
export interface HydraulicState { readonly flowGpm: number; readonly velocityFtS: number; readonly reynoldsNumber: number; readonly regime: FlowRegime; readonly darcyFrictionFactor?: number; readonly colebrookResidual?: number; readonly densityKgM3: number; readonly dynamicViscosityPaS: number; }
export interface LossItem { readonly id: string; readonly kind: 'pipe' | LossElement['type'] | 'invalid'; readonly category: LossCategory | 'invalid'; readonly quantity: number; readonly headFt: number | undefined; readonly pressureLossPsi: number | undefined; readonly equivalentLengthFt?: number; readonly k?: number; readonly cv?: number; readonly diagnostics: readonly Diagnostic[]; }
export interface SectionLossResult { readonly sectionId: string; readonly flowGpm: number; readonly geometry?: ResolvedGeometry; readonly hydraulicState?: HydraulicState; readonly frictionHeadFtPer100Ft: number | undefined; readonly items: readonly LossItem[]; readonly categoryHeadFt: Readonly<Record<LossCategory, number | undefined>>; readonly headFt: number | undefined; readonly pressureLossPsi: number | undefined; readonly diagnostics: readonly Diagnostic[]; readonly complete: boolean; }

const G = 9.80665;
const WATER_60F_DENSITY_KG_M3 = 999.016490664473;
const categories = ['pipe', 'fitting', 'valve', 'equipment'] as const;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = (message: string, location?: string): Diagnostic => location ? { code: 'invalid-input', message, location } : { code: 'invalid-input', message };
const numerical = (message: string, location?: string): Diagnostic => location ? { code: 'numerical-failure', message, location } : { code: 'numerical-failure', message };
function emptyCategories(value: number | undefined): Record<LossCategory, number | undefined> { return { pipe: value, fitting: value, valve: value, equipment: value }; }
function safeSum(values: readonly number[]): number | undefined { const total = values.reduce((sum, value) => sum + value, 0); return finite(total) && total >= 0 ? total : undefined; }

/** Central actual-fluid head/pressure conversions. Both arguments and results must be representable. */
export function headFtToActualFluidPsi(headFt: number, densityKgM3: number): number {
  const coefficient = densityKgM3 * G * FT_TO_M / psiToPa(1); const result = headFt * coefficient;
  if (!finite(headFt) || headFt < 0 || !finite(densityKgM3) || densityKgM3 <= 0 || !finite(coefficient) || coefficient <= 0 || !finite(result) || result < 0 || (headFt > 0 && result === 0)) throw new RangeError('Head-to-pressure conversion is not representable.');
  return result;
}
export function actualFluidPsiToHeadFt(psi: number, densityKgM3: number): number {
  const coefficient = psiToPa(1) / (densityKgM3 * G * FT_TO_M); const result = psi * coefficient;
  if (!finite(psi) || psi < 0 || !finite(densityKgM3) || densityKgM3 <= 0 || !finite(coefficient) || coefficient <= 0 || !finite(result) || result < 0 || (psi > 0 && result === 0)) throw new RangeError('Pressure-to-head conversion is not representable.');
  return result;
}

export function resolvePipeGeometry(geometry: PipeGeometry): ResolvedGeometry {
  if (!object(geometry) || (geometry.kind !== 'catalog' && geometry.kind !== 'custom')) throw new RangeError('Pipe geometry kind must be catalog or custom.');
  let actualInsideDiameterIn: unknown; let roughnessFt: unknown;
  if (geometry.kind === 'catalog') {
    if (typeof geometry.catalogId !== 'string' || geometry.catalogId.length === 0) throw new RangeError('Pipe catalog ID must be a nonempty string.');
    if (Object.prototype.hasOwnProperty.call(geometry, 'roughnessOverrideFt') && geometry.roughnessOverrideFt !== undefined && !finite(geometry.roughnessOverrideFt)) throw new RangeError('Pipe roughness override must be a finite number when supplied.');
    const entry = getPipeCatalogEntry(geometry.catalogId); actualInsideDiameterIn = entry.actualInsideDiameterIn; roughnessFt = geometry.roughnessOverrideFt === undefined ? entry.defaultRoughnessFt : geometry.roughnessOverrideFt;
  } else { actualInsideDiameterIn = geometry.actualInsideDiameterIn; roughnessFt = geometry.roughnessFt; }
  if (!finite(actualInsideDiameterIn) || actualInsideDiameterIn <= 0 || !finite(roughnessFt) || roughnessFt < 0) throw new RangeError('Pipe actual inside diameter must be finite positive and roughness finite nonnegative.');
  return Object.freeze({ actualInsideDiameterIn, roughnessFt });
}
function assertResolvedGeometry(geometry: ResolvedGeometry): void { if (!object(geometry) || !finite(geometry.actualInsideDiameterIn) || geometry.actualInsideDiameterIn <= 0 || !finite(geometry.roughnessFt) || geometry.roughnessFt < 0) throw new RangeError('Resolved pipe geometry must have finite positive ID and finite nonnegative roughness.'); }

export function colebrookDarcyFrictionFactor(reynoldsNumber: number, relativeRoughness: number): { readonly frictionFactor: number; readonly residual: number } {
  if (!finite(reynoldsNumber) || reynoldsNumber <= 4000 || !finite(relativeRoughness) || relativeRoughness < 0) throw new RangeError('Colebrook requires finite Re > 4000 and nonnegative relative roughness.');
  const residualAt = (factor: number): number => 1 / Math.sqrt(factor) + 2 * Math.log10(relativeRoughness / 3.7 + 2.51 / (reynoldsNumber * Math.sqrt(factor)));
  let low = .0025, high = .2, lowResidual = residualAt(low), highResidual = residualAt(high);
  if (!finite(lowResidual) || !finite(highResidual) || lowResidual * highResidual > 0) throw new RangeError('Colebrook residual is not bracketed.');
  for (let i = 0; i < 100; i += 1) { const factor = (low + high) / 2, residual = residualAt(factor); if (!finite(factor) || !finite(residual)) throw new RangeError('Colebrook produced a nonfinite value.'); if (Math.abs(residual) <= 1e-12 || high - low <= 1e-14) return Object.freeze({ frictionFactor: factor, residual }); if (lowResidual * residual > 0) { low = factor; lowResidual = residual; } else high = factor; }
  throw new RangeError('Colebrook did not converge within 100 iterations.');
}

export function hydraulicState(flowGpm: number, geometry: ResolvedGeometry, fluidReferenceId: FluidReferenceId, meanTemperatureF: number): HydraulicState {
  if (!finite(flowGpm) || flowGpm < 0 || !isFluidReferenceId(fluidReferenceId) || !finite(meanTemperatureF)) throw new RangeError('Flow, fluid reference and temperature must be valid finite engine inputs.');
  assertResolvedGeometry(geometry);
  const properties = referenceProperties(fluidReferenceId, meanTemperatureF), diameterM = geometry.actualInsideDiameterIn * IN_TO_M;
  if (!finite(diameterM) || diameterM <= 0 || !finite(properties.densityKgM3) || properties.densityKgM3 <= 0 || !finite(properties.dynamicViscosityPaS) || properties.dynamicViscosityPaS <= 0) throw new RangeError('Fluid properties and geometry must be finite positive values.');
  if (flowGpm === 0) return Object.freeze({ flowGpm, velocityFtS: 0, reynoldsNumber: 0, regime: 'zero-flow', darcyFrictionFactor: 0, colebrookResidual: 0, densityKgM3: properties.densityKgM3, dynamicViscosityPaS: properties.dynamicViscosityPaS });
  const area = Math.PI * diameterM * diameterM / 4, flowM3S = flowGpm * GPM_TO_M3_S;
  if (!finite(area) || area <= 0 || !finite(flowM3S) || flowM3S <= 0) throw new RangeError('Positive flow or pipe area is not representable.');
  const velocityMps = flowM3S / area, reynoldsNumber = properties.densityKgM3 * velocityMps * diameterM / properties.dynamicViscosityPaS;
  if (!finite(velocityMps) || velocityMps <= 0 || !finite(reynoldsNumber) || reynoldsNumber <= 0) throw new RangeError('Flow calculation is not representable.');
  const velocityFtS = velocityMps / FT_TO_M; if (!finite(velocityFtS)) throw new RangeError('Velocity conversion is not representable.');
  if (reynoldsNumber < 2000) { const f = 64 / reynoldsNumber; if (!finite(f) || f <= 0) throw new RangeError('Laminar friction factor is not representable.'); return Object.freeze({ flowGpm, velocityFtS, reynoldsNumber, regime: 'laminar', darcyFrictionFactor: f, densityKgM3: properties.densityKgM3, dynamicViscosityPaS: properties.dynamicViscosityPaS }); }
  if (reynoldsNumber <= 4000) return Object.freeze({ flowGpm, velocityFtS, reynoldsNumber, regime: 'transition', densityKgM3: properties.densityKgM3, dynamicViscosityPaS: properties.dynamicViscosityPaS });
  const solved = colebrookDarcyFrictionFactor(reynoldsNumber, geometry.roughnessFt / (geometry.actualInsideDiameterIn / 12));
  return Object.freeze({ flowGpm, velocityFtS, reynoldsNumber, regime: 'turbulent', darcyFrictionFactor: solved.frictionFactor, colebrookResidual: solved.residual, densityKgM3: properties.densityKgM3, dynamicViscosityPaS: properties.dynamicViscosityPaS });
}
function velocityHeadFt(state: HydraulicState): number { const value = state.velocityFtS * state.velocityFtS * FT_TO_M / (2 * G); if (!finite(value) || value < 0 || (state.velocityFtS !== 0 && value === 0)) throw new RangeError('Velocity head is not representable.'); return value; }
export function frictionHeadFtPer100Ft(state: HydraulicState, geometry: ResolvedGeometry): number | undefined { assertResolvedGeometry(geometry); if (!object(state) || !finite(state.flowGpm) || state.flowGpm < 0 || !finite(state.velocityFtS) || state.velocityFtS < 0 || !finite(state.reynoldsNumber) || state.reynoldsNumber < 0 || !finite(state.densityKgM3) || state.densityKgM3 <= 0 || !finite(state.dynamicViscosityPaS) || state.dynamicViscosityPaS <= 0 || !['zero-flow','laminar','transition','turbulent'].includes(state.regime)) throw new RangeError('Hydraulic state is invalid for friction-rate reporting.'); if (state.regime === 'transition') return undefined; if (state.flowGpm === 0) return 0; if (!finite(state.darcyFrictionFactor) || state.darcyFrictionFactor <= 0) throw new RangeError('Darcy friction factor is invalid for friction-rate reporting.'); const value = state.darcyFrictionFactor * (100 / (geometry.actualInsideDiameterIn / 12)) * velocityHeadFt(state); if (!finite(value) || value < 0 || value === 0) throw new RangeError('Friction rate is not representable.'); return value; }

export function currentApplicabilityBasis(sectionFlowGpm: number, geometry: ResolvedGeometry, fluidReferenceId: FluidReferenceId, meanTemperatureF: number, element: LossElement): ApplicabilityBasis {
  const recognizableType = object(element) && (element.type === 'k' || element.type === 'equivalent-length' || element.type === 'preset-equivalent-length' || element.type === 'cv' || element.type === 'direct-psi' || element.type === 'direct-head');
  assertResolvedGeometry(geometry); if (!finite(sectionFlowGpm) || sectionFlowGpm < 0 || !isFluidReferenceId(fluidReferenceId) || !finite(meanTemperatureF) || !recognizableType || !isValidLossElementData(element) || !isValidApplicabilityConfirmation(element.applicability)) throw new RangeError('Cannot capture applicability basis from invalid current loss input.');
  const data = Object.freeze(lossElementData(element as unknown as LossElement));
  return Object.freeze({ referenceDataVersion: HYDRONIC_REFERENCE_DATA_VERSION, sectionGpm: sectionFlowGpm, fluidReferenceId, meanTemperatureF, actualInsideDiameterIn: geometry.actualInsideDiameterIn, roughnessFt: geometry.roughnessFt, element: data, declaredEnvelope: element.applicability.statedEnvelope });
}
function badItem(raw: unknown, message: string, location: string): LossItem { const row = object(raw) ? raw : {}; return { id: typeof row.id === 'string' ? row.id : `${location}:invalid`, kind: typeof row.type === 'string' ? 'invalid' : 'invalid', category: 'invalid', quantity: finite(row.quantity) ? row.quantity : 0, headFt: undefined, pressureLossPsi: undefined, diagnostics: [invalid(message, location)] }; }
function elementItem(element: unknown, state: HydraulicState, geometry: ResolvedGeometry, flow: number, fluid: FluidReferenceId, temperature: number, location: string): LossItem {
  if (!object(element) || typeof element.id !== 'string' || element.id.length === 0 || !isValidLossElementData(element) || !isValidApplicabilityConfirmation(element.applicability)) return badItem(element, 'Loss element has an invalid type, category, quantity, coefficient, or applicability shape.', location);
  const typed = element as unknown as LossElement, basis = currentApplicabilityBasis(flow, geometry, fluid, temperature, typed), diagnostics: Diagnostic[] = [...applicabilityDiagnostic(typed.applicability, basis, location)];
  const fail = (message: string, code: 'invalid-input' | 'numerical-failure' = 'invalid-input'): LossItem => ({ id: typed.id, kind: typed.type, category: typed.category, quantity: typed.quantity, headFt: undefined, pressureLossPsi: undefined, diagnostics: [...diagnostics, code === 'numerical-failure' ? numerical(message, location) : invalid(message, location)] });
  if (state.regime === 'transition') return fail('Transition flow (2000 <= Re <= 4000) blocks a final loss recommendation.');
  if (state.flowGpm === 0) return { id: typed.id, kind: typed.type, category: typed.category, quantity: typed.quantity, headFt: 0, pressureLossPsi: 0, diagnostics };
  try {
    const velocityHead = velocityHeadFt(state); let head: number; let equivalentLengthFt: number | undefined; let k: number | undefined; let cv: number | undefined;
    if (typed.type === 'k') { k = typed.k; head = typed.quantity * k * velocityHead; }
    else if (typed.type === 'equivalent-length') { if (state.darcyFrictionFactor === undefined) return fail('Darcy friction factor is unavailable.'); equivalentLengthFt = typed.equivalentLengthFt; head = typed.quantity * state.darcyFrictionFactor * (equivalentLengthFt / (geometry.actualInsideDiameterIn / 12)) * velocityHead; }
    else if (typed.type === 'preset-equivalent-length') { if (state.regime !== 'turbulent') return fail('Generic DOE equivalent-length presets are turbulent-service only.'); if (state.darcyFrictionFactor === undefined) return fail('Darcy friction factor is unavailable.'); equivalentLengthFt = presetEquivalentLengthFt(typed.presetId, geometry.actualInsideDiameterIn); head = typed.quantity * state.darcyFrictionFactor * (equivalentLengthFt / (geometry.actualInsideDiameterIn / 12)) * velocityHead; }
    else if (typed.type === 'cv') { cv = typed.cv; head = typed.quantity * ((state.flowGpm / cv) ** 2) * psiToPa(1) / (WATER_60F_DENSITY_KG_M3 * G * FT_TO_M); }
    else if (typed.type === 'direct-psi') head = typed.quantity * actualFluidPsiToHeadFt(typed.pressureLossPsi, state.densityKgM3);
    else head = typed.quantity * typed.headFtOfSelectedFluid;
    if (!finite(head) || head < 0 || (typed.quantity > 0 && ((typed.type === 'cv' && state.flowGpm > 0) || (typed.type === 'k' && typed.k > 0) || (typed.type === 'equivalent-length' && typed.equivalentLengthFt > 0) || (typed.type === 'preset-equivalent-length') || (typed.type === 'direct-psi' && typed.pressureLossPsi > 0) || (typed.type === 'direct-head' && typed.headFtOfSelectedFluid > 0)) && head === 0)) return fail('Element loss calculation is not representable.', 'numerical-failure');
    const pressureLossPsi = headFtToActualFluidPsi(head, state.densityKgM3);
    return { id: typed.id, kind: typed.type, category: typed.category, quantity: typed.quantity, headFt: head, pressureLossPsi, ...(equivalentLengthFt === undefined ? {} : { equivalentLengthFt }), ...(k === undefined ? {} : { k }), ...(cv === undefined ? {} : { cv }), diagnostics };
  } catch (error) { return fail(error instanceof Error ? error.message : 'Element loss calculation failed.', 'numerical-failure'); }
}

export function evaluateSectionLoss(section: Section, flowGpm: number, fluidReferenceId: FluidReferenceId, meanTemperatureF: number): SectionLossResult {
  const id = object(section) && typeof section.id === 'string' ? section.id : 'invalid-section', location = `section:${id}`;
  if (!object(section) || typeof section.id !== 'string' || section.id.length === 0 || !Array.isArray(section.elements)) return { sectionId: id, flowGpm, frictionHeadFtPer100Ft: undefined, items: [], categoryHeadFt: emptyCategories(undefined), headFt: undefined, pressureLossPsi: undefined, diagnostics: [invalid('Section shape is invalid.', location)], complete: false };
  let geometry: ResolvedGeometry; let state: HydraulicState;
  try { geometry = resolvePipeGeometry(section.geometry); state = hydraulicState(flowGpm, geometry, fluidReferenceId, meanTemperatureF); } catch (error) { return { sectionId: id, flowGpm, frictionHeadFtPer100Ft: undefined, items: [], categoryHeadFt: emptyCategories(undefined), headFt: undefined, pressureLossPsi: undefined, diagnostics: [invalid(error instanceof Error ? error.message : 'Section evaluation failed.', location)], complete: false }; }
  const diagnostics: Diagnostic[] = []; const items: LossItem[] = [];
  if (!finite(section.actualLengthFt) || section.actualLengthFt < 0) { const d = invalid('Physical pipe length must be finite and nonnegative.', location); diagnostics.push(d); items.push({ id: `${id}:pipe`, kind: 'pipe', category: 'pipe', quantity: 1, headFt: undefined, pressureLossPsi: undefined, diagnostics: [d] }); }
  else if (state.regime === 'transition') items.push({ id: `${id}:pipe`, kind: 'pipe', category: 'pipe', quantity: 1, headFt: undefined, pressureLossPsi: undefined, diagnostics: [{ code: 'transition-flow', message: 'Transition flow (2000 <= Re <= 4000) blocks a final pipe loss recommendation.', location }] });
  else {
    try { const head = state.flowGpm === 0 ? 0 : state.darcyFrictionFactor! * (section.actualLengthFt / (geometry.actualInsideDiameterIn / 12)) * velocityHeadFt(state); const psi = headFtToActualFluidPsi(head, state.densityKgM3); if (!finite(head) || head < 0 || (section.actualLengthFt > 0 && state.flowGpm > 0 && head === 0)) throw new RangeError('Pipe head is not representable.'); items.push({ id: `${id}:pipe`, kind: 'pipe', category: 'pipe', quantity: 1, headFt: head, pressureLossPsi: psi, diagnostics: [] }); } catch (error) { items.push({ id: `${id}:pipe`, kind: 'pipe', category: 'pipe', quantity: 1, headFt: undefined, pressureLossPsi: undefined, diagnostics: [numerical(error instanceof Error ? error.message : 'Pipe loss calculation failed.', location)] }); }
  }
  const ids = new Set<string>(); for (const row of section.elements) { const rowId = object(row) && typeof row.id === 'string' ? row.id : ''; if (!rowId || ids.has(rowId)) { items.push(badItem(row, 'Non-pipe element IDs must be nonempty and unique within a section.', location)); continue; } ids.add(rowId); items.push(elementItem(row, state, geometry, flowGpm, fluidReferenceId, meanTemperatureF, `${location}/element:${rowId}`)); }
  const hasInvalidCategory = items.some((item) => !isLossCategory(item.category)); const categoryHeadFt = emptyCategories(0);
  for (const category of categories) { const rows = items.filter((item) => item.category === category); categoryHeadFt[category] = hasInvalidCategory || rows.some((item) => item.headFt === undefined || !finite(item.headFt)) ? undefined : safeSum(rows.map((item) => item.headFt!)); if (!hasInvalidCategory && rows.length > 0 && categoryHeadFt[category] === undefined && rows.every((item) => item.headFt !== undefined)) diagnostics.push(numerical('Category loss total is not representable.', location)); }
  const allKnown = diagnostics.length === 0 && !hasInvalidCategory && items.every((item) => item.headFt !== undefined && finite(item.headFt) && item.pressureLossPsi !== undefined && finite(item.pressureLossPsi) && item.diagnostics.every((entry) => entry.code !== 'incomplete-applicability'));
  const headFt = allKnown ? safeSum(items.map((item) => item.headFt!)) : undefined;
  if (allKnown && headFt === undefined) diagnostics.push(numerical('Section loss total is not representable.', location));
  let pressureLossPsi: number | undefined; if (headFt !== undefined) { try { pressureLossPsi = headFtToActualFluidPsi(headFt, state.densityKgM3); } catch (error) { diagnostics.push(numerical(error instanceof Error ? error.message : 'Section pressure conversion failed.', location)); } }
  const complete = allKnown && pressureLossPsi !== undefined && finite(pressureLossPsi);
  let frictionRate: number | undefined; try { frictionRate = frictionHeadFtPer100Ft(state, geometry); } catch (error) { diagnostics.push(numerical(error instanceof Error ? error.message : 'Friction-rate reporting failed.', location)); }
  return { sectionId: id, flowGpm, geometry, hydraulicState: state, frictionHeadFtPer100Ft: frictionRate, items, categoryHeadFt, headFt: complete && diagnostics.length === 0 ? headFt : undefined, pressureLossPsi: complete && diagnostics.length === 0 ? pressureLossPsi : undefined, diagnostics: [...diagnostics, ...items.flatMap((item) => item.diagnostics)], complete: complete && diagnostics.length === 0 };
}
