import { isFluidReferenceId, isLossCategory } from './applicability.js';
import type { Circuit, Diagnostic, HydronicSystem, LossCategory, Section } from './contract.js';
import { evaluateSectionLoss, headFtToActualFluidPsi, type SectionLossResult } from './hydraulics.js';

const categories = ['pipe', 'fitting', 'valve', 'equipment'] as const;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const topo = (message: string, location?: string): Diagnostic => location ? { code: 'topology-error', message, location } : { code: 'topology-error', message };
const invalid = (message: string, location?: string): Diagnostic => location ? { code: 'invalid-input', message, location } : { code: 'invalid-input', message };
const numerical = (message: string, location?: string): Diagnostic => location ? { code: 'numerical-failure', message, location } : { code: 'numerical-failure', message };
const own = <T>(): Record<string, T> => Object.create(null) as Record<string, T>;
function emptyCategories(value: number | undefined): Record<LossCategory, number | undefined> { return { pipe: value, fitting: value, valve: value, equipment: value }; }
function validId(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
function validIdArray(value: unknown): value is readonly string[] { return Array.isArray(value) && value.every(validId); }
function sum(values: readonly number[]): number | undefined { const result = values.reduce((a, b) => a + b, 0); return finite(result) && result >= 0 ? result : undefined; }

export interface CircuitLossResult { readonly circuitId: string; readonly terminalDesignGpm: number; readonly sectionIds: readonly string[]; readonly sections: readonly SectionLossResult[]; readonly categoryHeadFt: Readonly<Record<LossCategory, number | undefined>>; readonly rawHeadFt: number | undefined; readonly marginHeadFt: number | undefined; readonly factoredHeadFt: number | undefined; readonly pressureLossPsi: number | undefined; readonly complete: boolean; readonly diagnostics: readonly Diagnostic[]; }
export interface TopologyValidation { readonly diagnostics: readonly Diagnostic[]; readonly validCircuitIds: readonly string[]; readonly circuitDiagnostics: Readonly<Record<string, readonly Diagnostic[]>>; readonly unusedSectionIds: readonly string[]; }
export interface SystemLossResult { readonly systemId: string; readonly activeTerminalFlowGpm: number | undefined; readonly sectionFlowGpm: Readonly<Record<string, number>>; readonly sections: Readonly<Record<string, SectionLossResult>>; readonly circuits: readonly CircuitLossResult[]; readonly rawGoverningCircuitIds: readonly string[]; readonly factoredGoverningCircuitIds: readonly string[]; readonly rawGoverningHeadFt: number | undefined; readonly governingHeadFt: number | undefined; readonly governingPressureLossPsi: number | undefined; readonly designEligible: boolean; readonly diagnostics: readonly Diagnostic[]; readonly topology: TopologyValidation; }

function addCircuitDiagnostic(target: Record<string, Diagnostic[]>, id: string, message: string, code: 'topology-error' | 'invalid-input' = 'topology-error'): void { const rows = target[id] ?? (target[id] = []); rows.push(code === 'topology-error' ? topo(message, `circuit:${id}`) : invalid(message, `circuit:${id}`)); }
function circuitPath(circuit: Circuit): readonly string[] { return [...circuit.supplySectionIds, circuit.terminalSectionId, ...circuit.returnSectionIds]; }

/** Validates runtime shape plus the bounded acyclic split-supply/merge-return topology. */
export function validateHydronicTopology(system: HydronicSystem): TopologyValidation {
  const diagnostics: Diagnostic[] = [], byCircuit = own<Diagnostic[]>();
  if (!object(system) || !Array.isArray(system.nodes) || !Array.isArray(system.sections) || !Array.isArray(system.circuits)) return { diagnostics: [invalid('System nodes, sections, and circuits must be arrays.', 'system')], validCircuitIds: [], circuitDiagnostics: byCircuit, unusedSectionIds: [] };
  const nodeIds = new Set<string>();
  for (const node of system.nodes) { if (!object(node) || !validId(node.id)) { diagnostics.push(invalid('Node ID must be a nonempty string.', 'node')); continue; } if (nodeIds.has(node.id)) diagnostics.push(topo('Node IDs must be unique.', `node:${node.id}`)); nodeIds.add(node.id); }
  if (!validId(system.pumpDischargeNodeId) || !validId(system.pumpSuctionNodeId) || system.pumpDischargeNodeId === system.pumpSuctionNodeId || !nodeIds.has(system.pumpDischargeNodeId) || !nodeIds.has(system.pumpSuctionNodeId)) diagnostics.push(topo('Pump discharge and suction must be distinct known node IDs.', 'system'));
  const sections = new Map<string, Section>();
  for (const raw of system.sections) {
    if (!object(raw) || !validId(raw.id)) { diagnostics.push(invalid('Section must have a nonempty string ID.', 'section')); continue; }
    const section = raw as unknown as Section;
    if (sections.has(section.id)) diagnostics.push(topo('Section IDs must be unique.', `section:${section.id}`)); else sections.set(section.id, section);
    if (section.role !== 'supply' && section.role !== 'terminal' && section.role !== 'return') diagnostics.push(invalid('Section role must be supply, terminal, or return.', `section:${section.id}`));
    if (!validId(section.fromNodeId) || !validId(section.toNodeId) || !nodeIds.has(section.fromNodeId) || !nodeIds.has(section.toNodeId) || section.fromNodeId === section.toNodeId) diagnostics.push(topo('Section endpoints must be known distinct node IDs.', `section:${section.id}`));
  }
  const allReferencedByActive = new Set<string>(); const active: Circuit[] = []; const circuitIds = new Set<string>();
  let membershipIndeterminate = false;
  for (const raw of system.circuits) {
    if (!object(raw)) { diagnostics.push(invalid('Circuit must be an object.', 'circuit')); membershipIndeterminate = true; continue; }
    // Preserve every individually valid reference before rejecting another malformed field.
    if (raw.state === 'active') { if (Array.isArray(raw.supplySectionIds)) { for (const id of raw.supplySectionIds) if (validId(id)) allReferencedByActive.add(id); if (!validIdArray(raw.supplySectionIds)) membershipIndeterminate = true; } else membershipIndeterminate = true; if (validId(raw.terminalSectionId)) allReferencedByActive.add(raw.terminalSectionId); else membershipIndeterminate = true; if (Array.isArray(raw.returnSectionIds)) { for (const id of raw.returnSectionIds) if (validId(id)) allReferencedByActive.add(id); if (!validIdArray(raw.returnSectionIds)) membershipIndeterminate = true; } else membershipIndeterminate = true; }
    if (!validId(raw.id)) { diagnostics.push(invalid('Circuit must have a nonempty string ID.', 'circuit')); membershipIndeterminate = true; continue; }
    const circuit = raw as unknown as Circuit;
    if (circuitIds.has(circuit.id)) diagnostics.push(topo('Circuit IDs must be unique.', `circuit:${circuit.id}`)); circuitIds.add(circuit.id);
    if (circuit.state !== 'active' && circuit.state !== 'draft') { diagnostics.push(invalid('Circuit state must be exactly active or draft.', `circuit:${circuit.id}`)); membershipIndeterminate = true; continue; }
    if (circuit.state === 'active') { active.push(circuit); if (!(validIdArray(circuit.supplySectionIds) && validId(circuit.terminalSectionId) && validIdArray(circuit.returnSectionIds))) addCircuitDiagnostic(byCircuit, circuit.id, 'Active circuit path arrays and IDs are malformed.', 'invalid-input'); }
  }
  const unusedSectionIds = membershipIndeterminate ? [] : [...sections.keys()].filter((id) => !allReferencedByActive.has(id));
  const terminalOwners = new Map<string, string>(); const localCandidates: Circuit[] = [];
  for (const circuit of active) {
    let good = true;
    if (!finite(circuit.terminalDesignGpm) || circuit.terminalDesignGpm <= 0) { addCircuitDiagnostic(byCircuit, circuit.id, 'Active terminal demand must be finite and positive.', 'invalid-input'); good = false; }
    if (!validIdArray(circuit.supplySectionIds) || !validId(circuit.terminalSectionId) || !validIdArray(circuit.returnSectionIds)) { addCircuitDiagnostic(byCircuit, circuit.id, 'Active circuit path arrays and IDs are malformed.', 'invalid-input'); continue; }
    const ids = circuitPath(circuit); if (new Set(ids).size !== ids.length) { addCircuitDiagnostic(byCircuit, circuit.id, 'A circuit may not repeat a section.', 'topology-error'); good = false; }
    const pathSections = ids.map((id) => sections.get(id)); if (pathSections.some((section) => !section)) { addCircuitDiagnostic(byCircuit, circuit.id, 'Circuit references an unknown section.'); good = false; }
    const supply = circuit.supplySectionIds.map((id) => sections.get(id)).filter((v): v is Section => v !== undefined), terminal = sections.get(circuit.terminalSectionId), returns = circuit.returnSectionIds.map((id) => sections.get(id)).filter((v): v is Section => v !== undefined);
    if (supply.some((s) => s.role !== 'supply') || !terminal || terminal.role !== 'terminal' || returns.some((s) => s.role !== 'return')) { addCircuitDiagnostic(byCircuit, circuit.id, 'Circuit roles must be supply, one terminal, then return.'); good = false; }
    const nodes: string[] = [system.pumpDischargeNodeId]; let previous = system.pumpDischargeNodeId;
    for (const s of supply) { if (s.fromNodeId !== previous) { addCircuitDiagnostic(byCircuit, circuit.id, 'Supply sections are not continuous from discharge.'); good = false; break; } previous = s.toNodeId; nodes.push(previous); }
    if (terminal) { if (terminal.fromNodeId !== previous) { addCircuitDiagnostic(byCircuit, circuit.id, 'Terminal section is not continuous with supply.'); good = false; } if (terminal.fromNodeId === system.pumpDischargeNodeId && terminal.toNodeId === system.pumpSuctionNodeId) { addCircuitDiagnostic(byCircuit, circuit.id, 'Terminal section may not bypass pump discharge directly to suction.'); good = false; } previous = terminal.toNodeId; nodes.push(previous); }
    for (const s of returns) { if (s.fromNodeId !== previous) { addCircuitDiagnostic(byCircuit, circuit.id, 'Return sections are not continuous from terminal.'); good = false; break; } previous = s.toNodeId; nodes.push(previous); }
    if (previous !== system.pumpSuctionNodeId) { addCircuitDiagnostic(byCircuit, circuit.id, 'Return sections do not terminate at suction.'); good = false; }
    if (new Set(nodes).size !== nodes.length) { addCircuitDiagnostic(byCircuit, circuit.id, 'Circuit path revisits a node or pump boundary.'); good = false; }
    if (nodes.slice(1, -1).includes(system.pumpDischargeNodeId) || nodes.slice(1, -1).includes(system.pumpSuctionNodeId)) { addCircuitDiagnostic(byCircuit, circuit.id, 'Pump boundaries may not appear inside a circuit path.'); good = false; }
    if (terminal) { const owner = terminalOwners.get(terminal.id); if (owner) { addCircuitDiagnostic(byCircuit, circuit.id, `Terminal section is already used by active circuit ${owner}.`); good = false; } else terminalOwners.set(terminal.id, circuit.id); }
    if (good) localCandidates.push(circuit);
  }
  const supplyIncoming = new Map<string, string>(), returnOutgoing = new Map<string, string>(), supplyNodes = new Set<string>(), returnNodes = new Set<string>();
  for (const circuit of localCandidates) {
    for (const id of circuit.supplySectionIds) { const s = sections.get(id)!; supplyNodes.add(s.fromNodeId); supplyNodes.add(s.toNodeId); if (s.toNodeId === system.pumpDischargeNodeId || s.fromNodeId === system.pumpSuctionNodeId) addCircuitDiagnostic(byCircuit, circuit.id, 'Supply tree violates pump root boundary.'); const old = supplyIncoming.get(s.toNodeId); if (old && old !== id) addCircuitDiagnostic(byCircuit, circuit.id, 'Supply topology has a merge/cross-mesh.'); else supplyIncoming.set(s.toNodeId, id); }
    for (const id of circuit.returnSectionIds) { const s = sections.get(id)!; returnNodes.add(s.fromNodeId); returnNodes.add(s.toNodeId); if (s.fromNodeId === system.pumpSuctionNodeId || s.toNodeId === system.pumpDischargeNodeId) addCircuitDiagnostic(byCircuit, circuit.id, 'Return tree violates pump sink boundary.'); const old = returnOutgoing.get(s.fromNodeId); if (old && old !== id) addCircuitDiagnostic(byCircuit, circuit.id, 'Return topology has a split/cross-mesh.'); else returnOutgoing.set(s.fromNodeId, id); }
  }
  for (const node of supplyNodes) if (returnNodes.has(node)) diagnostics.push(topo('Supply and return routing may not mix at one node.', `node:${node}`));
  const candidateIds = localCandidates.filter((c) => (byCircuit[c.id] ?? []).length === 0).map((c) => c.id);
  // A topology with any active-path/global error has no authoritative valid subnetwork.
  const validCircuitIds = diagnostics.length === 0 && candidateIds.length === active.length ? candidateIds : [];
  return { diagnostics, validCircuitIds, circuitDiagnostics: byCircuit, unusedSectionIds };
}

function marginDiagnostic(raw: unknown): Diagnostic | undefined {
  if (!object(raw) || !finite(raw.percent) || (raw.percent as number) < 0 || typeof raw.acknowledged !== 'boolean' || !Array.isArray(raw.categories) || !raw.categories.every(isLossCategory)) return invalid('Margin requires finite nonnegative percent, valid categories, and Boolean acknowledgement.', 'margin');
  if (!raw.acknowledged) return invalid('Margin acknowledgement is required, including explicit zero.', 'margin');
  if (new Set(raw.categories).size !== raw.categories.length) return invalid('Margin categories must be deduplicated.', 'margin');
  return undefined;
}
function emptyResult(systemId: string, topology: TopologyValidation, diagnostics: readonly Diagnostic[], activeFlow: number | undefined, circuits: readonly CircuitLossResult[] = []): SystemLossResult { return { systemId, activeTerminalFlowGpm: activeFlow, sectionFlowGpm: own<number>(), sections: own<SectionLossResult>(), circuits, rawGoverningCircuitIds: [], factoredGoverningCircuitIds: [], rawGoverningHeadFt: undefined, governingHeadFt: undefined, governingPressureLossPsi: undefined, designEligible: false, diagnostics, topology }; }

/** Evaluates known terminal flows. Any invalid active topology blocks hydraulic evaluation rather than deriving a reduced operating basis. */
export function evaluateHydronicSystem(system: HydronicSystem): SystemLossResult {
  const suppliedSystemId = object(system) ? system.id : undefined; const systemId = validId(suppliedSystemId) ? suppliedSystemId : 'invalid-system'; const topology = validateHydronicTopology(system); const diagnostics: Diagnostic[] = [...topology.diagnostics, ...Object.values(topology.circuitDiagnostics).flat()];
  if (!validId(suppliedSystemId) || !object(system) || !Array.isArray(system.circuits) || !Array.isArray(system.sections) || !isFluidReferenceId(system.fluidReferenceId) || !finite(system.meanTemperatureF)) return emptyResult(systemId, topology, [...diagnostics, invalid('System ID, shape, fluid reference, or temperature is invalid.', 'system')], undefined);
  const indeterminateCircuit = system.circuits.some((raw) => !object(raw) || (raw.state !== 'active' && raw.state !== 'draft'));
  const active = system.circuits.filter((raw): raw is Circuit => object(raw) && raw.state === 'active') as Circuit[];
  const activeFlow = !indeterminateCircuit && active.length && active.every((c) => finite(c.terminalDesignGpm) && c.terminalDesignGpm > 0) ? sum(active.map((c) => c.terminalDesignGpm)) : undefined;
  if (active.length === 0) diagnostics.push(topo('No active circuits exist; no governing design result is available.', 'system'));
  if (activeFlow === undefined && active.length > 0) diagnostics.push(invalid('Active terminal demand total is unavailable because a demand is invalid or unrepresentable.', 'system'));
  const margin = marginDiagnostic(system.margin); if (margin) diagnostics.push(margin);
  const topologyInvalid = topology.diagnostics.length > 0 || active.some((c) => !validId(c.id) || (topology.circuitDiagnostics[c.id] ?? []).length > 0) || topology.validCircuitIds.length !== active.length;
  if (topologyInvalid || activeFlow === undefined || active.length === 0) return emptyResult(systemId, topology, diagnostics, activeFlow, active.map((c) => ({ circuitId: validId(c.id) ? c.id : 'invalid-circuit', terminalDesignGpm: finite(c.terminalDesignGpm) ? c.terminalDesignGpm : NaN, sectionIds: validIdArray(c.supplySectionIds) && validId(c.terminalSectionId) && validIdArray(c.returnSectionIds) ? circuitPath(c) : [], sections: [], categoryHeadFt: emptyCategories(undefined), rawHeadFt: undefined, marginHeadFt: undefined, factoredHeadFt: undefined, pressureLossPsi: undefined, complete: false, diagnostics: validId(c.id) ? [...(topology.circuitDiagnostics[c.id] ?? [])] : [invalid('Circuit ID must be a nonempty string.', 'circuit')] })));
  const byId = new Map<string, Section>(); for (const raw of system.sections) if (object(raw) && validId(raw.id)) byId.set(raw.id, raw as unknown as Section);
  const flows = own<number>();
  for (const circuit of active) for (const id of circuitPath(circuit)) { const next = (flows[id] ?? 0) + circuit.terminalDesignGpm; if (!finite(next) || next <= 0) { diagnostics.push(numerical('Shared section flow is not representable.', `section:${id}`)); } else flows[id] = next; }
  if (diagnostics.some((d) => d.code === 'numerical-failure')) return emptyResult(systemId, topology, diagnostics, activeFlow);
  const sectionResults = own<SectionLossResult>(); for (const [id, flow] of Object.entries(flows)) { const section = byId.get(id); if (!section) { diagnostics.push(topo('Active path references a missing section.', `section:${id}`)); continue; } sectionResults[id] = evaluateSectionLoss(section, flow, system.fluidReferenceId, system.meanTemperatureF); }
  const circuitResults: CircuitLossResult[] = active.map((circuit) => {
    const ids = circuitPath(circuit), sections = ids.map((id) => sectionResults[id]).filter((s): s is SectionLossResult => s !== undefined), rowDiagnostics = sections.flatMap((s) => s.diagnostics);
    const categoryHeadFt = emptyCategories(undefined); for (const category of categories) { const values = sections.map((s) => s.categoryHeadFt[category]); const allValues = sections.length === ids.length && values.every((v) => v !== undefined && finite(v)); categoryHeadFt[category] = allValues ? sum(values as number[]) : undefined; if (allValues && categoryHeadFt[category] === undefined) rowDiagnostics.push(numerical('Circuit category series total is not representable.', `circuit:${circuit.id}`)); }
    const raw = categories.every((category) => categoryHeadFt[category] !== undefined) ? sum(categories.map((category) => categoryHeadFt[category]!)) : undefined;
    if (categories.every((category) => categoryHeadFt[category] !== undefined) && raw === undefined) rowDiagnostics.push(numerical('Circuit category total is not representable.', `circuit:${circuit.id}`));
    const selectedMarginValues = margin ? undefined : (system.margin.categories as LossCategory[]).map((category) => categoryHeadFt[category]);
    const incrementBase = selectedMarginValues !== undefined && selectedMarginValues.every((value) => value !== undefined && finite(value)) ? sum(selectedMarginValues as number[]) : undefined;
    if (raw !== undefined && selectedMarginValues !== undefined && incrementBase === undefined) rowDiagnostics.push(numerical('Selected margin base is not representable.', `circuit:${circuit.id}`));
    const marginHead = raw !== undefined && incrementBase !== undefined ? system.margin.percent * incrementBase / 100 : undefined;
    if (raw !== undefined && incrementBase !== undefined && (marginHead === undefined || !finite(marginHead) || marginHead < 0 || (system.margin.percent > 0 && incrementBase > 0 && marginHead === 0))) rowDiagnostics.push(numerical('Margin increment is not representable.', `circuit:${circuit.id}`));
    const factored = raw !== undefined && finite(marginHead) && marginHead >= 0 ? sum([raw, marginHead]) : undefined;
    if (raw !== undefined && marginHead !== undefined && factored === undefined) rowDiagnostics.push(numerical('Factored circuit head is not representable.', `circuit:${circuit.id}`));
    const density = sections[0]?.hydraulicState?.densityKgM3; let psi: number | undefined; if (factored !== undefined && density !== undefined) { try { psi = headFtToActualFluidPsi(factored, density); } catch (error) { rowDiagnostics.push(numerical(error instanceof Error ? error.message : 'Circuit pressure conversion failed.', `circuit:${circuit.id}`)); } }
    const complete = raw !== undefined && marginHead !== undefined && finite(marginHead) && factored !== undefined && psi !== undefined && sections.every((s) => s.complete) && rowDiagnostics.length === 0;
    return { circuitId: circuit.id, terminalDesignGpm: circuit.terminalDesignGpm, sectionIds: ids, sections, categoryHeadFt, rawHeadFt: complete ? raw : undefined, marginHeadFt: complete ? marginHead : undefined, factoredHeadFt: complete ? factored : undefined, pressureLossPsi: complete ? psi : undefined, complete, diagnostics: rowDiagnostics };
  });
  diagnostics.push(...circuitResults.flatMap((r) => r.diagnostics)); const allComplete = !margin && circuitResults.length === active.length && circuitResults.every((r) => r.complete) && diagnostics.length === 0;
  if (!allComplete) return { systemId, activeTerminalFlowGpm: activeFlow, sectionFlowGpm: flows, sections: sectionResults, circuits: circuitResults, rawGoverningCircuitIds: [], factoredGoverningCircuitIds: [], rawGoverningHeadFt: undefined, governingHeadFt: undefined, governingPressureLossPsi: undefined, designEligible: false, diagnostics, topology };
  const maximum = (key: 'rawHeadFt' | 'factoredHeadFt') => { const value = Math.max(...circuitResults.map((r) => r[key]!)); return { value, ids: circuitResults.filter((r) => Math.abs(r[key]! - value) <= 1e-12).map((r) => r.circuitId).sort() }; };
  const raw = maximum('rawHeadFt'), factored = maximum('factoredHeadFt'), winner = circuitResults.find((r) => r.circuitId === factored.ids[0]);
  return { systemId, activeTerminalFlowGpm: activeFlow, sectionFlowGpm: flows, sections: sectionResults, circuits: circuitResults, rawGoverningCircuitIds: raw.ids, factoredGoverningCircuitIds: factored.ids, rawGoverningHeadFt: raw.value, governingHeadFt: factored.value, governingPressureLossPsi: winner?.pressureLossPsi, designEligible: true, diagnostics, topology };
}
