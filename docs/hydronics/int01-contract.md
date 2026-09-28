# HYD-INT-01: Model, criteria, and calculator data contract

Status: All 8 decisions approved. Ready for INT-02.
Engine version pin: `hydronic-pressure-drop-engine@1.0.0`
Reference data version pin: `hydronic-reference-data@1.0.0`
Schema: `hydronic-pressure-drop@1`

## 1. Purpose and scope

This contract defines every data ownership boundary, identity convention, unit rule, and version pin for the hydronic pressure-drop integration into Fabel. A developer picking up HYD-INT-02 or any later work package opens this file and knows the exact type names, field shapes, persistence rules, and prohibited practices without reading the epic or recon. The engine contract (`hydronics/src/engine/contract.ts`) is pinned and consumed as-is. Nothing in this document authorizes modifying that contract, inventing new hydraulic math, or borrowing airside data as hydronic input.

## 2. Ownership boundaries

| Owner | Authoritative data | Must not silently own | Current Fabel seam |
|---|---|---|---|
| Basis of Design (hydronic criteria) | Service defaults, fluid reference ID, design temperatures, mean calculation temperature, pipe spec policy, roughness basis, fitting policy, safety factor categories and acknowledgement | Actual routes, fitted equipment selections, guessed valve losses, accepted calculation snapshots | `packages/web/src/v2/adapters/projections/basisOfDesign.ts` exposes only `heatingFluid`, `hwEwtF`, `hwLwtF` via `ventilation`. No per-system criteria, safety factor, pipe policy, or CHW support. All new fields required. |
| Authored hydronic model | Physical connections, equipment ports, pipe routes, actual size assignments, physical elevations, system membership, inclusion state | Pressure drop formulas or results, inferred drawing pixels, mirrored return geometry | No seam exists. `store.ts` has no hydronic network types. `AirSystemDef.equipmentPosition` (`store.ts:449-457`) is an air-system marker, not a hydronic port. Terminal box layout (`ventilation.ts:87-151`) is keyed by `ventBoxKey(systemId, zone)`, not by coil/port identity. New `ProjectSlice` fields required. |
| Equipment selection and terminal design | Reviewed terminal GPM, manufacturer loss data, valve characteristics, equipment tags, port roles | Airside CFM reused as water flow, rounded plant totals, riser label GPM | `V2RiserDerived.ts` and `riser/extract.ts` derive FCU flow from airside loads / `500 * deltaT`. This is prohibited as PD input. New reviewed terminal water demand fields required. |
| Input resolution and adapter | Effective values, provenance, unit conversion into engine contract, content fingerprint | New hydraulic math, silent default substitution, hidden unit conversions | No adapter exists. The `hydronic-pressure-drop@1` schema has zero references anywhere in Fabel. New adapter module required. |
| Hydronic engine | Derived shared section GPM, fluid properties, losses, eligibility, circuit comparison, governing results | Floor arrangement, drawing appearance, pipe sizing, flow balancing | `hydronics/src/engine/contract.ts` in the PRD maker repo. Not installed in Fabel. |
| Riser and export | Sheet layout, labels, linework, symbol arrangement, export formatting | Measured pipe lengths from schematic spacing, a different set of section flows | `V2RiserDerived.ts` (extract, derive, layout, render, SVG, DXF pipeline). Rendering infrastructure is reusable. `HwGraph`/`deriveHw` (`vent-calc/src/riser/hw.ts`) is not reusable as hydraulic source. |

### Existing seams to reuse

- **Project/floor identities.** `ProjectSlice.projectId` survives rename. `FloorState.id`, `.name`, `.level`, `.floorToFloorFt` are stable and persist (`store.ts:460-483`). Reuse these for identity mapping and building datum.
- **Coordinate frame.** Room polygons and equipment positions are world feet, y-down. The riser mapper (`V2RiserDerived.ts:142-174`) flips viewer Y to model frame at one boundary. Reuse this convention and flip location.
- **Sparse override pattern.** Ventilation inputs resolve `explicit ?? seed` at read time, never writing seeded values back (`ventilation.ts:1-25`). `ventBoxDefaults.ts` resolves project declaration then per-box override then vendored base row. Reuse this behavioral pattern for hydronic criteria inheritance.
- **Persistence field-pick.** `serialize()` (`persistence.ts:157-246`) explicitly picks `ProjectSlice` fields into the save file. New hydronic fields follow this pattern.
- **Undo boundary.** `zundo` wraps `ProjectSlice` for undo (`store.ts:1584-1590`). View-only state is excluded. New authored hydronic state goes in `ProjectSlice`. Derived results and riser layout coordinates do not.
- **SVG/DXF export pipeline.** `HydronicRiserPage.tsx` offers SVG/DXF downloads. The rendering pipeline is reusable infrastructure.

### Existing seams explicitly not reusable as PD input

- `deriveHw()` (`hw.ts:65-117`): sums reheat GPM by floor, picks pipe sizes from fixed GPM bands, forces top-fed layout. This is a schematic, not authored physical piping.
- `HwTerminal.gpm` (`hw.ts:38-49`): airside-derived reheat coil flow, not a reviewed terminal water demand.
- `HwGraph.segments`/`.branches`: cumulative flow walk with fixed pipe band sizing. Not physical sections with authored geometry.
- `riser/extract.ts` FCU flow from airside loads: prohibited by epic section 4.3 as lacking equipment-flow provenance.

## 3. Existing engine contract (pinned)

The engine contract is defined in `hydronics/src/engine/contract.ts` and is consumed without modification.

### Version pins

```typescript
HYDRONIC_PRESSURE_DROP_SCHEMA = 'hydronic-pressure-drop@1'
HYDRONIC_ENGINE_VERSION       = 'hydronic-pressure-drop-engine@1.0.0'
HYDRONIC_REFERENCE_DATA_VERSION = 'hydronic-reference-data@1.0.0'
```

### Unit boundary

```typescript
type UnitBoundary = 'internal-si-and-public-ip-adapter'
```

The engine computes internally in SI. The public contract (what the adapter produces) uses IP units: feet for length, inches for inside diameter, degrees F for temperature, GPM for flow, PSI for pressure, dimensionless for K, and feet-of-selected-fluid for head. The adapter converts at one boundary. No hidden conversions inside host code.

### Top-level types the adapter must produce

| Type | Role |
|---|---|
| `HydronicProject` | Root payload. Contains `schema`, `id`, `name`, `calculationDataVersion`, `systems[]`, `provenance[]`. |
| `HydronicSystem` | One evaluated pump loop. Contains `id`, `name`, `fluidReferenceId`, `meanTemperatureF`, `pumpDischargeNodeId`, `pumpSuctionNodeId`, `nodes[]`, `sections[]`, `circuits[]`, `margin`. |
| `Section` | One physical pipe run between two nodes. Contains `id`, `name`, `role`, `fromNodeId`, `toNodeId`, `geometry`, `actualLengthFt`, `description?`, `elements[]`. |
| `Circuit` | One terminal's discharge-to-suction path. Contains `id`, `name`, `state`, `terminalDesignGpm`, `supplySectionIds[]`, `terminalSectionId`, `returnSectionIds[]`. |
| `LossElement` | One non-pipe loss in a section. Union of `KElement`, `EquivalentLengthElement`, `PresetEquivalentLengthElement`, `CvElement`, `DirectPsiElement`, `DirectHeadElement`. Each carries `id`, `applicability`, `provenance?`, plus type-specific data. |
| `Margin` | Safety factor for the system. `percent`, `categories[]` (of `LossCategory`), `acknowledged`. |
| `PipeGeometry` | Either `PipeCatalogSelection` (`catalogId`, optional `roughnessOverrideFt`) or `CustomPipeGeometry` (`actualInsideDiameterIn`, `roughnessFt`). |
| `Diagnostic` / `DiagnosticResult` | Engine returns `completeness` (`complete`, `provisional`, `incomplete`, `invalid`) and `diagnostics[]` with `code`, `message`, `location?`. |
| `ApplicabilityConfirmation` | Each loss element is either `unconfirmed` or `confirmed` with a `confirmedAtBasis`. Basis mismatch reverts to incomplete. |

### Supported fluids and temperature ranges

