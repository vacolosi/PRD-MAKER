import { describe, expect, it } from 'vitest';
import { currentApplicabilityBasis, evaluateHydronicSystem, evaluateSectionLoss, frictionHeadFtPer100Ft, hydraulicState, type HydronicSystem, type LossElement, type LossElementData, type Section } from '../src/engine/index.js';

const water = 'iapws-liquid-water-sr6-08-2011' as const;
const pg50 = 'dowfrost-pg-50vol-2001-09' as const;
const geometry = { actualInsideDiameterIn: 1.049, roughnessFt: .00015 };
const margin0 = { percent: 0, categories: [], acknowledged: true } as const;
function draft(data: LossElementData, id = 'x'): LossElement { return { id, ...data, applicability: { status: 'unconfirmed', statedEnvelope: 'fixture' } } as LossElement; }
function confirmed(data: LossElementData, flow = 10, id = 'x', fluid: typeof water | typeof pg50 = water, temperature = 77): LossElement {
  const raw = draft(data, id); const confirmedAtBasis = currentApplicabilityBasis(flow, geometry, fluid, temperature, raw);
  return { ...raw, applicability: { status: 'confirmed', statedEnvelope: 'fixture', confirmedAtBasis } } as LossElement;
}
function section(id: string, role: Section['role'] = 'supply', elements: readonly LossElement[] = [], length = 0, from = 'a', to = 'b'): Section {
  return { id, name: id, role, fromNodeId: from, toNodeId: to, geometry: { kind: 'custom', ...geometry }, actualLengthFt: length, elements };
}
function oneCircuit(elements: readonly LossElement[], margin: HydronicSystem['margin'] = margin0, flow = 10): HydronicSystem {
  return { id: 'system', name: 'system', fluidReferenceId: water, meanTemperatureF: 77, pumpDischargeNodeId: 'd', pumpSuctionNodeId: 'u', nodes: ['d', 'a', 'b', 'u'].map((id) => ({ id, name: id })), sections: [section('s', 'supply', [], 0, 'd', 'a'), section('t', 'terminal', elements, 0, 'a', 'b'), section('r', 'return', [], 0, 'b', 'u')], circuits: [{ id: 'c', name: 'c', state: 'active', terminalDesignGpm: flow, supplySectionIds: ['s'], terminalSectionId: 't', returnSectionIds: ['r'] }], margin };
}
function twoPath(): any {
  const a = confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1 }, 10, 'a');
  const b = confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 2 }, 20, 'b');
  return { id: 'two', name: 'two', fluidReferenceId: water, meanTemperatureF: 77, pumpDischargeNodeId: 'd', pumpSuctionNodeId: 'u', nodes: ['d', 'split', 'ai', 'ao', 'bi', 'bo', 'merge', 'u'].map((id) => ({ id, name: id })), sections: [section('s0', 'supply', [], 0, 'd', 'split'), section('sa', 'supply', [], 0, 'split', 'ai'), section('ta', 'terminal', [a], 0, 'ai', 'ao'), section('ra', 'return', [], 0, 'ao', 'merge'), section('sb', 'supply', [], 0, 'split', 'bi'), section('tb', 'terminal', [b], 0, 'bi', 'bo'), section('rb', 'return', [], 0, 'bo', 'merge'), section('r0', 'return', [], 0, 'merge', 'u')], circuits: [{ id: 'A', name: 'A', state: 'active', terminalDesignGpm: 10, supplySectionIds: ['s0', 'sa'], terminalSectionId: 'ta', returnSectionIds: ['ra', 'r0'] }, { id: 'B', name: 'B', state: 'active', terminalDesignGpm: 20, supplySectionIds: ['s0', 'sb'], terminalSectionId: 'tb', returnSectionIds: ['rb', 'r0'] }], margin: margin0 };
}
function expectInvalidRow(result: ReturnType<typeof evaluateSectionLoss>, category: 'fitting' | 'valve' | 'equipment'): void {
  expect(result.items[1]?.headFt).toBeUndefined(); expect(result.items[1]?.pressureLossPsi).toBeUndefined();
  expect(result.categoryHeadFt[category]).toBeUndefined(); expect(result.headFt).toBeUndefined(); expect(result.pressureLossPsi).toBeUndefined();
  expect(result.diagnostics.some((d) => d.code === 'invalid-input' && d.location === 'section:p/element:x')).toBe(true);
}
function expectFinalBlocked(result: ReturnType<typeof evaluateHydronicSystem>): void {
  expect(result.designEligible).toBe(false); expect(result.rawGoverningCircuitIds).toEqual([]); expect(result.factoredGoverningCircuitIds).toEqual([]);
  expect(result.rawGoverningHeadFt).toBeUndefined(); expect(result.governingHeadFt).toBeUndefined(); expect(result.governingPressureLossPsi).toBeUndefined();
}

