import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  HYDRONIC_ENGINE_VERSION, HYDRONIC_REFERENCE_DATA_VERSION, HYDRONIC_UNIT_BOUNDARY, applicabilityDiagnostic,
  assertPipeDimensions, fittingPresets, fluidPropertiesIp, getFittingPreset, getPipeCatalogEntry, glycolDatasets,
  glycolReferenceProperties, hydronicVersionMetadata, iapwsLiquidWater, isApplicabilityCurrent, isValidApplicabilityBasis, pipeCatalog,
  presetEquivalentLengthFt, referenceProperties, referencePropertiesIp, type ApplicabilityBasis, type DiagnosticResult, type DirectPsiElement, type LossElement,
} from '../src/engine/index.js';

type IndependentSourceFixture = { readonly nodes: Record<string, readonly (readonly [number, number, number])[]> };
const sourceFixture: IndependentSourceFixture = JSON.parse(readFileSync(new URL('./fixtures/independent-source-nodes.json', import.meta.url), 'utf8'));
const referenceIds = Object.keys(sourceFixture.nodes) as Array<Exclude<Parameters<typeof glycolReferenceProperties>[0], 'iapws-liquid-water-sr6-08-2011'>>;

function confirmedDirectPsi(): DirectPsiElement {
  const elementData = { type: 'direct-psi' as const, category: 'equipment' as const, quantity: 1, pressureLossPsi: 3 };
  const basis: ApplicabilityBasis = { referenceDataVersion: HYDRONIC_REFERENCE_DATA_VERSION, sectionGpm: 30, fluidReferenceId: 'iapws-liquid-water-sr6-08-2011', meanTemperatureF: 60, actualInsideDiameterIn: 2.067, roughnessFt: .00015, element: elementData, declaredEnvelope: 'Current water service; engineer-confirmed.' };
  return { id: 'equipment-1', ...elementData, applicability: { status: 'confirmed', statedEnvelope: basis.declaredEnvelope, confirmedAtBasis: basis } };
}

describe('IAPWS SR6-08(2011) reference implementation', () => {
  it('reproduces official Table 8 at 298.15 K / 77 °F', () => {
    const properties = iapwsLiquidWater(77);
    expect(properties.densityKgM3).toBeCloseTo(997.047013, 6);
    expect(properties.dynamicViscosityPaS * 1e6).toBeCloseTo(889.996774, 6);
    expect(fluidPropertiesIp(properties).densityLbFt3).toBeCloseTo(62.243612, 5);
  });
  it('rejects malformed and out-of-range runtime water inputs rather than extrapolating or coercing', () => {
    for (const value of [NaN, Infinity, -Infinity, undefined, null, '77', '']) expect(() => iapwsLiquidWater(value as number)).toThrow(/finite number/);
    expect(() => iapwsLiquidWater(31.999)).toThrow(/extrapolation/);
    expect(() => iapwsLiquidWater(200.001)).toThrow(/extrapolation/);
  });
});

describe('dated glycol source lookup', () => {
  it('matches all 216 independently extracted source-node expectations, not values read from production data', () => {
    for (const referenceId of referenceIds) for (const [temperatureF, densityLbFt3, viscosityCp] of sourceFixture.nodes[referenceId]!) {
      const properties = glycolReferenceProperties(referenceId, temperatureF);
      expect(properties.densityKgM3).toBeCloseTo(densityLbFt3 * 16.01846337396014, 10);
      expect(properties.dynamicViscosityPaS).toBeCloseTo(viscosityCp * .001, 12);
    }
  });
  it('has corrected EG density columns and does not retain the shifted 40% column at 30F', () => {
    expect(glycolReferenceProperties('dowtherm-sr1-eg-30vol-2008-02', 30).densityKgM3 / 16.01846337396014).toBe(65.76);
    expect(glycolReferenceProperties('dowtherm-sr1-eg-40vol-2008-02', 30).densityKgM3 / 16.01846337396014).toBe(66.70);
    expect(glycolReferenceProperties('dowtherm-sr1-eg-50vol-2008-02', 200).densityKgM3 / 16.01846337396014).toBe(64.27);
  });
  it('uses linear density and log-linear positive viscosity between adjacent source nodes', () => {
    const properties = glycolReferenceProperties('dowfrost-pg-50vol-2001-09', 45);
    expect(properties.densityKgM3 / 16.01846337396014).toBeCloseTo((65.67 + 65.50) / 2, 12);
    expect(properties.dynamicViscosityPaS / .001).toBeCloseTo(Math.sqrt(14.28 * 10.65), 12);
  });
  it('rejects malformed, unknown, and out-of-range inputs rather than coercing or falling back to water', () => {
    for (const value of [NaN, Infinity, -Infinity, undefined, null, '40', '']) expect(() => glycolReferenceProperties('dowfrost-pg-30vol-2001-09', value as number)).toThrow(/finite number/);
    expect(() => glycolReferenceProperties('dowfrost-pg-30vol-2001-09', 29.9)).toThrow(/extrapolation/);
    expect(() => referenceProperties('not-a-reference' as never, 70)).toThrow(/Unknown glycol reference/);
    expect(() => referencePropertiesIp('not-a-reference' as never, 70)).toThrow(/Unknown glycol reference/);
  });
  it('prevents public data mutation from changing later lookups', () => {
    const before = glycolReferenceProperties('dowfrost-pg-30vol-2001-09', 30).densityKgM3;
    expect(() => { (glycolDatasets[0]!.nodes[0] as [number, number, number])[1] = 1; }).toThrow();
    expect(glycolReferenceProperties('dowfrost-pg-30vol-2001-09', 30).densityKgM3).toBe(before);
  });
});