| `FluidReferenceId` | Temperature range (degrees F) |
|---|---|
| `iapws-liquid-water-sr6-08-2011` | 32 to 200 |
| `dowfrost-pg-30vol-2001-09` | 30 to 200 |
| `dowfrost-pg-40vol-2001-09` | 30 to 200 |
| `dowfrost-pg-50vol-2001-09` | 30 to 200 |
| `dowtherm-sr1-eg-30vol-2008-02` | 30 to 200 |
| `dowtherm-sr1-eg-40vol-2008-02` | 30 to 200 |
| `dowtherm-sr1-eg-50vol-2008-02` | 30 to 200 |

Concentrations are volume percent glycol, not concentrate product percentage or weight percentage. Unsupported fluid selections block evaluation with an actionable message. Do not convert a broader Fabel fluid setting to the nearest supported choice.

### Loss element types

| `type` | Required fields | Allowed categories |
|---|---|---|
| `k` | `k` (dimensionless, nonneg), `quantity` (int, nonneg), `basis: 'section-inside-diameter'` | `fitting`, `valve`, `equipment` |
| `equivalent-length` | `equivalentLengthFt` (nonneg), `quantity`, `basis: 'section-inside-diameter'` | `fitting`, `valve`, `equipment` |
| `preset-equivalent-length` | `presetId` (one of two supported IDs), `quantity`, `basis: 'section-inside-diameter'` | `fitting` |
| `cv` | `cv` (positive finite), `quantity` | `valve`, `equipment` |
| `direct-psi` | `pressureLossPsi` (nonneg), `quantity` | `equipment`, `valve` |
| `direct-head` | `headFtOfSelectedFluid` (nonneg), `quantity` | `equipment`, `valve` |

Supported preset IDs: `doe-hdbk-1012-3-92-standard-90-elbow`, `doe-hdbk-1012-3-92-standard-45-elbow`.

### Constraint: the engine is not modified by integration

The adapter produces the `HydronicProject` payload. The engine consumes it. No new types, fields, or calculation behaviors are added to `contract.ts` or the engine as part of this integration. If the engine needs changes, that is a separate qualified change with its own versioning.

## 4. Identity rules

### ID assignments

New hydronic IDs use the `prefix-counter-timestamp` pattern that Fabel uses for every user-facing domain entity (systems, zones, floors, rooms). Each type gets its own module-scoped counter. The counter is per-session and monotonically increasing, which avoids re-minting collisions after undo/redo cycles. The `Date.now().toString(36)` suffix makes the collision window about 1ms between tabs.

