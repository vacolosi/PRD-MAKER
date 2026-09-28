/** Portable, calculation-input-only contract. Results and acceptance snapshots are derived. */
export const HYDRONIC_PRESSURE_DROP_SCHEMA = 'hydronic-pressure-drop@1' as const;
/** Changes when calculation semantics change, independently of reference-table revisions. */
export const HYDRONIC_ENGINE_VERSION = 'hydronic-pressure-drop-engine@1.0.0' as const;
/** Changes when the shipped, named reference data or catalog changes. */
export const HYDRONIC_REFERENCE_DATA_VERSION = 'hydronic-reference-data@1.0.0' as const;

export interface HydronicVersionMetadata {
  readonly schema: typeof HYDRONIC_PRESSURE_DROP_SCHEMA;
  readonly engineVersion: typeof HYDRONIC_ENGINE_VERSION;
  readonly referenceDataVersion: typeof HYDRONIC_REFERENCE_DATA_VERSION;
}
export const hydronicVersionMetadata: HydronicVersionMetadata = Object.freeze({
  schema: HYDRONIC_PRESSURE_DROP_SCHEMA,
  engineVersion: HYDRONIC_ENGINE_VERSION,
  referenceDataVersion: HYDRONIC_REFERENCE_DATA_VERSION,
});

/** Named boundary: calculations/reference properties are SI; project geometry and UI contract are IP. */
export type UnitBoundary = 'internal-si-and-public-ip-adapter';
export const HYDRONIC_UNIT_BOUNDARY: UnitBoundary = 'internal-si-and-public-ip-adapter';

export type Id = string;
export type SectionRole = 'supply' | 'terminal' | 'return';
export type LossCategory = 'pipe' | 'fitting' | 'valve' | 'equipment';
export type FluidReferenceId =
  | 'iapws-liquid-water-sr6-08-2011'
  | 'dowfrost-pg-30vol-2001-09'
  | 'dowfrost-pg-40vol-2001-09'
  | 'dowfrost-pg-50vol-2001-09'
  | 'dowtherm-sr1-eg-30vol-2008-02'
  | 'dowtherm-sr1-eg-40vol-2008-02'
  | 'dowtherm-sr1-eg-50vol-2008-02';

export type DiagnosticCode =
  | 'invalid-input'
  | 'unknown-reference'
  | 'out-of-range'
  | 'unsupported-catalog-entry'
  | 'incomplete-applicability'
  | 'transition-flow'
  | 'topology-error'
  | 'numerical-failure';
export interface Diagnostic { readonly code: DiagnosticCode; readonly message: string; readonly location?: string; }
export type Completeness = 'complete' | 'provisional' | 'incomplete' | 'invalid';
export interface DiagnosticResult { readonly completeness: Completeness; readonly diagnostics: readonly Diagnostic[]; }

export interface PipeCatalogSelection {
  readonly kind: 'catalog';
  readonly catalogId: string;
  /** Visible, editable field; absent means the catalog's separately attributed legacy default. */
  readonly roughnessOverrideFt?: number;
}
export interface CustomPipeGeometry { readonly kind: 'custom'; readonly actualInsideDiameterIn: number; readonly roughnessFt: number; }
export type PipeGeometry = PipeCatalogSelection | CustomPipeGeometry;
export interface ProvenanceReference { readonly sourceId: string; readonly locator: string; readonly note?: string; }
export interface Section {
  readonly id: Id; readonly name: string; readonly role: SectionRole; readonly fromNodeId: Id; readonly toNodeId: Id;
  /** Physical length/geometry is the sole automatic pipe-loss input; elements are non-pipe only. */
  readonly geometry: PipeGeometry; readonly actualLengthFt: number; readonly description?: string; readonly elements: readonly LossElement[];
}