describe('source-reviewed bounded pipe catalog', () => {
  it('contains exactly 90 immutable entries: 15 common sizes by three steel schedules and three copper types', () => {
    expect(pipeCatalog).toHaveLength(90);
    expect(new Set(pipeCatalog.map((entry) => entry.id)).size).toBe(90);
    pipeCatalog.forEach(assertPipeDimensions);
    expect(() => { (getPipeCatalogEntry('steel-sch40-4') as { actualInsideDiameterIn: number }).actualInsideDiameterIn = 0; }).toThrow();
    expect(getPipeCatalogEntry('steel-sch40-4').actualInsideDiameterIn).toBe(4.026);
  });
  it('preserves exact literal designations and accepted NPS 10/12 Sch80 dimensions', () => {
    expect(getPipeCatalogEntry('steel-sch80-10').wallThicknessIn).toBe(.594);
    expect(getPipeCatalogEntry('steel-sch80-10').actualInsideDiameterIn).toBe(9.562);
    expect(getPipeCatalogEntry('steel-sch80-12').wallThicknessIn).toBe(.688);
    expect(getPipeCatalogEntry('steel-sch80-12').actualInsideDiameterIn).toBe(11.374);
    for (const id of ['steel-xs-10', 'steel-xs-12', 'steel-std-12', 'steel-sch80s-12']) expect(() => getPipeCatalogEntry(id)).toThrow(/Unsupported/);
  });
  it('rejects nonfinite and impossible geometry in the dimensional guard', () => {
    const valid = getPipeCatalogEntry('steel-sch40-4');
    for (const mutation of [
      { ...valid, actualInsideDiameterIn: NaN }, { ...valid, outsideDiameterIn: Infinity },
      { ...valid, actualInsideDiameterIn: -1 }, { ...valid, wallThicknessIn: -1 },
      { ...valid, actualInsideDiameterIn: 9 },
    ]) expect(() => assertPipeDimensions(mutation)).toThrow();
  });
});