describe('C1 S1/S2 capture and unmasked invalid loss rows', () => {
  const bases: readonly LossElementData[] = [
    { type: 'k', category: 'fitting', quantity: 1, k: 1, basis: 'section-inside-diameter' },
    { type: 'equivalent-length', category: 'fitting', quantity: 1, equivalentLengthFt: 1, basis: 'section-inside-diameter' },
    { type: 'preset-equivalent-length', category: 'fitting', quantity: 1, presetId: 'doe-hdbk-1012-3-92-standard-90-elbow', basis: 'section-inside-diameter' },
    { type: 'cv', category: 'valve', quantity: 1, cv: 1 },
    { type: 'direct-psi', category: 'valve', quantity: 1, pressureLossPsi: 1 },
    { type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1 }
  ];
  it('S1 rejects invalid raw data at capture while retaining valid zero K and quantity', () => {
    for (const changed of [{ type: 'cv', category: 'fitting', quantity: 1, cv: 1 }, { type: 'k', category: 'fitting', quantity: .5, k: 1, basis: 'section-inside-diameter' }, { type: 'cv', category: 'valve', quantity: 1, cv: null }, { type: 'k', category: 'fitting', quantity: 1, k: 1, basis: 'wrong' }] as const) expect(() => currentApplicabilityBasis(10, geometry, water, 77, draft(changed as never))).toThrow('Cannot capture applicability basis');
    for (const valid of [{ type: 'cv', category: 'valve', quantity: 1, cv: 1 }, { type: 'k', category: 'fitting', quantity: 0, k: 1, basis: 'section-inside-diameter' }, { type: 'k', category: 'fitting', quantity: 1, k: 0, basis: 'section-inside-diameter' }] as const) expect(() => currentApplicabilityBasis(10, geometry, water, 77, draft(valid))).not.toThrow();
  });
  it('S2 reaches the shared invalid-input guard for every type/category/quantity mutation', () => {
    const forbidden = ['pipe', 'pipe', 'valve', 'fitting', 'fitting', 'fitting'] as const;
    for (const [index, data] of bases.entries()) {
      const invalidCategory = { ...confirmed(data), category: forbidden[index] } as LossElement;
      expectInvalidRow(evaluateSectionLoss(section('p', 'supply', [invalidCategory], 0), 10, water, 77), data.type === 'direct-head' ? 'equipment' : data.type === 'cv' || data.type === 'direct-psi' ? 'valve' : 'fitting');
      for (const category of [undefined, 'unknown'] as const) expectInvalidRow(evaluateSectionLoss(section('p', 'supply', [{ ...confirmed(data), category } as unknown as LossElement], 0), 10, water, 77), data.category);
      for (const quantity of [-1, .5, NaN, Infinity, null, '1'] as const) {
        const invalidQuantity = { ...confirmed(data), quantity } as LossElement;
        expectInvalidRow(evaluateSectionLoss(section('p', 'supply', [invalidQuantity], 0), 10, water, 77), data.category);
      }
    }
  });
  it('S2 keeps coefficient and basis mutations independent and contains malformed system rows', () => {
    const mutations: readonly [LossElementData, object, 'fitting' | 'valve' | 'equipment'][] = [
      [bases[0]!, { k: null }, 'fitting'], [bases[1]!, { equivalentLengthFt: -1 }, 'fitting'], [bases[2]!, { presetId: 'missing' }, 'fitting'], [bases[3]!, { cv: 0 }, 'valve'], [bases[4]!, { pressureLossPsi: '1' }, 'valve'], [bases[5]!, { headFtOfSelectedFluid: Infinity }, 'equipment'], [bases[0]!, { basis: 'wrong' }, 'fitting'], [bases[0]!, { type: 'unknown' }, 'fitting'], [bases[1]!, { basis: 'wrong' }, 'fitting'], [bases[2]!, { basis: 'wrong' }, 'fitting'], [bases[0]!, { k: -1 }, 'fitting'], [bases[4]!, { pressureLossPsi: -1 }, 'valve'], [bases[5]!, { headFtOfSelectedFluid: -1 }, 'equipment']
    ];
    for (const [data, mutation, category] of mutations) expectInvalidRow(evaluateSectionLoss(section('p', 'supply', [{ ...confirmed(data), ...mutation } as LossElement], 0), 10, water, 77), category);
    for (const data of bases) { const coefficient = data.type === 'k' ? { k: undefined } : data.type === 'equivalent-length' ? { equivalentLengthFt: undefined } : data.type === 'preset-equivalent-length' ? { presetId: undefined } : data.type === 'cv' ? { cv: undefined } : data.type === 'direct-psi' ? { pressureLossPsi: undefined } : { headFtOfSelectedFluid: undefined }; const r = evaluateSectionLoss(section('p', 'supply', [{ ...confirmed(data), quantity: 0, ...coefficient } as LossElement], 0), 10, water, 77); expectInvalidRow(r, data.category); }
    const malformed = { ...confirmed(bases[3]!), category: 'fitting' } as LossElement; expect(() => evaluateHydronicSystem(oneCircuit([malformed]))).not.toThrow(); expectFinalBlocked(evaluateHydronicSystem(oneCircuit([malformed])));
  });
});

