import { describe, expect, it } from 'vitest';
import { HYDRONIC_REFERENCE_DATA_VERSION, actualFluidPsiToHeadFt, colebrookDarcyFrictionFactor, currentApplicabilityBasis, evaluateHydronicSystem, evaluateSectionLoss, frictionHeadFtPer100Ft, headFtToActualFluidPsi, hydraulicState, resolvePipeGeometry, type ApplicabilityBasis, type HydronicSystem, type LossElement, type LossElementData, type Section } from '../src/engine/index.js';

const water = 'iapws-liquid-water-sr6-08-2011' as const;
const geometry = { kind: 'custom' as const, actualInsideDiameterIn: 1.049, roughnessFt: .00015 };
function confirmed(id: string, data: LossElementData, flow: number, diameter: number, envelope = 'Engineer confirmed current service.'): LossElement {
  const basis: ApplicabilityBasis = { referenceDataVersion: HYDRONIC_REFERENCE_DATA_VERSION, sectionGpm: flow, fluidReferenceId: water, meanTemperatureF: 77, actualInsideDiameterIn: diameter, roughnessFt: .00015, element: data, declaredEnvelope: envelope };
  return { id, ...data, applicability: { status: 'confirmed', statedEnvelope: envelope, confirmedAtBasis: basis } } as LossElement;
}
function section(id: string, role: Section['role'], fromNodeId: string, toNodeId: string, length: number, diameter: number, elements: readonly LossElement[] = []): Section {
  return { id, name: id, role, fromNodeId, toNodeId, geometry: { kind: 'custom', actualInsideDiameterIn: diameter, roughnessFt: .00015 }, actualLengthFt: length, elements };
}

describe('independent hydraulic loss goldens', () => {
  it('matches independent turbulent water and laminar glycol pipe goldens', () => {
    const turbulent = evaluateSectionLoss(section('p', 'supply', 'a', 'b', 100, 1.049), 10, water, 77);
    expect(turbulent.hydraulicState?.velocityFtS).toBeCloseTo(3.7122620505542807, 10);
    expect(turbulent.hydraulicState?.reynoldsNumber).toBeCloseTo(33774.58316656881, 7);
    expect(turbulent.hydraulicState?.darcyFrictionFactor).toBeCloseTo(.027080012091821405, 12);
    expect(turbulent.headFt).toBeCloseTo(6.634316015514317, 11);
    expect(turbulent.pressureLossPsi).toBeCloseTo(2.867665205558536, 11);
    const laminar = evaluateSectionLoss(section('p', 'supply', 'a', 'b', 100, 1.049), 1, 'dowfrost-pg-50vol-2001-09', 30);
    expect(laminar.hydraulicState?.regime).toBe('laminar');
    expect(laminar.hydraulicState?.reynoldsNumber).toBeCloseTo(161.68063649254984, 8);
    expect(laminar.headFt).toBeCloseTo(.9697711599352945, 11);
    // Independent Hagen–Poiseuille head, rather than a second use of 64/Re.
    const q = 6.30901964e-5, d = 1.049 * .0254, mu = laminar.hydraulicState!.dynamicViscosityPaS;
    const h = 128 * mu * 100 * .3048 * q / (Math.PI * d ** 4 * laminar.hydraulicState!.densityKgM3 * 9.80665) / .3048;
    expect(laminar.headFt).toBeCloseTo(h, 11);
  });
  it('uses inclusive transition blocking and safe zero flow', () => {
    const state = hydraulicState(0, { actualInsideDiameterIn: 1.049, roughnessFt: .00015 }, water, 77);
    expect(state.regime).toBe('zero-flow');
    expect(evaluateSectionLoss(section('p', 'supply', 'a', 'b', 100, 1.049), 0, water, 77).headFt).toBe(0);
    for (const re of [2000, 4000]) expect(() => colebrookDarcyFrictionFactor(re, .001)).toThrow();
    expect(() => hydraulicState(-1, { actualInsideDiameterIn: 1, roughnessFt: 0 }, water, 77)).toThrow();
  });
});