describe('DOE generic elbow presets and applicability lifecycle contract', () => {
  it('keeps the two approved generic ratios and derives EL from current actual ID', () => {
    expect(fittingPresets).toHaveLength(2);
    expect(getFittingPreset('doe-hdbk-1012-3-92-standard-90-elbow').equivalentLengthToDiameterRatio).toBe(30);
    expect(getFittingPreset('doe-hdbk-1012-3-92-standard-45-elbow').equivalentLengthToDiameterRatio).toBe(16);
    expect(presetEquivalentLengthFt('doe-hdbk-1012-3-92-standard-90-elbow', 2)).toBe(5);
    expect(presetEquivalentLengthFt('doe-hdbk-1012-3-92-standard-90-elbow', 4)).toBe(10);
    expect(fittingPresets.every((preset) => preset.connectionAndManufacturer === 'unspecified' && preset.applicability.includes('turbulent-only'))).toBe(true);
  });
  it('requires an explicit current basis for K/EL/Cv/direct applicability and invalidates data/flow changes', () => {
    const unconfirmedElements = [
      { id: 'k-1', type: 'k' as const, category: 'fitting' as const, quantity: 1, k: 1.2, basis: 'section-inside-diameter' as const, applicability: { status: 'unconfirmed' as const, statedEnvelope: 'Manual K.' } },
      { id: 'el-1', type: 'equivalent-length' as const, category: 'fitting' as const, quantity: 1, equivalentLengthFt: 3, basis: 'section-inside-diameter' as const, applicability: { status: 'unconfirmed' as const, statedEnvelope: 'Manual EL.' } },
      { id: 'cv-1', type: 'cv' as const, category: 'valve' as const, quantity: 1, cv: 10, applicability: { status: 'unconfirmed' as const, statedEnvelope: 'Manufacturer Cv basis.' } },
      { id: 'direct-1', type: 'direct-psi' as const, category: 'equipment' as const, quantity: 1, pressureLossPsi: 3, applicability: { status: 'unconfirmed' as const, statedEnvelope: 'Manufacturer pressure basis.' } },
    ] satisfies readonly LossElement[];
    expect(unconfirmedElements.every((element) => element.id.length > 0 && element.applicability.status === 'unconfirmed')).toBe(true);
    expect(unconfirmedElements.map((element) => element.type)).toEqual(['k', 'equivalent-length', 'cv', 'direct-psi']);
    const direct = confirmedDirectPsi();
    const current = direct.applicability.status === 'confirmed' ? direct.applicability.confirmedAtBasis : undefined;
    expect(current).toBeDefined();
    expect(isApplicabilityCurrent(direct.applicability, current!)).toBe(true);
    const changedData = { ...current!, element: { ...current!.element, pressureLossPsi: 30 } } as ApplicabilityBasis;
    const changedFlow = { ...current!, sectionGpm: 50 };
    expect(isApplicabilityCurrent(direct.applicability, changedData)).toBe(false);
    expect(isApplicabilityCurrent(direct.applicability, changedFlow)).toBe(false);
    expect(isApplicabilityCurrent(direct.applicability, { ...current!, referenceDataVersion: 'changed-reference-data' })).toBe(false);
    expect(isApplicabilityCurrent(direct.applicability, { ...current!, referenceDataVersion: undefined as never })).toBe(false);
    const missingSavedVersion = { status: 'confirmed' as const, statedEnvelope: direct.applicability.statedEnvelope, confirmedAtBasis: { ...current!, referenceDataVersion: undefined as never } };
    expect(isApplicabilityCurrent(missingSavedVersion, current!)).toBe(false);
    expect(isValidApplicabilityBasis({ ...current!, sectionGpm: NaN })).toBe(false);
    expect(isValidApplicabilityBasis({ ...current!, actualInsideDiameterIn: 0 })).toBe(false);
    const reordered = { declaredEnvelope: current!.declaredEnvelope, element: { quantity: 1, category: 'equipment' as const, pressureLossPsi: 3, type: 'direct-psi' as const }, roughnessFt: current!.roughnessFt, actualInsideDiameterIn: current!.actualInsideDiameterIn, meanTemperatureF: current!.meanTemperatureF, fluidReferenceId: current!.fluidReferenceId, sectionGpm: current!.sectionGpm, referenceDataVersion: current!.referenceDataVersion } as ApplicabilityBasis;
    expect(isApplicabilityCurrent(direct.applicability, reordered)).toBe(true);
    expect(applicabilityDiagnostic({ status: 'unconfirmed', statedEnvelope: 'Manual K requires engineer confirmation.' }, current!, 'section:s1/element:k1')[0]?.code).toBe('incomplete-applicability');
  });
});

describe('shared version, diagnostics, and unit-boundary contracts', () => {
  it('exports stable engine/data metadata and the named SI/IP boundary', () => {
    const incomplete: DiagnosticResult = { completeness: 'incomplete', diagnostics: [{ code: 'incomplete-applicability', message: 'Confirmation required.' }] };
    expect(incomplete.diagnostics[0]?.code).toBe('incomplete-applicability');
    expect(HYDRONIC_ENGINE_VERSION).toBe('hydronic-pressure-drop-engine@1.0.0');
    expect(HYDRONIC_REFERENCE_DATA_VERSION).toBe('hydronic-reference-data@1.0.0');
    expect(hydronicVersionMetadata.engineVersion).toBe(HYDRONIC_ENGINE_VERSION);
    expect(HYDRONIC_UNIT_BOUNDARY).toBe('internal-si-and-public-ip-adapter');
  });
});