describe('C2 S3 section conversion, reporting, and aggregation', () => {
  it('contains Cv scaling and final direct-head conversion failures', () => {
    const cv = evaluateSectionLoss(section('p', 'supply', [confirmed({ type: 'cv', category: 'valve', quantity: 1e100, cv: 1e200 })], 0), 10, water, 77); expect(cv.complete).toBe(false); expectInvalidNumerical(cv, 'valve');
    const direct = evaluateSectionLoss(section('p', 'supply', [confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: Number.MIN_VALUE })], 0), 10, water, 77); expect(direct.complete).toBe(false); expectInvalidNumerical(direct, 'equipment');
  });
  it('contains section reporter overflow and independently validates reporter domains', () => {
    const overflow = evaluateSectionLoss(section('p', 'supply', [], 100), 1e200, water, 77); expect(overflow.hydraulicState).toBeDefined(); expect(overflow.frictionHeadFtPer100Ft).toBeUndefined(); expect(overflow.categoryHeadFt.pipe).toBeUndefined(); expect(overflow.headFt).toBeUndefined(); expect(overflow.diagnostics.some((d) => d.code === 'numerical-failure' && d.location === 'section:p')).toBe(true);
    const normal = hydraulicState(10, geometry, water, 77); expect(frictionHeadFtPer100Ft(normal, geometry)).toBeCloseTo(6.634316015514317, 10); expect(frictionHeadFtPer100Ft(hydraulicState(0, geometry, water, 77), geometry)).toBe(0); const transition = hydraulicState(.9, geometry, water, 77); expect(transition.regime).toBe('transition'); expect(transition.reynoldsNumber).toBeGreaterThan(2000); expect(transition.reynoldsNumber).toBeLessThan(4000); expect(frictionHeadFtPer100Ft(transition, geometry)).toBeUndefined();
    for (const changed of [{ flowGpm: -1 }, { velocityFtS: Infinity }, { reynoldsNumber: NaN }, { densityKgM3: 0 }, { dynamicViscosityPaS: 0 }, { darcyFrictionFactor: 0 }, { regime: 'bad' }]) expect(() => frictionHeadFtPer100Ft({ ...normal, ...changed } as never, geometry)).toThrow();
  });
  it('diagnoses individually finite same-category overflow and preserves actual-fluid direct head', () => {
    const rows = [confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1e308 }, 10, 'one'), confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1e308 }, 10, 'two')]; const aggregate = evaluateSectionLoss(section('p', 'supply', rows, 0), 10, water, 77); expect(aggregate.items[1]?.headFt).toBe(1e308); expect(aggregate.items[2]?.headFt).toBe(1e308); expect(aggregate.categoryHeadFt.equipment).toBeUndefined(); expect(aggregate.complete).toBe(false); expect(aggregate.headFt).toBeUndefined(); expect(aggregate.pressureLossPsi).toBeUndefined(); expect(aggregate.diagnostics.some((d) => d.code === 'numerical-failure' && d.location === 'section:p')).toBe(true);
    const glycol = evaluateSectionLoss(section('p', 'supply', [confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 8 }, 10, 'pg', pg50, 30)], 0), 10, pg50, 30); expect(glycol.items[1]?.headFt).toBe(8); expect(glycol.items[1]?.pressureLossPsi).toBeCloseTo(3.6566666666666667, 10); expect(glycol.items[1]?.pressureLossPsi).not.toBeCloseTo(3.4579784247268464, 8);
  });
});
function expectInvalidNumerical(result: ReturnType<typeof evaluateSectionLoss>, category: 'valve' | 'equipment'): void { expect(result.items[1]?.headFt).toBeUndefined(); expect(result.items[1]?.pressureLossPsi).toBeUndefined(); expect(result.categoryHeadFt[category]).toBeUndefined(); expect(result.headFt).toBeUndefined(); expect(result.pressureLossPsi).toBeUndefined(); expect(result.diagnostics.some((d) => d.code === 'numerical-failure' && d.location === 'section:p/element:x')).toBe(true); }