export interface KElementData { readonly type: 'k'; readonly category: Exclude<LossCategory, 'pipe'>; readonly quantity: number; readonly k: number; readonly basis: 'section-inside-diameter'; }
export interface EquivalentLengthElementData { readonly type: 'equivalent-length'; readonly category: Exclude<LossCategory, 'pipe'>; readonly quantity: number; readonly equivalentLengthFt: number; readonly basis: 'section-inside-diameter'; }
/** A preset stores only its durable identity/Le/D ratio; current section ID produces equivalent length later. */
export interface PresetEquivalentLengthElementData { readonly type: 'preset-equivalent-length'; readonly category: 'fitting'; readonly quantity: number; readonly presetId: 'doe-hdbk-1012-3-92-standard-90-elbow' | 'doe-hdbk-1012-3-92-standard-45-elbow'; readonly basis: 'section-inside-diameter'; }
export interface CvElementData { readonly type: 'cv'; readonly category: 'valve' | 'equipment'; readonly quantity: number; readonly cv: number; }
export interface DirectPsiElementData { readonly type: 'direct-psi'; readonly category: 'equipment' | 'valve'; readonly quantity: number; readonly pressureLossPsi: number; }
export interface DirectHeadElementData { readonly type: 'direct-head'; readonly category: 'equipment' | 'valve'; readonly quantity: number; readonly headFtOfSelectedFluid: number; }
export type LossElementData = KElementData | EquivalentLengthElementData | PresetEquivalentLengthElementData | CvElementData | DirectPsiElementData | DirectHeadElementData;

export interface ApplicabilityBasis {
  /** Active shipped reference bundle identity; old/missing saved values must never be backfilled. */
  readonly referenceDataVersion: string;
  /** Must be the newly derived section flow, including indirect shared-flow changes and on import. */
  readonly sectionGpm: number;
  readonly fluidReferenceId: FluidReferenceId;
  readonly meanTemperatureF: number;
  readonly actualInsideDiameterIn: number;
  readonly roughnessFt: number;
  /** Normalized relevant type/value/quantity/basis data, excluding identity and confirmation itself. */
  readonly element: LossElementData;
  readonly declaredEnvelope: string;
}
export interface UnconfirmedApplicability { readonly status: 'unconfirmed'; readonly statedEnvelope: string; }
export interface ConfirmedApplicability { readonly status: 'confirmed'; readonly statedEnvelope: string; readonly confirmedAtBasis: ApplicabilityBasis; }
/** Confirmation is never an enduring permission: any basis mismatch is incomplete until re-confirmed. */
export type ApplicabilityConfirmation = UnconfirmedApplicability | ConfirmedApplicability;
export interface NonPipeLossElementBase { readonly id: Id; readonly applicability: ApplicabilityConfirmation; readonly provenance?: ProvenanceReference; }
export type KElement = NonPipeLossElementBase & KElementData;
export type EquivalentLengthElement = NonPipeLossElementBase & EquivalentLengthElementData;
export type PresetEquivalentLengthElement = NonPipeLossElementBase & PresetEquivalentLengthElementData;
export type CvElement = NonPipeLossElementBase & CvElementData;
export type DirectPsiElement = NonPipeLossElementBase & DirectPsiElementData;
export type DirectHeadElement = NonPipeLossElementBase & DirectHeadElementData;
/** IDs are unique within a section and persist across reorder/edit; duplication creates a new ID. */
export type LossElement = KElement | EquivalentLengthElement | PresetEquivalentLengthElement | CvElement | DirectPsiElement | DirectHeadElement;

export interface Circuit { readonly id: Id; readonly name: string; readonly state: 'active' | 'draft'; readonly terminalDesignGpm: number; readonly supplySectionIds: readonly Id[]; readonly terminalSectionId: Id; readonly returnSectionIds: readonly Id[]; }
export interface Margin { readonly percent: number; readonly categories: readonly LossCategory[]; readonly acknowledged: boolean; }
export interface HydronicSystem { readonly id: Id; readonly name: string; readonly fluidReferenceId: FluidReferenceId; readonly meanTemperatureF: number; readonly pumpDischargeNodeId: Id; readonly pumpSuctionNodeId: Id; readonly nodes: readonly { readonly id: Id; readonly name: string }[]; readonly sections: readonly Section[]; readonly circuits: readonly Circuit[]; readonly margin: Margin; }
export interface HydronicProject { readonly schema: typeof HYDRONIC_PRESSURE_DROP_SCHEMA; readonly id: Id; readonly name: string; /** Reference data version from the calculation, separate from engineer intent. */ readonly calculationDataVersion: string; readonly systems: readonly HydronicSystem[]; readonly provenance: readonly ProvenanceReference[]; }