describe('known-flow shared circuit evaluator', () => {
  function fixture(secondDemand = 20): HydronicSystem {
    const commonCv = confirmed('cv', { type: 'cv', category: 'valve', quantity: 1, cv: 40 }, 30, 2.067);
    const aDirect = confirmed('a-direct', { type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 8 }, 10, 1.049);
    const bDirect = confirmed('b-direct', { type: 'direct-psi', category: 'equipment', quantity: 1, pressureLossPsi: 3 }, secondDemand, 1.380);
    return { id: 'system', name: 'fixture', fluidReferenceId: water, meanTemperatureF: 77, pumpDischargeNodeId: 'd', pumpSuctionNodeId: 'u', nodes: ['d','split','a-in','a-out','b-in','b-out','merge','u'].map((id) => ({ id, name: id })),
      sections: [section('s0','supply','d','split',50,2.067,[commonCv]), section('sa','supply','split','a-in',100,1.049), section('ta','terminal','a-in','a-out',0,1.049,[aDirect]), section('ra','return','a-out','merge',75,1.049), section('sb','supply','split','b-in',100,1.380), section('tb','terminal','b-in','b-out',0,1.380,[bDirect]), section('rb','return','b-out','merge',50,1.380), section('r0','return','merge','u',40,2.067)],
      circuits: [{ id:'A',name:'A',state:'active',terminalDesignGpm:10,supplySectionIds:['s0','sa'],terminalSectionId:'ta',returnSectionIds:['ra','r0'] }, { id:'B',name:'B',state:'active',terminalDesignGpm:secondDemand,supplySectionIds:['s0','sb'],terminalSectionId:'tb',returnSectionIds:['rb','r0'] }],
      margin: { percent:25, categories:['pipe'], acknowledged:true } };
  }
  it('derives common flow once, reuses shared results, and takes max factored parallel path', () => {
    const result = evaluateHydronicSystem(fixture());
    expect(result.designEligible).toBe(true);
    expect(result.activeTerminalFlowGpm).toBe(30);
    expect(result.sectionFlowGpm.s0).toBe(30); expect(result.sectionFlowGpm.r0).toBe(30);
    expect(result.sections.s0?.headFt).toBeCloseTo(.8746486902207692 + 1.2987728885513907, 10);
    expect(result.circuits[0]?.sections[0]).toBe(result.circuits[1]?.sections[0]);
    expect(result.circuits[0]?.factoredHeadFt).toBeCloseTo(25.779298725485692, 9);
    expect(result.circuits[1]?.factoredHeadFt).toBeCloseTo(21.748004155901345, 9);
    expect(result.factoredGoverningCircuitIds).toEqual(['A']);
  });
  it('invalidates common equipment confirmation after an indirect shared-flow change', () => {
    const result = evaluateHydronicSystem(fixture(40));
    expect(result.designEligible).toBe(false);
    expect(result.governingHeadFt).toBeUndefined();
    expect(result.sections.s0?.diagnostics.some((item) => item.code === 'incomplete-applicability')).toBe(true);
  });
  it('blocks an invalid active path instead of selecting another complete circuit', () => {
    const input = fixture();
    const bad = { ...input, circuits: [...input.circuits, { ...input.circuits[1]!, id: 'bad', terminalSectionId: 'missing' }] };
    const result = evaluateHydronicSystem(bad);
    expect(result.designEligible).toBe(false);
    expect(result.governingHeadFt).toBeUndefined();
    expect(result.factoredGoverningCircuitIds).toEqual([]);
    expect(result.sections).toEqual(Object.create(null));
    expect(result.circuits.find((circuit) => circuit.circuitId === 'bad')?.complete).toBe(false);
  });
  it('rejects a unique-edge cycle that revisits pump discharge before evaluating reduced topology', () => {
    const input = fixture();
    const loop = section('loop', 'supply', 'split', 'd', 1, 1.049);
    const restart = section('restart', 'supply', 'd', 'a-in', 1, 1.049);
    const changed = { ...input, nodes: input.nodes, sections: [...input.sections, loop, restart], circuits: [{ ...input.circuits[0]!, supplySectionIds: ['s0', 'loop', 'restart'] }, input.circuits[1]!] };
    const result = evaluateHydronicSystem(changed);
    expect(result.designEligible).toBe(false); expect(result.governingHeadFt).toBeUndefined(); expect(Object.keys(result.sections)).toHaveLength(0);
    expect(result.circuits[0]?.diagnostics.some((d) => d.code === 'topology-error')).toBe(true);
  });
  it('rejects terminal-only pump bypass and invalid system identity', () => {
    const bypass: HydronicSystem = { id: 'b', name: 'b', fluidReferenceId: water, meanTemperatureF: 77, pumpDischargeNodeId: 'd', pumpSuctionNodeId: 'u', nodes: [{ id: 'd', name: 'd' }, { id: 'u', name: 'u' }], sections: [section('t', 'terminal', 'd', 'u', 0, 1.049)], circuits: [{ id: 'A', name: 'A', state: 'active', terminalDesignGpm: 10, supplySectionIds: [], terminalSectionId: 't', returnSectionIds: [] }], margin: { percent: 0, categories: [], acknowledged: true } };
    expect(evaluateHydronicSystem(bypass).designEligible).toBe(false);
    const invalidId = evaluateHydronicSystem({ ...fixture(), id: 42 as never });
    expect(invalidId.designEligible).toBe(false); expect(invalidId.diagnostics.some((d) => d.code === 'invalid-input')).toBe(true);
  });
  it.each(['constructor', 'toString', '__proto__'])('supports reserved valid section IDs safely: %s', (id) => {
    const input = fixture(); const changed = { ...input, sections: input.sections.map((s) => s.id === 's0' ? { ...s, id } : s), circuits: input.circuits.map((c) => ({ ...c, supplySectionIds: c.supplySectionIds.map((s) => s === 's0' ? id : s) })) };
    const result = evaluateHydronicSystem(changed);
    expect(result.designEligible).toBe(true); expect(result.sectionFlowGpm[id]).toBe(30);
  });
  it('rejects malformed active state and non-Boolean margin acknowledgement without losing a final-output guard', () => {
    const typo = { ...fixture(), circuits: [{ ...fixture().circuits[0]!, state: 'actve' as never }, fixture().circuits[1]!] };
    expect(evaluateHydronicSystem(typo).designEligible).toBe(false);
    const margin = { ...fixture(), margin: { ...fixture().margin, acknowledged: 'false' as never } };
    expect(evaluateHydronicSystem(margin).governingHeadFt).toBeUndefined();
  });
});