describe('C3 F1/F2 circuit arithmetic layers', () => {
  it('F1 diagnoses finite selected margin values whose declared-order base overflows', () => {
    const rows = [confirmed({ type: 'k', category: 'fitting', quantity: 1, k: 1.0492622061220577e308, basis: 'section-inside-diameter' }, 20, 'fit'), confirmed({ type: 'direct-head', category: 'valve', quantity: 1, headFtOfSelectedFluid: 8.988465674311579e307 }, 20, 'valve'), confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1.5e292 }, 20, 'equipment')];
    const result = evaluateHydronicSystem(oneCircuit(rows, { percent: 1e-300, categories: ['equipment', 'fitting', 'valve'], acknowledged: true }, 20)); expect(result.sections.t?.complete).toBe(true); expect(result.circuits[0]?.categoryHeadFt).toMatchObject({ fitting: 8.988465674311578e307, valve: 8.988465674311579e307, equipment: 1.5e292 }); expect(result.circuits[0]?.rawHeadFt).toBeUndefined(); expectFinalBlocked(result); expect(result.diagnostics.some((d) => d.code === 'numerical-failure' && d.location === 'circuit:c')).toBe(true);
  });
  it('keeps circuit series, cross-category, margin-increment, and factored-total overflow layers separate', () => {
    const series = twoSectionCircuit([{ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 9e307 }, { type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 9e307 }], margin0); const cross = twoSectionCircuit([{ type: 'direct-head', category: 'valve', quantity: 1, headFtOfSelectedFluid: 9e307 }, { type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 9e307 }], margin0); const increment = oneCircuit([confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1e308 })], { percent: 10000, categories: ['equipment'], acknowledged: true }); const factored = oneCircuit([confirmed({ type: 'direct-head', category: 'equipment', quantity: 1, headFtOfSelectedFluid: 1.79e308 })], { percent: 1, categories: ['equipment'], acknowledged: true });
    const seriesResult = evaluateHydronicSystem(series), crossResult = evaluateHydronicSystem(cross), incrementResult = evaluateHydronicSystem(increment), factoredResult = evaluateHydronicSystem(factored);
    expect(seriesResult.circuits[0]?.categoryHeadFt.equipment).toBeUndefined(); expect(seriesResult.diagnostics.some((d) => d.message === 'Circuit category series total is not representable.' && d.location === 'circuit:c')).toBe(true);
    expect(crossResult.circuits[0]?.categoryHeadFt.fitting).toBe(0); expect(crossResult.circuits[0]?.categoryHeadFt.valve).toBe(9e307); expect(crossResult.circuits[0]?.categoryHeadFt.equipment).toBe(9e307); expect(crossResult.diagnostics.some((d) => d.message === 'Circuit category total is not representable.' && d.location === 'circuit:c')).toBe(true);
    expect(incrementResult.circuits[0]?.categoryHeadFt.equipment).toBe(1e308); expect(incrementResult.diagnostics.some((d) => d.message === 'Margin increment is not representable.' && d.location === 'circuit:c')).toBe(true);
    expect(factoredResult.circuits[0]?.categoryHeadFt.equipment).toBe(1.79e308); expect(factoredResult.diagnostics.some((d) => d.message === 'Factored circuit head is not representable.' && d.location === 'circuit:c')).toBe(true);
    for (const result of [seriesResult, crossResult, incrementResult, factoredResult]) { expectFinalBlocked(result); expect(result.diagnostics.some((d) => d.code === 'numerical-failure' && d.location === 'circuit:c')).toBe(true); }
  });
});
function twoSectionCircuit(data: readonly [LossElementData, LossElementData], margin: HydronicSystem['margin']): HydronicSystem { const first = confirmed(data[0], 10, 'first'), second = confirmed(data[1], 10, 'second'); const s = oneCircuit([], margin); return { ...s, sections: [section('s', 'supply', [first], 0, 'd', 'a'), section('t', 'terminal', [second], 0, 'a', 'b'), section('r', 'return', [], 0, 'b', 'u')] }; }