Do not use `crypto.randomUUID()`. That pattern is reserved for `projectId` and never-debugged sub-entities. The prefix pattern is better for four reasons: undo safety (counter never reuses past values), duplicate healing on load (modeled on `reconcileRoomIds` at store.ts:1421-1435), debuggability (`hydSec-3-m3k1a9` tells you it's the third section), and sufficient collision resistance for dozens of entities.

| Entity | Prefix | Example | Survives |
|---|---|---|---|
| Project | (reuse `ProjectSlice.projectId`) | existing UUID | Rename, reopen, save/load |
| HydronicSystem | `hydSys` | `hydSys-1-m3k1a9` | Rename, criteria changes |
| HydraulicNode | `hydNode` | `hydNode-12-m3k1a9` | Equipment rename, cosmetic moves |
| HydronicEquipment | `hydEquip` | `hydEquip-3-m3k1a9` | Tag rename |
| HydronicPort | `hydPort` | `hydPort-7-m3k1a9` | Equipment rename, reconnection |
| HydraulicSection | `hydSec` | `hydSec-5-m3k1a9` | Pipe resize, loss edits, reroute-adjacent geometry changes |
| HydronicCircuit | `hydCirc` | `hydCirc-2-m3k1a9` | Terminal GPM change, loss changes |
| Loss element | `hydLoss` | `hydLoss-1-m3k1a9` | Value edits, reorder. Duplication creates a new ID. |

All new IDs are generated by the host at creation time. The engine never generates or modifies IDs. Engine-internal computations reference these host-supplied IDs in results.

A `reconcileHydronicIds` function (modeled on `reconcileRoomIds`) runs on project open, re-seeds each counter past existing numeric IDs, and heals duplicates from pre-fix saves.

### Relationship to existing Fabel IDs

No structural relationship. Existing Fabel identifiers serve as optional source linkage in host metadata fields (`sourceAirSystemId?: string`, `sourceFloorId?: string`). They are not substitutes for the hydronic-specific IDs above.

Every other cross-domain reference in the store is a plain foreign-key string (`zone.systemId`, `room.zoneId`). The `ventBoxKey` compound key is the exception, not the model. Hydronic entities don't have the fixed 1:1 relationship that makes `ventBoxKey` work: a section might serve multiple air systems, a circuit might span floors. Baking `AirSystemDef.id` or `FloorState.id` into the hydronic ID would create false structural dependencies that break on split/merge.

| Existing Fabel ID | Hydronic role |
|---|---|
| `ProjectSlice.projectId` | Reused directly as `HydronicProject.id` |
| `FloorState.id` | Optional `sourceFloorId` on equipment/nodes. Not a hydraulic identity. |
| `AirSystemDef.id` | Optional `sourceAirSystemId` if a hydronic system serves that air system's coils. Not a hydronic system ID. |
| `ventBoxKey(systemId, zone)` | Optional source linkage for terminal equipment origin. Not a port or terminal ID. |

If the referenced air system is renamed or deleted, treat the stale source reference as advisory (same pattern as orphaned ventilation entries at `ventilation.ts:184-186`).

### Identity survival rules

- **Rename:** Changing a display name or tag does not change the stable ID. Equipment tag rename does not create a new equipment record.
- **Split:** Splitting a section creates two new section IDs. The old section ID is retired. Prior results referencing the old ID become stale. Host context records the old-to-new mapping.
- **Merge:** Merging sections creates one new section ID. Both old IDs are retired with the same staleness and mapping rules.
- **Delete:** Deleting an object retires its ID. Circuits referencing a deleted section become incomplete. Prior results become stale.
- **Import/reopen:** IDs are persisted in the save file. Reopening restores the same IDs. Imported acceptance snapshots from another source carry their original IDs but are not automatically trusted as local acceptance.

### Host context mapping

The adapter maintains a bidirectional map from every engine payload ID (system, node, section, circuit, loss element) to the corresponding source model object in the host. This map lives in host context, not in the engine payload. The engine payload contains only the IDs, not the source object references.

## 5. Basis of Design contract

User-facing terminology: "safety factor." Engine contract field: `margin`. These refer to the same concept.

### 5.1 Project criteria

| Field | Type | Unit | Source | Default | Inheritance | New or existing |
|---|---|---|---|---|---|---|
| `projectId` | `string` | n/a | `ProjectSlice.projectId` | Generated once | Not inherited, root identity | Existing (reuse) |
| `projectName` | `string` | n/a | `ProjectSlice.projectName` | User-supplied | Not inherited | Existing (reuse) |
| `projectDesignRevision` | `string` | n/a | New host field | Empty string | Not inherited | **New** |

### 5.2 Per-system criteria

Each hydronic system has its own effective criteria resolved from project defaults and per-system overrides. Every field below distinguishes four states: unset, inherited (from project default), explicitly selected, and explicitly overridden.

| Field | Type | Unit | Source | Default | Inheritance rule | New or existing |
|---|---|---|---|---|---|---|
| `systemId` | `string` | n/a | Host-generated | Generated at creation | Not inherited | **New** |
| `systemName` | `string` | n/a | Engineer input | Required | Not inherited | **New** |
| `service` | `'heating-water' \| 'chilled-water'` | n/a | Engineer selection | Required, no default | Not inherited | **New** |
| `fluidReferenceId` | `FluidReferenceId` | n/a | Engineer selection from supported list | Project default for the service, if set | Project service default then per-system override | **New**. Existing `ventilation.heatingFluid` is a vendor display string (`basisOfDesign.ts:70-72`), not an engine fluid reference ID. It may be shown as UI metadata. It cannot populate this field. |
| `supplyDesignTempF` | `number` | degrees F | Engineer input | Project service default | Project default then per-system override | **New**. Existing `hwEwtF` (`basisOfDesign.ts:73`) is a limited EWT display field. It seeds the UI but does not satisfy the reviewed input requirement. |
| `returnDesignTempF` | `number` | degrees F | Engineer input | Project service default | Project default then per-system override | **New**. Same as above for `hwLwtF`. |
| `designDeltaTF` | `number` | delta degrees F | Derived from supply minus return, or explicitly overridden | Derived | If derived, tracks supply/return. If overridden, show disagreement. | **New** |
| `meanCalculationTempF` | `number` | degrees F | Explicit effective value | Proposed from (supply + return) / 2, must be confirmed | Per-system, not inherited | **New**. This is the single `meanTemperatureF` the engine receives per system. |
| `defaultPipeMaterial` | `'steel' \| 'copper'` | n/a | Engineer selection | Pre-seed a visible/editable family choice | Project service default then per-system override | **New**. Never infer material from HW versus CHW service. |
| `defaultPipeSchedule` | steel: `'sch10' \| 'sch40' \| 'sch80'`; copper: `'type-k' \| 'type-l' \| 'type-m'` | n/a | Engineer selection | Steel selection pre-seeds `sch40`; copper selection pre-seeds `type-l` | Project service default then per-system override | **New**. These host selectors compile with nominal size to the engine's exact catalog ID; they are not engine fields. |
| `roughnessPolicyFt` | `number \| 'catalog-default'` | feet | Engineer input or catalog default | `'catalog-default'` | Project default then per-system override, then per-section override | **New** |
| `roughnessConditionSource` | `string` | n/a | Engineer note | Optional | Not inherited | **New** |
| `fittingPolicy` | structured | n/a | Engineer selection | Applicable supported defaults | Project default then per-system override | **New** |

### 5.3 Safety factor (margin)

| Field | Type | Unit | Source | Default | Inheritance rule | New or existing |
|---|---|---|---|---|---|---|
| `safetyFactorPercent` | `number` | percent | Engineer input | No automatic preset. Zero requires explicit acknowledgement. | Project default then per-system override | **New** |
| `safetyFactorCategories` | `LossCategory[]` | n/a | Engineer selection from `['pipe', 'fitting', 'valve', 'equipment']` | Empty (must be explicitly selected) | Project default then per-system override | **New** |
| `safetyFactorAcknowledged` | `boolean` | n/a | Engineer action | `false` | Per-system only | **New** |

These map directly to `Margin` in the engine contract: `percent` = `safetyFactorPercent`, `categories` = `safetyFactorCategories`, `acknowledged` = `safetyFactorAcknowledged`.

### 5.4 Existing field mapping

| Existing Fabel field | Location | Limited role | Cannot be used as |
|---|---|---|---|
| `ventilation.heatingFluid` | `store.ts` via `basisOfDesign.ts:70-72` | UI display label for heating fluid selection. Vendor display string from `FLUIDS` lookup. | Engine `fluidReferenceId`. The display string is not a supported engine reference ID. |
| `ventilation.hwEwtF` | `store.ts` via `basisOfDesign.ts:73` | Heating water entering water temperature for terminal box delta-T display (`ventBoxDefaults.ts:16-30`). | Reviewed supply design temperature. No provenance, review state, or chilled-water equivalent. |
| `ventilation.hwLwtF` | `store.ts` via `basisOfDesign.ts:74` | Heating water leaving water temperature for terminal box delta-T display. | Reviewed return design temperature. Same limitations. |
| `ProjectSlice.hwDeltaTF` | `store.ts:558` | Plant loop delta-T for plant summary GPM display. | System design delta-T. This is a display convenience, not a reviewed engineering input with provenance. |
| `ProjectSlice.chwDeltaTF` | `store.ts:557` | Plant loop delta-T for CHW plant summary. | Same limitations. |

### 5.5 Inheritance and override rules

1. Resolution order: project service defaults, then per-system overrides, then per-section/component overrides where applicable (roughness, pipe spec).
2. Both the authored override and effective value are retained. Clearing an override restores inheritance. Clearing does not write the old default back as an explicit value.
3. A changed project default affects only descendants that inherit it. The UI shows affected systems before applying.
4. Changed criteria invalidate affected result acceptance under the freshness rules in section 9.
5. Acknowledging project policy does not silently confirm every equipment loss or accept all system results.
6. Draft criteria may be saved while incomplete. Final evaluation eligibility requires all required effective values to be valid and reviewed.
7. Unset is not zero. Unknown is not inherited. Missing required values block evaluation with an actionable message stating which value is missing and where to set it.

### 5.6 Temperature unit distinction

Degrees F are absolute temperature inputs (supply temp, return temp, mean temp). Delta degrees F are temperature differences (design delta-T). They must not pass through the same absolute temperature conversion path. A 20 degree F delta-T is not 20 degrees F on an absolute scale.

## 6. Physical model contract

### 6.1 Building floors, positions, and coordinate conventions

| Field | Type | Unit | Source in Fabel | Rules |
|---|---|---|---|---|
| Floor reference | `FloorState.id`, `.name`, `.level` | n/a | `store.ts:461-463` | Reuse the authoritative floor model. Retain empty intermediate floors. Do not create a separate floor table. |
| Floor-to-floor height | `FloorState.floorToFloorFt` | feet | `store.ts:464` | Used for building datum and riser floor line spacing. Not a substitute for physical pipe elevation. |
| Coordinate frame | World feet, Y-down (viewer frame) | feet | Room polygons and equipment positions use this frame (`store.ts:449-457`). | Convert to the hydronic model frame at one boundary. The riser mapper already flips Y to model frame (`V2RiserDerived.ts:142-174`). Use the same flip location. Do not flip twice. |
| Physical position (X, Y) | `number, number` | feet | Calibrated plan coordinates | Normalized from calibrated plan, not raw PDF pixels. `FloorState.calibration` (`store.ts:466-473`) provides the px-to-ft conversion. |
| Physical Z | `number` | feet | New. Not present in existing Fabel types. | Must identify actual piping or port elevation, not merely floor slab elevation. Missing Z is unresolved, not zero, not floor slab. |
| Building Z datum | Derived from floor stack | feet | `V2RiserDerived.resolveRiserFloors()` (`V2RiserDerived.ts:48-77`) derives elevations from floor-to-floor heights. | Reuse this datum derivation for the building coordinate reference. |

**Coordinate conventions:**
- World frame: X right, Y down (viewer convention), Z up. Units are feet.
- Physical pipe length is measured from authored geometry centerline, not endpoint straight-line distance.
- Centerline/end convention at fittings and equipment: pipe physical length runs to the fitting face or equipment connection point. Equivalent length losses from fittings are separate from physical pipe length.
- A coil body or pump symbol's drawn dimensions are not pipe lengths.
- Vertical legs are counted once. Do not double-count a vertical leg in both consecutive floor segments.
- Cross-floor connections require explicit connected endpoints and a physical vertical path. A floor change alone does not establish the connection or exact drop length.

**Length provenance:** Every section length has one of three declared states:

| State | Meaning |
|---|---|
| `measured` | Derived from authored geometry route vertices |
| `declared` | Engineer entered an explicit length with a documented reason |
| `unresolved` | Geometry is incomplete or ambiguous. Cannot be used for calculation. |

A declared override explicitly replaces the measured geometry. Documented added physical length (for future expansion loops, etc.) is separate from the base measurement. Never double-count both a measured length and a declared override that already includes the measured portion.

Automatic airside fallbacks (generic floor drops, nearest zone centers, duct path lengths) must not silently transfer to physical hydronic length.

### 6.2 Hydraulic nodes

| Field | Type | Required | Source |
|---|---|---|---|
| `id` | `string` | Yes | Host-generated stable ID |
| `name` | `string` | Yes | Display name (editable, does not affect identity) |
| `systemId` | `string` | Yes | Owning hydronic system |
| `nodeType` | `'junction' \| 'equipment-port' \| 'section-boundary'` | Yes, host metadata | Host classification |
| `sourceObjectId` | `string` | Optional | Link to source model object |
| `position` | `{x: number, y: number, z?: number}` | Optional | World feet, host context |

**Rules:**
- Coordinates alone do not define identity or connectivity. Nearby points and graphical crossings remain disconnected unless explicitly joined.
- Decorative polyline vertices do not become separately named engineering nodes.
- Section boundaries occur at: junctions, terminal ports, size/roughness changes, or other explicitly needed physical/calculation boundaries.

### 6.3 Equipment and ports

| Field | Type | Required | Source |
|---|---|---|---|
| Equipment `id` | `string` | Yes | Host-generated, distinct from `AirSystemDef.id` |
| Equipment `tag` | `string` | Yes | Engineer-assigned display tag |
| Equipment `type` | `string` | Yes | Pump, terminal, boiler, chiller, etc. |
| Equipment `service` | `'heating-water' \| 'chilled-water'` | Yes | Matches owning system |
| Equipment `systemId` | `string` | Yes | Owning hydronic system |
| Equipment `floorId` | `string` | Optional | Link to `FloorState.id` |
| Port `id` | `string` | Yes | Host-generated, scoped to equipment |
| Port `role` | `'inlet' \| 'outlet'` | Yes | Declared, not inferred from alternating node list |
| Port `connectionNodeId` | `string` | Yes when connected | Link to hydraulic node |
| Port `position` | `{x, y, z?}` | Optional | Physical location in world feet |

**Rules:**
- Distinguish inlet/outlet and supply/return connections. An inlet/outlet pair is not created by alternating through a node list. Actual section references define each pair.
- Multiple coils in one unit (e.g. hot water and chilled water coils in the same air handler) are distinct hydraulic services and belong to different systems.
- Pump equipment must expose distinct discharge and suction node IDs. Never collapse both sides into one node. Do not insert the pump's head gain as a passive pressure loss.
- Equipment identity is preserved across tag rename, plan/model move, and schedule updates.

### 6.4 Sections

| Field | Type | Unit | Required | Maps to engine `Section` field |
|---|---|---|---|---|
| `id` | `string` | n/a | Yes | `Section.id` |
| `name` | `string` | n/a | Yes | `Section.name` |
| `role` | `SectionRole` | n/a | Yes | `Section.role` (`'supply' \| 'terminal' \| 'return'`) |
| `fromNodeId` | `string` | n/a | Yes | `Section.fromNodeId` |
| `toNodeId` | `string` | n/a | Yes | `Section.toNodeId` |
| `actualLengthFt` | `number` | feet | Yes, nonneg finite | `Section.actualLengthFt` |
| `geometry` | `PipeGeometry` | n/a | Yes | `Section.geometry` |
| `description` | `string` | n/a | Optional | `Section.description` |
| `elements` | `LossElement[]` | n/a | Yes (may be empty) | `Section.elements` |
| `lengthProvenance` | `'measured' \| 'declared' \| 'unresolved'` | n/a | Yes, host context | Not in engine payload |
| `sourceObjectIds` | `string[]` | n/a | Yes, host context | Not in engine payload |

**Rules:**
- One physical section appears once in the network. Branch circuits reference shared section IDs rather than duplicating upstream pipe.
- A terminal section may have zero pipe length while containing equipment losses. Zero must be deliberate, not an artifact of missing data.
- Supply sections are ordered from pump discharge toward the terminal. Return sections are ordered from terminal outlet toward pump suction.

### 6.5 Terminal water requirements

Each active terminal supplies:

| Field | Type | Unit | Source |
|---|---|---|---|
| `terminalDesignGpm` | `number` | GPM | Reviewed equipment/terminal design flow or a separately qualified derivation |
| `terminalEquipmentId` | `string` | n/a | Host equipment identity |
| `terminalSectionId` | `string` | n/a | Section connecting terminal inlet to outlet |
| `service` | `'heating-water' \| 'chilled-water'` | n/a | Matches owning system |
| `gpmBasis` | structured | n/a | Source load, delta-T, fluid, review state, override flag |

**Rules:**
- `terminalDesignGpm` is an unrounded finite positive engineering value with documented basis and review state.
- Terminal demand, plant aggregate, airside airflow, and displayed rounded GPM are not interchangeable.
- Deliberately unused terminals are explicitly `draft`/excluded. They do not default to zero GPM.
- System root GPM and section GPM are engine-derived from active terminal circuit membership. The host never supplies section flow directly. Existing schematic riser flow labels and workbook reference flow values are not hydraulic inputs.

**Seed sources (require explicit engineer review before becoming PD input):**
- Airside-derived reheat coil GPM from `HwTerminal.gpm` or `extract.ts` FCU flow calculation may pre-populate the field as a suggestion. The seed source and its load/delta-T/fluid basis are recorded. The engineer must explicitly confirm the value before it enters the engine. Unconfirmed seeds block evaluation.

**Prohibited as direct (unreviewed) sources for `terminalDesignGpm`:**
- Unconfirmed airside-derived GPM treated as a final PD input.
- `extract.ts` FCU flow calculation from airside loads / `500 * deltaT`.
- Rounded riser labels or plant aggregate GPM.
- Room/airside CFM.

### 6.6 Pipe geometry per section

Supply one of:

1. `PipeCatalogSelection`: exact supported `catalogId` and optional `roughnessOverrideFt` in feet.
2. `CustomPipeGeometry`: `actualInsideDiameterIn` (inches, positive) and `roughnessFt` (feet, nonneg).

Nominal size, outside diameter, material, schedule, and display text are retained as host/drawing metadata. They are not substitutes for actual hydraulic inside diameter.

Constraints: `actualLengthFt` is nonneg finite. `actualInsideDiameterIn` is positive finite. `roughnessFt` is nonneg finite. All numbers must be finite (no NaN, no Infinity).

No pipe size is guessed from a neighboring line or a schematic flow band.

### 6.7 Loss elements per section

Each non-pipe loss needs: stable `id`, owning section, `category`, `quantity` (nonneg integer), `type`, declared `applicability` envelope, and optional `provenance`.

A deliberate zero quantity must remain distinguishable from missing data. Manufacturer equipment data should record rated flow, fluid, and temperature/operating basis. Unsupported loss types remain unresolved.

**No double counting:** A coil pressure loss that already includes internal components must not be added again as separate internal fittings. Tee branch and through paths require their own appropriate loss basis.

### 6.8 Pump boundary

| Field | Source |
|---|---|
| `pumpDischargeNodeId` | Host-generated node at pump discharge |
| `pumpSuctionNodeId` | Host-generated node at pump suction |

These are two distinct nodes. The pump itself is not a passive loss element. Its head gain is what the calculation is solving for (governing circuit total head).

### 6.9 What current riser data explicitly cannot be used for

The following data in `vent-calc/src/riser/hw.ts` cannot serve as physical model input:

| Current data | Why it cannot be used |
|---|---|
| `HwGraph` topology | Derived top-fed schematic, not authored supply/return network. Plant location is not modeled (`hw.ts:9-10`). |
| `HwGraph.segments[].gpm` | Cumulative walk from top floor down. Not physical section flow from circuit membership. |
| `sizePipe()` / GPM bands | Fixed pipe-size bands for schematic display (`hw.ts:50-53`). Not actual pipe geometry with inside diameter. |
| `HwTerminal.gpm` | Airside-derived. No provenance, review state, or equipment-specific basis (`hw.ts:38-49`). |
| HWR dashed mirror | Return is drawn as a copy of supply layout (`hw.ts:185-244`). Return piping must be separately authored. |
| Floor-by-floor branch structure | Assumed one branch per floor. Does not represent actual branch connectivity or shared sections. |

## 7. Circuit compilation rules

### 7.1 Circuit assembly

A circuit is one terminal's complete discharge-to-suction path through the authored network:

1. `supplySectionIds[]`: ordered from pump discharge node toward the terminal. Each ID references a host-authored section.
2. `terminalSectionId`: connects the terminal inlet to outlet. May have zero pipe length but contains terminal equipment losses.
3. `returnSectionIds[]`: ordered from terminal outlet toward pump suction node. Each ID references a host-authored section.

### 7.2 Shared sections

Where multiple terminals share common supply or return mains, those sections appear once in `HydronicSystem.sections[]` and are referenced by ID in each applicable circuit's `supplySectionIds` or `returnSectionIds`. The engine derives shared section GPM by summing the `terminalDesignGpm` of all active circuits that reference each section.

### 7.3 Flow derivation

The engine derives section GPM from circuit membership. The host never supplies section flow directly. There is no editable section flow field. System root GPM (total flow at pump) is the sum of all active terminal demands.

### 7.4 Route resolution

Where there is exactly one supported route through the authored graph and the physical input is complete, that route can be proposed. Ambiguous routes require engineer resolution. The adapter must never silently choose the shortest or nearest route.

### 7.5 Topology validation

The following are rejected and prevent eligible system results:

| Condition | Rejection reason |
|---|---|
| Missing section reference in a circuit | Discontinuous path |
| Duplicate section ID in one circuit path | Invalid topology |
| Cycle in the directed supply/return path | Unsupported topology (closed loops within a circuit path) |
| Mesh or cross-connection between parallel circuits | Unsupported. Must be identified and blocked, not flattened. |
| Unresolved pump boundary | Cannot determine discharge-to-suction path |
| Section referenced by circuits in different systems | Cross-system reference |
| Terminal with no return path | Incomplete circuit |
| Section with incompatible role for its position in the path | Role mismatch |

Active but unassigned design objects (authored equipment/sections not yet part of any circuit) are shown separately from intentional drafts. The adapter must not obtain an apparently complete calculation by silently dropping problematic active equipment.

### 7.6 Circuit state

| `Circuit.state` | Meaning |
|---|---|
| `'active'` | Included in evaluation. Must have valid `terminalDesignGpm` and complete section path. |
| `'draft'` | Excluded from evaluation. Visible in the model. Does not contribute flow. |

## 8. Adapter payload and versioning

### 8.1 Schema and version pins

The adapter produces a `HydronicProject` with:

```typescript
{
  schema: 'hydronic-pressure-drop@1',
  id: projectId,                    // from ProjectSlice.projectId
  name: projectName,                // from ProjectSlice.projectName
  calculationDataVersion: 'hydronic-reference-data@1.0.0',
  systems: [ /* HydronicSystem[] */ ],
  provenance: [ /* ProvenanceReference[] */ ]
}
```

Engine version: `hydronic-pressure-drop-engine@1.0.0`. Reference data version: `hydronic-reference-data@1.0.0`. Both are recorded in source context alongside adapter version and export timestamp.

### 8.2 What goes in the engine payload vs. host context

| In engine payload (`HydronicProject`) | In host context (not sent to engine) |
|---|---|
| System/node/section/circuit/loss IDs | Source object mappings back to Fabel model objects |
| `fluidReferenceId`, `meanTemperatureF` | Supply/return design temps, delta-T, design revision |
| `pumpDischargeNodeId`, `pumpSuctionNodeId` | Equipment tags, floor references, coordinate positions |
| Section `actualLengthFt`, `geometry`, `elements` | Length provenance, measurement basis, Z coordinates |
| Circuit `terminalDesignGpm`, section references | GPM basis, review state, equipment metadata |
| `Margin` (percent, categories, acknowledged) | Safety factor UI labels, policy source |
| `provenance[]` (source references) | Full criteria resolution chain, adapter version |
| Nothing else. | Drawing layout, riser coordinates, label positions, sheet settings, Revit export preferences |

Coordinates, floor data, drawing layout, model revision stamps, host port types, manufacturer attachments, and Revit sheet settings must not be inserted as unauthorized extra properties into the engine schema.

### 8.3 Input fingerprint

The adapter produces a content-based fingerprint of the payload. Rules:

- Fingerprint is derived from the semantic content of the payload (field values), not from timestamps or export order.
- Export time must not make identical hydraulic inputs appear physically different.
- Two payloads with identical hydraulic content produce identical fingerprints regardless of when they were exported.
- The fingerprint is stored in host context alongside the result snapshot.

### 8.4 Version compatibility

| Condition | Behavior |
|---|---|
| Payload `schema` does not match installed engine's expected schema | Fail with message: "Unsupported schema version [X]. Engine expects [Y]." |
| `calculationDataVersion` does not match installed reference data | Fail with message: "Reference data version mismatch. Payload specifies [X], installed is [Y]." |
| Engine version mismatch | Fail with message stating both versions and required action. |

Failures are closed. No fallback to partial evaluation, no silent downgrade.

## 9. Persistence, undo, and freshness rules

### 9.1 New persisted fields

The following new fields are added to `ProjectSlice` and persisted via the `serialize()` field-pick pattern (`persistence.ts:157-246`):

| New field | Type | Persisted | Undoable | Notes |
|---|---|---|---|---|
| `hydronicSystems` | Array of authored hydronic system definitions | Yes | Yes | System criteria, service, fluid reference, temperatures, pipe policy, safety factor |
| `hydronicEquipment` | Array of authored equipment with ports | Yes | Yes | Equipment identity, tags, port roles, connections |
| `hydronicNodes` | Array of hydraulic nodes | Yes | Yes | Junction, port, boundary nodes |
| `hydronicSections` | Array of authored sections | Yes | Yes | Physical pipe runs, geometry, loss elements |
| `hydronicCircuits` | Array of circuit definitions | Yes | Yes | Terminal paths through the network |
| `hydronicCriteriaDefaults` | Project-level service defaults | Yes | Yes | Default fluid, temps, pipe policy, safety factor by service |
| `hydronicResultSnapshot` | Last accepted engine result with input fingerprint | Yes | No (view-state adjacent) | Stale-aware, labeled historical on mismatch |
| `hydronicDesignRevision` | Monotonic counter | Yes | Yes | Bumped on physical/criteria edits, not cosmetic |

All new fields follow the additive pattern (`persistence.ts` comment: "ADDITIVE, no format bump"): files saved before hydronic data existed load unchanged and default to empty/absent. No migration rewrites old saves.

### 9.2 Field-pick pattern for serialize/applyFile

In `serialize()`, new hydronic fields are picked from the store alongside existing fields:

```typescript
// Pattern from persistence.ts:181-232
hydronicSystems: s.hydronicSystems,
hydronicEquipment: s.hydronicEquipment,
// ... etc, only if defined (additive spread)
...(s.hydronicSystems !== undefined ? { hydronicSystems: s.hydronicSystems } : {}),
```

In `applyFile()`, missing fields backfill to empty defaults:

```typescript
hydronicSystems: saved.hydronicSystems ?? [],
hydronicEquipment: saved.hydronicEquipment ?? [],
// ...
```

`applyFile()` clears temporal history (`persistence.ts:315+`), which is correct for loading a hydronic graph from file.

### 9.3 Migration rules

| Scenario | Behavior |
|---|---|
| Open a project saved before hydronic fields existed | All hydronic fields default to empty arrays/undefined. No phantom data manufactured. |
| Open a project with hydronic data in a version that does not support it | Hydronic fields are silently preserved in the save blob if re-saved (same pattern as other additive fields). |
| Version mismatch in result snapshot | Result labeled "historical/stale." Not automatically re-evaluated. |

### 9.4 Undo boundary

Authored hydronic state (systems, equipment, nodes, sections, circuits, criteria) lives in `ProjectSlice` and participates in `zundo` undo/redo. Engine results and riser layout coordinates do not participate in undo. This matches the existing pattern where `ProjectSlice` is undoable and view/result state is excluded (`store.ts:1584-1590, 4153-4250`).

### 9.5 Freshness and staleness rules

**Staling edits** (invalidate current results and acceptance):

| Edit type | Why it stales |
|---|---|
| Reroute physical pipe | Changes section membership, lengths, or connectivity |
| Change vertical elevation | Changes actual pipe length |
| Change pipe diameter or material | Changes section geometry |
| Change terminal GPM | Changes circuit flow and all shared section derived flows |
| Change fluid reference or mean temperature | Changes fluid properties |
| Edit loss element (add, remove, change type/value) | Changes section losses |
| Change safety factor percent, categories, or acknowledgement | Changes margin |
| Split or merge a section | Changes section identity and topology |
| Delete or reconnect a terminal | Changes circuit population |
| Change a criteria override that affects effective values | Changes resolved input |

Indirect shared-flow changes matter: changing terminal B's GPM stales results for terminal A if they share supply/return sections.

**Non-staling edits** (do not invalidate results):

| Edit type | Why it does not stale |
|---|---|
| Rename an equipment tag | Identity unchanged, no hydraulic effect |
| Move a riser label or symbol position | Drawing-only, no physical route change |
| Reorder loss elements within a section | ID-based, order has no hydraulic meaning |
| Change sheet/export formatting preferences | Drawing context only |
| Move equipment symbol without changing connected route | Cosmetic plan change |

**Historical results:** Prior reviewed results may remain visible but must be labeled "historical" or "stale." They are never shown as current.

**Imported acceptance:** Acceptance snapshots from another source (e.g. standalone calculator) carry their original fingerprint. They are not automatically trusted as local acceptance. A new local acceptance requires the sanctioned review process.

### 9.6 Acceptance snapshot rules

The standalone engine defines acceptance as: the engineer reviews the current result and explicitly accepts it. Acceptance is fingerprinted to the input that produced it. Any input change that produces a different fingerprint makes the acceptance stale.

These same rules apply in the integrated context. The host stores the accepted result snapshot and its input fingerprint. On any staling edit, the fingerprint changes and the acceptance becomes historical.

## 10. Riser and export contract

### 10.1 Riser is a projection, not a second model

The riser is a read-only projection of the authored hydronic network. It presents the same topology, equipment, flow, and pipe data. It is not independently editable for hydraulic purposes.

The riser can be visible while the calculation is incomplete, but missing or stale results must remain visibly unavailable (not shown as zero, not shown as current).

### 10.2 Current HW riser assumptions are superseded

The following assumptions in `vent-calc/src/riser/hw.ts` are explicitly superseded by the integration:

| Assumption | Location | Superseded by |
|---|---|---|
| Top-fed plant layout | `hw.ts:9-10`: "Plant location is not modeled: the riser is drawn TOP-FED" | Actual authored pump/plant location from the hydronic model |
| One HWS/HWR pair for the whole building | `hw.ts:6-7`: "ONE riser pair for the whole building" | Multiple separate systems (HW and CHW) with distinct identities |
| No CHW drawing | `hw.ts:7`: "NO CHW is ever drawn" | CHW systems are separately authored and drawn |
| Cumulative GPM walk for pipe sizing | `hw.ts:96-117`: `deriveHw()` cumulative walk | Engine-derived section flow from circuit membership |
| Fixed GPM band pipe sizes | `sizePipe()` from lookup bands | Actual authored pipe geometry per section |
| Reheat terminals only | `hw.ts:79-87`: filters by `hwGpm > MIN_GPM` from reheat | Any authored terminal with reviewed design GPM |

### 10.3 DXF as initial 2D Revit drawing exchange

The first Revit deliverable is a two-dimensional riser drawing exported as DXF and imported into a Revit drafting/detail workflow. This reuses the existing SVG-to-DXF pipeline (`V2RiserDerived.ts:14-16`, `HydronicRiserPage.tsx`).

This is not a promise of native Revit pipes, families, connectors, or bidirectional BIM synchronization. Those need a separate agreed scope.

**Required Revit verification gate:** A real import into a recorded supported Revit version/build, placed on a sample sheet, checked at intended plot scale. Retain the exported file, import settings, screenshot/PDF, source revision, and reviewer notes. Victor must sign off drawing readability. If Revit is unavailable during development, report this gate as unverified rather than claiming delivery quality.

### 10.4 Drawing vs. physical separation

Moving a riser label, adjusting schematic spacing for readability, or dragging a symbol on the drawing sheet cannot change hydraulic input data. The riser layout coordinates live in view state (not undoable, not staling). The physical model (sections, nodes, lengths, connections) lives in `ProjectSlice` (undoable, staling).

A drafting drag is not a pipe reroute. Schematic spacing can be adjusted for readability while the physical model retains actual lengths and elevations.

## 11. Decisions requiring Victor's approval

These are gates before INT-02 can start. Each comes from the recon (`.int01-fabel-model-recon.md`).

### Decision 1: Canonical host placement and dependency (APPROVED)

**Question:** Where does the new persisted hydronic state live?

**Approved answer:** Additive optional fields on `ProjectSlice` (same pattern as `ventilation`, `acceptedOa`, `airflowPolicy`). New adapter module under `packages/web/src/v2/adapters/`. Engine as workspace dependency, pinned to `1.0.0`. Not in `VentilationInputs` or `packages/pressure-drop`.

### Decision 2: Identity authority (APPROVED)

**Question:** Are new hydronic IDs host-generated stable IDs? What pattern? How do they map to existing IDs?

**Approved answer:** Use the `prefix-counter-timestamp` pattern (`hydSys-1-m3k1a9`), not `crypto.randomUUID()`. Each entity type gets its own module-scoped counter and a `reconcileHydronicIds` function on project open. Existing Fabel IDs are optional source linkage via plain foreign-key fields (`sourceAirSystemId?`, `sourceFloorId?`), not structural dependencies. `projectId` is reused directly. See section 4 for the full prefix table and rationale.

**Source:** Fabel store agent review of undo safety, duplicate healing, debuggability, and collision resistance trade-offs.

### Decision 3: Coordinate, Z, and length contract (APPROVED)

**Question:** Confirm coordinate conventions, Z datum, length provenance.

**Approved answer:** Existing floor stack datum, Y flipped once at adapter boundary, Z datum = bottom of lowest slab at z=0, centerline-to-face at fittings, diagonal 3D segments allowed, vertical legs counted once, three-state provenance (`measured | declared | unresolved`).

### Decision 4: Supported first topology and service scope (APPROVED)

**Question:** Confirm closed-loop HW/CHW as separate systems, tree topology only, legacy riser as rendering-only.

**Approved answer:** Separate closed-loop HW and CHW systems. One pump boundary each. Explicit supply + terminal + return sections. Mesh/bypass/primary-secondary rejected. Legacy HW riser rendering infrastructure reusable. `deriveHw`/`HwGraph` superseded as PD input.

### Decision 5: BoD representation and review behavior (APPROVED)

**Question:** Approve BoD field model and existing field roles.

**Approved answer:** New typed fields for all PD criteria with per-service project defaults and per-system sparse overrides. Existing `heatingFluid`/`hwEwtF`/`hwLwtF` are UI metadata only, not engine inputs.

### Decision 6: Water-demand source policy (APPROVED with seed allowance)

**Question:** Approve which upstream data can populate `terminalDesignGpm`.

**Approved answer:** Only reviewed equipment/terminal design flow or a separately qualified derivation with explicit provenance. Airside-derived GPM (from reheat loads, riser labels, plant aggregates) may pre-populate the field as a suggestion/seed, but the engineer must explicitly review and confirm it before it becomes a PD input. Unconfirmed seeds block evaluation. The seed source and its basis are recorded so the engineer knows where the number came from.

### Decision 7: Persistence and freshness partition (APPROVED)

**Question:** Approve the three-tier persistence partition and staling/non-staling edit table.

**Approved answer:** Authored hydronic state in `ProjectSlice` (undoable, persisted). Results in non-undoable snapshot with input fingerprint. Riser layout in view state. Staling and non-staling edits per section 9.5.

### Decision 8: Drawing and Revit acceptance interpretation (APPROVED)

**Question:** Confirm DXF as initial exchange format and verification requirements.

**Approved answer:** DXF confirmed as initial 2D Revit drafting exchange. Revit version, import settings, and plot scale specified during INT-10/INT-11. Real Revit import test and Victor's drawing readability sign-off required before claiming delivery quality.

## 12. Synthetic verification fixtures

### Fixture A: Network and flow

One supported closed loop. Heating water, fluid `iapws-liquid-water-sr6-08-2011`, mean temperature 150 degrees F.

**Topology:**
- Pump discharge node P-D, pump suction node P-S.
- Common supply section S-MAIN: P-D to junction J1.
- Branch supply section S-A: J1 to terminal A inlet.
- Branch supply section S-B: J1 to terminal B inlet.
- Terminal section T-A: terminal A inlet to terminal A outlet.
- Terminal section T-B: terminal B inlet to terminal B outlet.
- Branch return section R-A: terminal A outlet to junction J2.
- Branch return section R-B: terminal B outlet to junction J2.
- Common return section R-MAIN: J2 to P-S.

Terminal A: 10 GPM, floor level 1. Terminal B: 20 GPM, floor level 2. Pump at level 1.

**Expected flow derivation:**

| Section | Circuits referencing | Derived GPM |
|---|---|---|
| S-MAIN | A, B | 30 |
| S-A | A | 10 |
| S-B | B | 20 |
| T-A | A | 10 |
| T-B | B | 20 |
| R-A | A | 10 |
| R-B | B | 20 |
| R-MAIN | A, B | 30 |

**After changing terminal B to 40 GPM:**

| Section | Derived GPM |
|---|---|
| S-MAIN | 50 |
| S-A | 10 |
| S-B | 40 |
| T-A | 10 |
| T-B | 40 |
| R-A | 10 |
| R-B | 40 |
| R-MAIN | 50 |

After the change: all prior acceptance is stale. S-MAIN and R-MAIN flows changed, so circuit A results are also stale even though terminal A's own GPM did not change.

Loss result expectations come from the qualified engine with documented numeric tolerance. Do not invent pressure-drop goldens in the UI.

### Fixture B: Geometry

Ordered route vertices in world feet: `(0,0,0)`, `(3,0,0)`, `(3,4,0)`, `(3,4,12)`.

- Segment 1: horizontal, 3 ft.
- Segment 2: horizontal, 4 ft.
- Segment 3: vertical, 12 ft.
- **Expected actual routed length: 19 ft.**
- Straight endpoint distance would be ~13 ft. That is wrong.

Tolerance for this synthetic exact case: absolute error at most 0.000001 ft.

**Missing Z case:** If the final vertex has no Z value, the length provenance is `unresolved`. The section cannot be used for calculation. The UI shows an actionable message: "Section [name] has unresolved elevation at vertex 4. Provide Z coordinate to calculate physical length."

**Diagonal case:** A route `(0,0,0)`, `(3,4,12)` has actual 3D segment length `sqrt(9 + 16 + 144) = sqrt(169) = 13 ft`. This is correct. Do not flatten to plan length `sqrt(9 + 16) = 5 ft`.

### Fixture C: Missing and unsupported cases

Each case must produce an actionable diagnostic and no false "current" result.

| Case | Missing/invalid input | Expected diagnostic |
|---|---|---|
| Missing fluid | `fluidReferenceId` absent | "System [name]: fluid reference is required. Select a supported fluid." |
| Unsupported concentration | Fluid string not in `FluidReferenceId` union | "System [name]: fluid '[value]' is not supported. Supported fluids: [list]." |
| Unset mean temperature | `meanTemperatureF` absent or NaN | "System [name]: mean calculation temperature is required." |
| Absent actual ID | `PipeGeometry` with missing `actualInsideDiameterIn` for custom | "Section [name]: actual inside diameter is required for custom pipe geometry." |
| Invalid coefficient | Loss element with `k` = NaN or negative | "Section [name], element [id]: K value must be a nonneg finite number." |
| Missing coil flow | Terminal with `terminalDesignGpm` absent or zero | "Circuit [name]: terminal design GPM is required and must be positive." |
| Missing return connection | Circuit with empty `returnSectionIds` | "Circuit [name]: return path is missing. Connect terminal outlet to pump suction." |
| Unresolved vertical leg | Section with `lengthProvenance: 'unresolved'` | "Section [name]: physical length is unresolved. Provide geometry or declared length." |
| Unsupported mesh | Cross-connection detected between parallel circuits | "System [name]: mesh topology detected between circuits [A] and [B]. Only tree topology is supported." |
| Incompatible equipment port | Port `role` mismatch with section direction | "Section [name]: port [id] role '[role]' is incompatible with section direction." |
| Unknown schema | Payload `schema` not `hydronic-pressure-drop@1` | "Unsupported schema version [X]. Engine expects hydronic-pressure-drop@1." |
| Stale upstream load basis | `terminalDesignGpm` derived from a load that has since changed | "Circuit [name]: terminal GPM basis has changed. Review and re-confirm terminal design flow." |

### Fixture D: Change and identity cases

| Action | Expected behavior |
|---|---|
| Rename equipment tag "AHU-1" to "AHU-1A" | Equipment ID unchanged. All section/circuit references intact. Results remain current (non-staling edit). |
| Move only a riser label 50px right | No change to any hydraulic input. Results remain current. Riser layout coordinates update in view state (not undoable). |
| Reroute physical pipe (change S-A path) | S-A length changes. Results stale for circuit A and any circuit sharing sections with A. |
| Change project default roughness from catalog to 0.0002 ft | All inheriting sections get new effective roughness. Results stale for affected systems. Non-inheriting sections with explicit overrides unaffected. |
| Change explicit per-system fluid override | That system's results stale. Other systems unaffected. |
| Split section S-MAIN at midpoint | S-MAIN ID retired. Two new IDs created. All circuits referencing S-MAIN updated to reference both new sections. Prior results stale. Host context records old-to-new mapping. |
| Delete terminal B | Circuit B becomes incomplete. Section flows for S-MAIN and R-MAIN recalculated (now 10 GPM from A only). All prior results stale. |
| Reopen older project with no hydronic data | All hydronic fields default to empty. No phantom data. Existing airside/ventilation data intact. |

### Fixture E: Drawing and Revit cases

**Multilevel branched fixture:** Use fixture A topology. Pump at level 1, terminal A at level 1, terminal B at level 2. Include:
- Long equipment tag: "AHU-2A-HW-REHEAT-COIL" (test text truncation/wrapping).
- Fractional pipe label: `1-1/4"` on branch sections.
- Non-top-fed pump: pump at level 1 (bottom), not top floor.
- Intermediate empty floor between levels 1 and 2 (floor with no terminals, retained in riser).
- Dense branch: three terminals on one floor at close spacing (test label collision handling).
- Sheet continuation/matchline if the riser exceeds one sheet.

**Separate service fixture:** One HW system and one CHW system in the same project. Distinct identities, fluid references, temperatures, and riser presentations. Systems must not be combined because terminals share a floor.

**Verification checklist:**
- Compare every displayed tag and branch GPM with source model and engine results.
- Test in monochrome (print preview): supply/return must be distinguishable without color.
- Export DXF. Import into recorded Revit version. Place on sheet at intended plot scale.
- Compare Revit sheet with Fabel riser: tags, GPM, sizes, line patterns, connectivity must match.
- Record reviewer findings. Victor's readability review required.

### Valid payload example

```typescript
const validPayload: HydronicProject = {
  schema: 'hydronic-pressure-drop@1',
  id: 'project-001',
  name: 'Sample Office HW',
  calculationDataVersion: 'hydronic-reference-data@1.0.0',
  systems: [{
    id: 'sys-hw-001',
    name: 'HW-1',
    fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
    meanTemperatureF: 150,
    pumpDischargeNodeId: 'node-pd',
    pumpSuctionNodeId: 'node-ps',
    nodes: [
      { id: 'node-pd', name: 'Pump Discharge' },
      { id: 'node-ps', name: 'Pump Suction' },
      { id: 'node-j1', name: 'Junction 1' },
      { id: 'node-j2', name: 'Junction 2' },
      { id: 'node-ta-in', name: 'Terminal A Inlet' },
      { id: 'node-ta-out', name: 'Terminal A Outlet' },
    ],
    sections: [
      {
        id: 'sec-s-main', name: 'Supply Main', role: 'supply',
        fromNodeId: 'node-pd', toNodeId: 'node-j1',
        geometry: { kind: 'catalog', catalogId: 'steel-sch40-2' },
        actualLengthFt: 100, elements: []
      },
      {
        id: 'sec-s-a', name: 'Supply Branch A', role: 'supply',
        fromNodeId: 'node-j1', toNodeId: 'node-ta-in',
        geometry: { kind: 'catalog', catalogId: 'steel-sch40-1' },
        actualLengthFt: 25, elements: [{
          id: 'el-001', type: 'preset-equivalent-length',
          category: 'fitting', quantity: 2,
          presetId: 'doe-hdbk-1012-3-92-standard-90-elbow',
          basis: 'section-inside-diameter',
          applicability: { status: 'confirmed', statedEnvelope: 'standard',
            confirmedAtBasis: {
              referenceDataVersion: 'hydronic-reference-data@1.0.0',
              sectionGpm: 10, fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
              meanTemperatureF: 150, actualInsideDiameterIn: 1.049, roughnessFt: 0.00015,
              element: { type: 'preset-equivalent-length', category: 'fitting',
                quantity: 2, presetId: 'doe-hdbk-1012-3-92-standard-90-elbow',
                basis: 'section-inside-diameter' },
              declaredEnvelope: 'standard'
            }
          }
        }]
      },
      {
        id: 'sec-t-a', name: 'Terminal A', role: 'terminal',
        fromNodeId: 'node-ta-in', toNodeId: 'node-ta-out',
        geometry: { kind: 'custom', actualInsideDiameterIn: 0.75, roughnessFt: 0.00015 },
        actualLengthFt: 0, elements: [{
          id: 'el-002', type: 'direct-psi', category: 'equipment',
          quantity: 1, pressureLossPsi: 3.5,
          applicability: { status: 'confirmed', statedEnvelope: 'coil at 10 GPM 150F water',
            confirmedAtBasis: {
              referenceDataVersion: 'hydronic-reference-data@1.0.0',
              sectionGpm: 10, fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
              meanTemperatureF: 150, actualInsideDiameterIn: 0.75, roughnessFt: 0.00015,
              element: { type: 'direct-psi', category: 'equipment', quantity: 1,
                pressureLossPsi: 3.5 },
              declaredEnvelope: 'coil at 10 GPM 150F water'
            }
          }
        }]
      },
      {
        id: 'sec-r-a', name: 'Return Branch A', role: 'return',
        fromNodeId: 'node-ta-out', toNodeId: 'node-j2',
        geometry: { kind: 'catalog', catalogId: 'steel-sch40-1' },
        actualLengthFt: 25, elements: []
      },
      {
        id: 'sec-r-main', name: 'Return Main', role: 'return',
        fromNodeId: 'node-j2', toNodeId: 'node-ps',
        geometry: { kind: 'catalog', catalogId: 'steel-sch40-2' }
        actualLengthFt: 100, elements: []
      },
    ],
    circuits: [{
      id: 'cir-a', name: 'Circuit A', state: 'active',
      terminalDesignGpm: 10,
      supplySectionIds: ['sec-s-main', 'sec-s-a'],
      terminalSectionId: 'sec-t-a',
      returnSectionIds: ['sec-r-a', 'sec-r-main'],
    }],
    margin: { percent: 10, categories: ['pipe', 'fitting'], acknowledged: true },
  }],
  provenance: [{ sourceId: 'project-001', locator: 'Fabel HW-1 design rev 1' }],
};
```

### Invalid payload example 1: Missing fluid

```typescript
// fluidReferenceId omitted from system
{
  schema: 'hydronic-pressure-drop@1',
  id: 'project-bad-1',
  name: 'Missing Fluid',
  calculationDataVersion: 'hydronic-reference-data@1.0.0',
  systems: [{
    id: 'sys-1', name: 'HW-1',
    // fluidReferenceId: MISSING
    meanTemperatureF: 150,
    pumpDischargeNodeId: 'n1', pumpSuctionNodeId: 'n2',
    nodes: [{ id: 'n1', name: 'PD' }, { id: 'n2', name: 'PS' }],
    sections: [], circuits: [],
    margin: { percent: 0, categories: [], acknowledged: true },
  }],
  provenance: [],
}
// Expected: invalid-input diagnostic, "System HW-1: fluid reference is required."
```

### Invalid payload example 2: Missing return path

```typescript
{
  schema: 'hydronic-pressure-drop@1',
  id: 'project-bad-2',
  name: 'No Return',
  calculationDataVersion: 'hydronic-reference-data@1.0.0',
  systems: [{
    id: 'sys-1', name: 'HW-1',
    fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
    meanTemperatureF: 150,
    pumpDischargeNodeId: 'n-pd', pumpSuctionNodeId: 'n-ps',
    nodes: [
      { id: 'n-pd', name: 'PD' }, { id: 'n-ps', name: 'PS' },
      { id: 'n-t-in', name: 'T In' }, { id: 'n-t-out', name: 'T Out' },
    ],
    sections: [
      { id: 's1', name: 'Supply', role: 'supply', fromNodeId: 'n-pd', toNodeId: 'n-t-in',
        geometry: { kind: 'custom', actualInsideDiameterIn: 1.0, roughnessFt: 0.00015 },
        actualLengthFt: 50, elements: [] },
      { id: 's-t', name: 'Terminal', role: 'terminal', fromNodeId: 'n-t-in', toNodeId: 'n-t-out',
        geometry: { kind: 'custom', actualInsideDiameterIn: 0.75, roughnessFt: 0.00015 },
        actualLengthFt: 0, elements: [] },
      // NO return section
    ],
    circuits: [{
      id: 'c1', name: 'Circuit 1', state: 'active', terminalDesignGpm: 10,
      supplySectionIds: ['s1'], terminalSectionId: 's-t',
      returnSectionIds: [], // EMPTY
    }],
    margin: { percent: 0, categories: [], acknowledged: true },
  }],
  provenance: [],
}
// Expected: topology-error diagnostic, "Circuit Circuit 1: return path is missing."
```

### Invalid payload example 3: Unsupported mesh

```typescript
{
  schema: 'hydronic-pressure-drop@1',
  id: 'project-bad-3',
  name: 'Mesh Topology',
  calculationDataVersion: 'hydronic-reference-data@1.0.0',
  systems: [{
    id: 'sys-1', name: 'HW-1',
    fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
    meanTemperatureF: 150,
    pumpDischargeNodeId: 'n-pd', pumpSuctionNodeId: 'n-ps',
    nodes: [
      { id: 'n-pd', name: 'PD' }, { id: 'n-ps', name: 'PS' },
      { id: 'n-j1', name: 'J1' }, { id: 'n-j2', name: 'J2' },
      { id: 'n-ta-in', name: 'TA In' }, { id: 'n-ta-out', name: 'TA Out' },
      { id: 'n-tb-in', name: 'TB In' }, { id: 'n-tb-out', name: 'TB Out' },
    ],
    sections: [
      { id: 's-main', name: 'Supply Main', role: 'supply', fromNodeId: 'n-pd', toNodeId: 'n-j1',
        geometry: { kind: 'custom', actualInsideDiameterIn: 2.0, roughnessFt: 0.00015 },
        actualLengthFt: 100, elements: [] },
      { id: 's-a', name: 'Supply A', role: 'supply', fromNodeId: 'n-j1', toNodeId: 'n-ta-in',
        geometry: { kind: 'custom', actualInsideDiameterIn: 1.0, roughnessFt: 0.00015 },
        actualLengthFt: 30, elements: [] },
      { id: 's-b', name: 'Supply B', role: 'supply', fromNodeId: 'n-j1', toNodeId: 'n-tb-in',
        geometry: { kind: 'custom', actualInsideDiameterIn: 1.0, roughnessFt: 0.00015 },
        actualLengthFt: 30, elements: [] },
      // Cross-connection creating mesh between A and B branches
      { id: 's-cross', name: 'Cross Connect', role: 'supply', fromNodeId: 'n-ta-in', toNodeId: 'n-tb-in',
        geometry: { kind: 'custom', actualInsideDiameterIn: 0.75, roughnessFt: 0.00015 },
        actualLengthFt: 10, elements: [] },
      { id: 's-ta', name: 'Terminal A', role: 'terminal', fromNodeId: 'n-ta-in', toNodeId: 'n-ta-out',
        geometry: { kind: 'custom', actualInsideDiameterIn: 0.75, roughnessFt: 0.00015 },
        actualLengthFt: 0, elements: [] },
      { id: 's-tb', name: 'Terminal B', role: 'terminal', fromNodeId: 'n-tb-in', toNodeId: 'n-tb-out',
        geometry: { kind: 'custom', actualInsideDiameterIn: 0.75, roughnessFt: 0.00015 },
        actualLengthFt: 0, elements: [] },
      { id: 'r-a', name: 'Return A', role: 'return', fromNodeId: 'n-ta-out', toNodeId: 'n-j2',
        geometry: { kind: 'custom', actualInsideDiameterIn: 1.0, roughnessFt: 0.00015 },
        actualLengthFt: 30, elements: [] },
      { id: 'r-b', name: 'Return B', role: 'return', fromNodeId: 'n-tb-out', toNodeId: 'n-j2',
        geometry: { kind: 'custom', actualInsideDiameterIn: 1.0, roughnessFt: 0.00015 },
        actualLengthFt: 30, elements: [] },
      { id: 'r-main', name: 'Return Main', role: 'return', fromNodeId: 'n-j2', toNodeId: 'n-ps',
        geometry: { kind: 'custom', actualInsideDiameterIn: 2.0, roughnessFt: 0.00015 },
        actualLengthFt: 100, elements: [] },
    ],
    circuits: [
      { id: 'c-a', name: 'Circuit A', state: 'active', terminalDesignGpm: 10,
        supplySectionIds: ['s-main', 's-a'], terminalSectionId: 's-ta',
        returnSectionIds: ['r-a', 'r-main'] },
      { id: 'c-b', name: 'Circuit B', state: 'active', terminalDesignGpm: 20,
        supplySectionIds: ['s-main', 's-b'], terminalSectionId: 's-tb',
        returnSectionIds: ['r-b', 'r-main'] },
    ],
    margin: { percent: 0, categories: [], acknowledged: true },
  }],
  provenance: [],
}
// Expected: topology-error diagnostic,
// "System HW-1: mesh topology detected. Section s-cross creates a cross-connection
//  between nodes n-ta-in and n-tb-in. Only tree topology is supported."
```