describe('fail-closed numerical and row boundaries', () => {
  it('does not publish overflow or positive-flow-underflow pipe values', () => {
    const long = evaluateSectionLoss(section('p', 'supply', 'a', 'b', Number.MAX_VALUE, 1.049), 10, water, 77);
    expect(long.complete).toBe(false); expect(long.headFt).toBeUndefined(); expect(long.diagnostics.some((d) => d.code === 'numerical-failure')).toBe(true);
    const tiny = evaluateSectionLoss(section('p', 'supply', 'a', 'b', 100, 1.049), Number.MIN_VALUE, water, 77);
    expect(tiny.complete).toBe(false); expect(tiny.hydraulicState).toBeUndefined();
  });
  it('returns diagnostics rather than throwing for malformed/unknown loss rows and geometry', () => {
    const malformed = section('p', 'supply', 'a', 'b', 0, 1.049, [{ id: 'x', type: 'preset-equivalent-length', category: 'fitting', quantity: 1, presetId: 'missing' as never, basis: 'section-inside-diameter', applicability: { status: 'unconfirmed', statedEnvelope: 'draft' } } as LossElement]);
    const result = evaluateSectionLoss(malformed, 10, water, 77);
    expect(result.complete).toBe(false); expect(result.items[1]?.headFt).toBeUndefined(); expect(result.diagnostics.length).toBeGreaterThan(0);
    const badGeometry = { ...malformed, geometry: { kind: 'typo', actualInsideDiameterIn: 1.049, roughnessFt: .00015 } as never };
    expect(evaluateSectionLoss(badGeometry, 10, water, 77).complete).toBe(false);
    expect(() => resolvePipeGeometry({ kind: 'catalog', catalogId: 'steel-sch40-1', roughnessOverrideFt: null } as never)).toThrow();
  });
  it('rejects positive underflow instead of publishing a false zero and protects reporting/conversions', () => {
    const tiny = evaluateSectionLoss(section('tiny', 'supply', 'a', 'b', 100, 1.049), 1e-200, water, 77);
    expect(tiny.complete).toBe(false); expect(tiny.headFt).toBeUndefined(); expect(tiny.diagnostics.some((d) => d.code === 'numerical-failure')).toBe(true);
    expect(() => actualFluidPsiToHeadFt(1e308, 1e308)).toThrow();
    expect(() => headFtToActualFluidPsi(1e308, Number.MIN_VALUE)).toThrow();
    const normal = hydraulicState(10, { actualInsideDiameterIn: 1.049, roughnessFt: .00015 }, water, 77);
    expect(() => frictionHeadFtPer100Ft({ ...normal, flowGpm: -10, regime: 'typo' as never }, { actualInsideDiameterIn: 1.049, roughnessFt: .00015 })).toThrow();
  });
  it('keeps invalid pipe/category totals unavailable with diagnostics', () => {
    const badLength = evaluateSectionLoss(section('bad', 'supply', 'a', 'b', -1, 1.049), 10, water, 77);
    expect(badLength.items[0]?.headFt).toBeUndefined(); expect(badLength.categoryHeadFt.pipe).toBeUndefined();
    const rows = [confirmed('v', { type: 'direct-head', category: 'valve', quantity: 1, headFtOfSelectedFluid: 1e308 }, 10, 1.049), confirmed('e', { type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1e308 }, 10, 1.049)];
    const overflow = evaluateSectionLoss(section('overflow', 'supply', 'a', 'b', 0, 1.049, rows), 10, water, 77);
    expect(overflow.complete).toBe(false); expect(overflow.diagnostics.some((d) => d.code === 'numerical-failure')).toBe(true);
  });
  it('captures only primitive selected-type fields and isolates later mutation', () => {
    const raw = { id: 'k', type: 'k' as const, category: 'fitting' as const, quantity: 1, k: 0, basis: 'section-inside-diameter' as const, stale: 99, applicability: { status: 'unconfirmed' as const, statedEnvelope: 'manual' } } as LossElement;
    const basis = currentApplicabilityBasis(10, { actualInsideDiameterIn: 1.049, roughnessFt: .00015 }, water, 77, raw);
    (raw as { k: number }).k = 2;
    expect(basis.element).toEqual({ type: 'k', category: 'fitting', quantity: 1, k: 0, basis: 'section-inside-diameter' });
  });
});