describe('C4 F2 locally continuous global topology diagnostics', () => {
  it.each([
    ['supply merge', (s: any) => { s.sections.find((x: any) => x.id === 'sb').toNodeId = 'ai'; s.sections.find((x: any) => x.id === 'tb').fromNodeId = 'ai'; }, 'Supply topology has a merge/cross-mesh.', 'circuit:B'],
    ['return split', (s: any) => { s.sections.find((x: any) => x.id === 'tb').toNodeId = 'ao'; s.sections.find((x: any) => x.id === 'rb').fromNodeId = 'ao'; }, 'Return topology has a split/cross-mesh.', 'circuit:B'],
    ['supply return mixing', (s: any) => { s.sections.find((x: any) => x.id === 'rb').toNodeId = 'ai'; s.sections.push(section('rbi', 'return', [], 0, 'ai', 'u')); s.circuits[1].returnSectionIds = ['rb', 'rbi']; }, 'Supply and return routing may not mix at one node.', 'node:ai'],
    ['repeated node boundary', (s: any) => { s.sections.push(section('loop', 'supply', [], 0, 'ai', 'split')); s.sections.find((x: any) => x.id === 'ta').fromNodeId = 'split'; s.circuits[0].supplySectionIds = ['s0', 'sa', 'loop']; }, 'Circuit path revisits a node or pump boundary.', 'circuit:A']
  ])('rejects intended %s guard rather than incidental discontinuity', (_name, mutate, message, location) => { const input = twoPath(); mutate(input); const result = evaluateHydronicSystem(input); expectFinalBlocked(result); expect(result.diagnostics.some((d) => d.message === message && d.location === location)).toBe(true); });
  it('asserts repeated section and terminal reuse by their own guards', () => { const repeated = twoPath(); repeated.circuits[0].supplySectionIds = ['s0', 's0']; expect(evaluateHydronicSystem(repeated).diagnostics.some((d) => d.message === 'A circuit may not repeat a section.' && d.location === 'circuit:A')).toBe(true); const reused = twoPath(); reused.circuits[1].terminalSectionId = 'ta'; reused.circuits[1].supplySectionIds = ['s0', 'sa']; reused.circuits[1].returnSectionIds = ['ra', 'r0']; expect(evaluateHydronicSystem(reused).diagnostics.some((d) => d.message.includes('Terminal section is already used') && d.location === 'circuit:B')).toBe(true); });
});

