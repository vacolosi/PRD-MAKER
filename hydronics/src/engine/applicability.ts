import type { ApplicabilityBasis, ApplicabilityConfirmation, Diagnostic, FluidReferenceId, LossCategory, LossElement, LossElementData } from './contract.js';

const fluidIds: readonly FluidReferenceId[] = ['iapws-liquid-water-sr6-08-2011', 'dowfrost-pg-30vol-2001-09', 'dowfrost-pg-40vol-2001-09', 'dowfrost-pg-50vol-2001-09', 'dowtherm-sr1-eg-30vol-2008-02', 'dowtherm-sr1-eg-40vol-2008-02', 'dowtherm-sr1-eg-50vol-2008-02'];
const nonPipeCategories: readonly LossCategory[] = ['fitting', 'valve', 'equipment'];
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isFluidReferenceId = (value: unknown): value is FluidReferenceId => typeof value === 'string' && fluidIds.includes(value as FluidReferenceId);
export const isLossCategory = (value: unknown): value is LossCategory => typeof value === 'string' && ['pipe', ...nonPipeCategories].includes(value as LossCategory);

/** Runtime validator and selected-type projection boundary shared by applicability and loss arithmetic. */
export function isValidLossElementData(value: unknown): value is LossElementData {
  if (!object(value) || !Number.isInteger(value.quantity) || (value.quantity as number) < 0) return false;
  if (value.type === 'k') return nonPipeCategories.includes(value.category as LossCategory) && finite(value.k) && (value.k as number) >= 0 && value.basis === 'section-inside-diameter';
  if (value.type === 'equivalent-length') return nonPipeCategories.includes(value.category as LossCategory) && finite(value.equivalentLengthFt) && (value.equivalentLengthFt as number) >= 0 && value.basis === 'section-inside-diameter';
  if (value.type === 'preset-equivalent-length') return value.category === 'fitting' && value.basis === 'section-inside-diameter' && (value.presetId === 'doe-hdbk-1012-3-92-standard-90-elbow' || value.presetId === 'doe-hdbk-1012-3-92-standard-45-elbow');
  if (value.type === 'cv') return (value.category === 'valve' || value.category === 'equipment') && finite(value.cv) && (value.cv as number) > 0;
  if (value.type === 'direct-psi') return (value.category === 'valve' || value.category === 'equipment') && finite(value.pressureLossPsi) && (value.pressureLossPsi as number) >= 0;
  if (value.type === 'direct-head') return (value.category === 'valve' || value.category === 'equipment') && finite(value.headFtOfSelectedFluid) && (value.headFtOfSelectedFluid as number) >= 0;
  return false;
}

/** Projects only the primitive fields relevant to a selected loss type. */
export function lossElementData(element: LossElement): LossElementData {
  switch (element.type) {
    case 'k': return { type: 'k', category: element.category, quantity: element.quantity, k: element.k, basis: element.basis };
    case 'equivalent-length': return { type: 'equivalent-length', category: element.category, quantity: element.quantity, equivalentLengthFt: element.equivalentLengthFt, basis: element.basis };
    case 'preset-equivalent-length': return { type: 'preset-equivalent-length', category: element.category, quantity: element.quantity, presetId: element.presetId, basis: element.basis };
    case 'cv': return { type: 'cv', category: element.category, quantity: element.quantity, cv: element.cv };
    case 'direct-psi': return { type: 'direct-psi', category: element.category, quantity: element.quantity, pressureLossPsi: element.pressureLossPsi };
    case 'direct-head': return { type: 'direct-head', category: element.category, quantity: element.quantity, headFtOfSelectedFluid: element.headFtOfSelectedFluid };
  }
}

function canonicalBasis(basis: ApplicabilityBasis): readonly unknown[] {
  const e = lossElementData({ id: '', applicability: { status: 'unconfirmed', statedEnvelope: '' }, ...basis.element } as LossElement);
  const fields = e.type === 'k' ? [e.type, e.category, e.quantity, e.k, e.basis] : e.type === 'equivalent-length' ? [e.type, e.category, e.quantity, e.equivalentLengthFt, e.basis] : e.type === 'preset-equivalent-length' ? [e.type, e.category, e.quantity, e.presetId, e.basis] : e.type === 'cv' ? [e.type, e.category, e.quantity, e.cv] : e.type === 'direct-psi' ? [e.type, e.category, e.quantity, e.pressureLossPsi] : [e.type, e.category, e.quantity, e.headFtOfSelectedFluid];
  return [basis.referenceDataVersion, basis.sectionGpm, basis.fluidReferenceId, basis.meanTemperatureF, basis.actualInsideDiameterIn, basis.roughnessFt, fields, basis.declaredEnvelope];
}

export function isValidApplicabilityBasis(basis: unknown): basis is ApplicabilityBasis {
  if (!object(basis) || typeof basis.referenceDataVersion !== 'string' || basis.referenceDataVersion.length === 0 || !isFluidReferenceId(basis.fluidReferenceId) || typeof basis.declaredEnvelope !== 'string' || basis.declaredEnvelope.length === 0 || !isValidLossElementData(basis.element)) return false;
  return finite(basis.sectionGpm) && (basis.sectionGpm as number) >= 0 && finite(basis.meanTemperatureF) && finite(basis.actualInsideDiameterIn) && (basis.actualInsideDiameterIn as number) > 0 && finite(basis.roughnessFt) && (basis.roughnessFt as number) >= 0;
}

export function isValidApplicabilityConfirmation(value: unknown): value is ApplicabilityConfirmation {
  if (!object(value) || typeof value.statedEnvelope !== 'string' || value.statedEnvelope.length === 0) return false;
  return value.status === 'unconfirmed' || (value.status === 'confirmed' && isValidApplicabilityBasis(value.confirmedAtBasis));
}

/** Field-ordered structural comparison is conservative without depending on object insertion order. */
export function isApplicabilityCurrent(confirmation: ApplicabilityConfirmation, currentBasis: ApplicabilityBasis): boolean {
  return confirmation.status === 'confirmed' && isValidApplicabilityBasis(confirmation.confirmedAtBasis) && isValidApplicabilityBasis(currentBasis) && JSON.stringify(canonicalBasis(confirmation.confirmedAtBasis)) === JSON.stringify(canonicalBasis(currentBasis));
}

export function applicabilityDiagnostic(confirmation: ApplicabilityConfirmation, currentBasis: ApplicabilityBasis, location?: string): readonly Diagnostic[] {
  if (isApplicabilityCurrent(confirmation, currentBasis)) return [];
  const message = confirmation.status === 'unconfirmed' ? 'Engineer applicability confirmation is required for the current fluid/service basis.' : 'Saved applicability confirmation does not match the current derived flow, fluid, geometry, loss data, or declared envelope.';
  return [location === undefined ? { code: 'incomplete-applicability', message } : { code: 'incomplete-applicability', message, location }];
}