describe('C5 F2 independent demand, membership, and output gates', () => {
  it.each([['unknown state', (s: any) => { s.circuits[1].state = 'unknown'; }], ['null circuit', (s: any) => { s.circuits[1] = null; }]])('withholds demand and unused classification for %s independently', (_name, mutate) => { const input = twoPath(); mutate(input); const result = evaluateHydronicSystem(input); expect(result.activeTerminalFlowGpm).toBeUndefined(); expect(result.topology.unusedSectionIds).toEqual([]); expectFinalBlocked(result); });
  it('withholds every category on early topology failure but retains determinate malformed-path demand', () => { const input = twoPath(); input.circuits[1].terminalSectionId = 'missing'; const result = evaluateHydronicSystem(input); expect(result.activeTerminalFlowGpm).toBe(30); expectFinalBlocked(result); for (const circuit of result.circuits) expect(Object.values(circuit.categoryHeadFt)).toEqual([undefined, undefined, undefined, undefined]); expect(result.sectionFlowGpm).toEqual(Object.create(null)); });
  it.each([-1, NaN, Infinity])('rejects isolated invalid demand %s', (demand) => { const input = twoPath(); input.circuits[1].terminalDesignGpm = demand; const result = evaluateHydronicSystem(input); expect(result.activeTerminalFlowGpm).toBeUndefined(); expectFinalBlocked(result); });
  it('reports genuinely unused inventory without hydraulically evaluating it', () => { const input = twoPath(); input.sections.push(section('unused', 'supply', [], 0, 'd', 'split')); const result = evaluateHydronicSystem(input); expect(result.designEligible).toBe(true); expect(result.topology.unusedSectionIds).toEqual(['unused']); expect(result.sections.unused).toBeUndefined(); expect(result.sectionFlowGpm.unused).toBeUndefined(); });
});

describe('C6 F2 safe runtime containers and reserved keys', () => {
  it.each(['constructor', 'toString', '__proto__'])('keeps a reserved circuit-local diagnostic own and JSON-safe: %s', (id) => { const input = twoPath(); input.circuits[1] = { ...input.circuits[1], id, terminalSectionId: 'missing' }; const result = evaluateHydronicSystem(input); expectFinalBlocked(result); expect(Object.prototype.hasOwnProperty.call(result.topology.circuitDiagnostics, id)).toBe(true); expect(result.topology.circuitDiagnostics[id]?.some((d: any) => d.location === `circuit:${id}` && d.message === 'Circuit references an unknown section.')).toBe(true); expect(JSON.parse(JSON.stringify(result)).topology.circuitDiagnostics[id].length).toBeGreaterThan(0); });
  it.each([{ toString: null }, { toString: 42 }])('contains malformed circuit IDs without a runtime throw: %j', (id) => { const input = twoPath(); input.circuits[1] = { ...input.circuits[1], id }; expect(() => evaluateHydronicSystem(input)).not.toThrow(); const result = evaluateHydronicSystem(input); expectFinalBlocked(result); expect(result.activeTerminalFlowGpm).toBe(30); for (const sectionId of ['sb', 'tb', 'rb']) expect(result.topology.unusedSectionIds).not.toContain(sectionId); expect(result.diagnostics.some((d) => d.code === 'invalid-input' && d.location === 'circuit')).toBe(true); });
  it.each([42, null, ''])('rejects invalid system IDs on otherwise-valid systems: %j', (id) => { const result = evaluateHydronicSystem({ ...twoPath(), id }); expectFinalBlocked(result); expect(result.activeTerminalFlowGpm).toBeUndefined(); expect(result.diagnostics.some((d) => d.location === 'system')).toBe(true); });
  it('contains malformed path, margin, elements, applicability, and raw numeric containers without coercion', () => { const mutations: readonly ((s: any) => void)[] = [(s) => { s.circuits[0].returnSectionIds = null; }, (s) => { s.margin = null; }, (s) => { s.sections[0].elements = null; }, (s) => { s.sections[2].elements[0].applicability = null; }, (s) => { s.circuits[0].terminalDesignGpm = '10'; }, (s) => { s.sections[0].actualLengthFt = null; }]; for (const mutate of mutations) { const input = twoPath(); mutate(input); expect(() => evaluateHydronicSystem(input)).not.toThrow(); expectFinalBlocked(evaluateHydronicSystem(input)); } });
});
