# HYD-INT-02: Add hydronic criteria to Basis of Design

Implementation spec for the Fabel agent. Source contract: `C:/Users/Victor Colosi/dev/PRD maker/docs/hydronics/int01-contract.md` (all 8 decisions approved).

## Goal

The engineer sets reusable hydronic project service criteria and per-system overrides at project setup. This is the first new hydronic code in Fabel. No engine evaluation, no physical piping, no riser changes.

## What to build

### 1. New types: `HydronicCriteria` and friends

Create a new file `packages/web/src/viewer/hydronicCriteria.ts` (same pattern as `ventilation.ts`).

```typescript
// Supported engine fluid reference IDs (pinned from hydronic-pressure-drop@1 contract)
export type FluidReferenceId =
  | 'iapws-liquid-water-sr6-08-2011'
  | 'dowfrost-pg-30vol-2001-09'
  | 'dowfrost-pg-40vol-2001-09'
  | 'dowfrost-pg-50vol-2001-09'
  | 'dowtherm-sr1-eg-30vol-2008-02'
  | 'dowtherm-sr1-eg-40vol-2008-02'
  | 'dowtherm-sr1-eg-50vol-2008-02';

export type HydronicService = 'heating-water' | 'chilled-water';

export type LossCategory = 'pipe' | 'fitting' | 'valve' | 'equipment';

/** Host-facing selectors. They compile to engine PipeCatalogSelection.catalogId;
 *  the engine never receives material/schedule as separate fields. */
export type PipeMaterial = 'steel' | 'copper';
export type PipeSchedule = 'sch10' | 'sch40' | 'sch80' | 'type-k' | 'type-l' | 'type-m';
export const PIPE_SCHEDULES_BY_MATERIAL = {
  steel: ['sch10', 'sch40', 'sch80'],
  copper: ['type-k', 'type-l', 'type-m'],
} as const satisfies Record<PipeMaterial, readonly PipeSchedule[]>;

/** Project-level defaults, one set per service. */
export interface HydronicServiceDefaults {
  fluidReferenceId?: FluidReferenceId;
  supplyDesignTempF?: number;
  returnDesignTempF?: number;
  /** If both supply and return are set, derived = supply - return.
   *  If explicitly overridden, store the override and flag disagreement. */
  designDeltaTFOverride?: number;
  meanCalculationTempFOverride?: number;
  defaultPipeMaterial?: PipeMaterial;
  defaultPipeSchedule?: PipeSchedule;
  /** feet, or undefined = use catalog default */
  roughnessPolicyFt?: number;
  roughnessConditionSource?: string;
  safetyFactorPercent?: number;
  safetyFactorCategories?: LossCategory[];
}

/** Per-system criteria. Sparse overrides over the project service defaults. */
export interface HydronicSystemCriteria {
  id: string;              // hydSys-N-timestamp
  name: string;
  service: HydronicService;
  // Every field below is optional = "inherit from project default for this service"
  fluidReferenceId?: FluidReferenceId;
  supplyDesignTempF?: number;
  returnDesignTempF?: number;
  designDeltaTFOverride?: number;
  meanCalculationTempFOverride?: number;
  pipeMaterial?: PipeMaterial;
  pipeSchedule?: PipeSchedule;
  roughnessFtOverride?: number;
  roughnessConditionSource?: string;
  safetyFactorPercent?: number;
  safetyFactorCategories?: LossCategory[];
  safetyFactorAcknowledged?: boolean;
  /** Optional source linkage to existing air system */
  sourceAirSystemId?: string;
}

/** Top-level criteria container on ProjectSlice */
export interface HydronicCriteriaState {
  /** Project defaults keyed by service */
  serviceDefaults: Partial<Record<HydronicService, HydronicServiceDefaults>>;
  /** Authored systems with per-system overrides */
  systems: HydronicSystemCriteria[];
}

export function emptyHydronicCriteria(): HydronicCriteriaState {
  return { serviceDefaults: {}, systems: [] };
}

/**
 * Pre-seed a material-specific family when the engineer creates a service
 * default: steel -> Sch 40 and copper -> Type L. These are visible/editable
 * starting choices, never hidden engine defaults and never inferred from HW
 * versus CHW service. A service still has no usable pipe geometry until a
 * section selects a supported nominal size and compiles a full catalog ID.
 */
export function defaultPipeScheduleFor(material: PipeMaterial): PipeSchedule {
  return material === 'steel' ? 'sch40' : 'type-l';
}

/** Maps a resolved host selection + nominal size to the engine's exact ID.
 * Example: steel/sch40/2 -> steel-sch40-2; copper/type-l/1.25 -> copper-type-l-1-25. */
export function pipeCatalogId(material: PipeMaterial, schedule: PipeSchedule, nominalIn: number): string {
  const allowed: readonly PipeSchedule[] = PIPE_SCHEDULES_BY_MATERIAL[material];
  if (!allowed.includes(schedule)) throw new RangeError(`${schedule} is not valid for ${material}`);
  return `${material}-${schedule}-${String(nominalIn).replace('.', '-')}`;
}

// --- ID generation (prefix-counter-timestamp, same as addSystem/addZone) ---

let hydSysCounter = 0;

export function nextHydronicSystemId(): string {
  return `hydSys-${++hydSysCounter}-${Date.now().toString(36)}`;
}

/** Call on project open to re-seed counter past existing IDs (modeled on reconcileRoomIds). */
export function reconcileHydronicSystemIds(systems: HydronicSystemCriteria[]): void {
  for (const s of systems) {
    const match = s.id.match(/^hydSys-(\d+)-/);
    if (match) hydSysCounter = Math.max(hydSysCounter, Number(match[1]));
  }
}

// --- Resolution: effective value = explicit override ?? project service default ---

export interface ResolvedSystemCriteria {
  id: string;
  name: string;
  service: HydronicService;
  fluidReferenceId: FluidReferenceId | undefined;  // undefined = unset, blocks evaluation
  supplyDesignTempF: number | undefined;
  returnDesignTempF: number | undefined;
  designDeltaTF: number | undefined;      // derived or overridden
  meanCalculationTempF: number | undefined;  // derived or overridden
  pipeMaterial: PipeMaterial | undefined;
  pipeSchedule: PipeSchedule | undefined;
  roughnessFt: number | 'catalog-default';
  safetyFactorPercent: number | undefined;
  safetyFactorCategories: LossCategory[];
  safetyFactorAcknowledged: boolean;
  /** Per-field: 'explicit' | 'inherited' | 'unset' */
  sources: Record<string, 'explicit' | 'inherited' | 'unset'>;
}

export function resolveSystemCriteria(
  system: HydronicSystemCriteria,
  defaults: HydronicServiceDefaults | undefined,
): ResolvedSystemCriteria {
  const d = defaults ?? {};
  const resolve = <T>(explicit: T | undefined, inherited: T | undefined): { value: T | undefined; source: 'explicit' | 'inherited' | 'unset' } => {
    if (explicit !== undefined) return { value: explicit, source: 'explicit' };
    if (inherited !== undefined) return { value: inherited, source: 'inherited' };
    return { value: undefined, source: 'unset' };
  };

  const fluid = resolve(system.fluidReferenceId, d.fluidReferenceId);
  const supplyT = resolve(system.supplyDesignTempF, d.supplyDesignTempF);
  const returnT = resolve(system.returnDesignTempF, d.returnDesignTempF);
  const roughness = resolve(system.roughnessFtOverride, d.roughnessPolicyFt);
  const sfPercent = resolve(system.safetyFactorPercent, d.safetyFactorPercent);
  const sfCats = resolve(system.safetyFactorCategories, d.safetyFactorCategories);

  // Delta-T: explicit override, or derived from supply - return if both set
  let designDeltaTF: number | undefined;
  let deltaTSource: 'explicit' | 'inherited' | 'unset' = 'unset';
  if (system.designDeltaTFOverride !== undefined) {
    designDeltaTF = system.designDeltaTFOverride;
    deltaTSource = 'explicit';
  } else if (d.designDeltaTFOverride !== undefined) {
    designDeltaTF = d.designDeltaTFOverride;
    deltaTSource = 'inherited';
  } else if (supplyT.value !== undefined && returnT.value !== undefined) {
    designDeltaTF = Math.abs(supplyT.value - returnT.value);
    deltaTSource = 'inherited'; // derived from inherited/explicit temps
  }

  // Mean temp: explicit override, or derived from (supply + return) / 2 if both set
  let meanCalculationTempF: number | undefined;
  let meanSource: 'explicit' | 'inherited' | 'unset' = 'unset';
  if (system.meanCalculationTempFOverride !== undefined) {
    meanCalculationTempF = system.meanCalculationTempFOverride;
    meanSource = 'explicit';
  } else if (d.meanCalculationTempFOverride !== undefined) {
    meanCalculationTempF = d.meanCalculationTempFOverride;
    meanSource = 'inherited';
  } else if (supplyT.value !== undefined && returnT.value !== undefined) {
    meanCalculationTempF = (supplyT.value + returnT.value) / 2;
    meanSource = 'inherited';
  }

  return {
    id: system.id,
    name: system.name,
    service: system.service,
    fluidReferenceId: fluid.value as FluidReferenceId | undefined,
    supplyDesignTempF: supplyT.value,
    returnDesignTempF: returnT.value,
    designDeltaTF,
    meanCalculationTempF,
    pipeMaterial: resolve(system.pipeMaterial, d.defaultPipeMaterial).value,
    pipeSchedule: resolve(system.pipeSchedule, d.defaultPipeSchedule).value,
    roughnessFt: roughness.value ?? 'catalog-default',
    safetyFactorPercent: sfPercent.value,
    safetyFactorCategories: sfCats.value ?? [],
    safetyFactorAcknowledged: system.safetyFactorAcknowledged ?? false,
    sources: {
      fluidReferenceId: fluid.source,
      supplyDesignTempF: supplyT.source,
      returnDesignTempF: returnT.source,
      designDeltaTF: deltaTSource,
      meanCalculationTempF: meanSource,
      roughnessFt: roughness.source,
      safetyFactorPercent: sfPercent.source,
      safetyFactorCategories: sfCats.source,
    },
  };
}
```

### 2. Add to ProjectSlice

In `store.ts`, add to `ProjectSlice` (after `airflowPolicy`, around line 627):

```typescript
/** Hydronic PD criteria (#INT-02): project service defaults and per-system
 *  overrides. Additive — pre-hydronic saves load with no criteria. */
hydronicCriteria?: HydronicCriteriaState;
```

**Not in `PROJECT_CONTENT_KEYS`.** Hydronic criteria changes do not stale airside sizing runs. They will stale hydronic PD results through a separate `hydronicDesignRevision` counter added in a later INT package.

### 3. Store actions

Add to the action interface (near `setVentProjectSettings`, around line 1317):

```typescript
// Hydronic criteria (#INT-02)
setHydronicServiceDefaults: (service: HydronicService, patch: Partial<HydronicServiceDefaults>) => void;
addHydronicSystem: (service: HydronicService, name?: string) => string;
updateHydronicSystem: (systemId: string, patch: Partial<Omit<HydronicSystemCriteria, 'id'>>) => void;
deleteHydronicSystem: (systemId: string) => void;
```

Implement them in the `set()` block (near `setVentProjectSettings` implementation, around line 1991):

```typescript
setHydronicServiceDefaults: (service, patch) =>
  set((s) => {
    s.hydronicCriteria ??= emptyHydronicCriteria();
    const existing = s.hydronicCriteria.serviceDefaults[service] ?? {};
    s.hydronicCriteria.serviceDefaults[service] = { ...existing };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete (s.hydronicCriteria.serviceDefaults[service] as any)[k];
      else (s.hydronicCriteria.serviceDefaults[service] as any)[k] = v;
    }
  }),
addHydronicSystem: (service, name) => {
  const id = nextHydronicSystemId();
  set((s) => {
    s.hydronicCriteria ??= emptyHydronicCriteria();
    const n = s.hydronicCriteria.systems.filter(sys => sys.service === service).length + 1;
    s.hydronicCriteria.systems.push({
      id,
      name: name ?? `${service === 'heating-water' ? 'HW' : 'CHW'}-${n}`,
      service,
    });
  });
  return id;
},
updateHydronicSystem: (systemId, patch) =>
  set((s) => {
    const sys = s.hydronicCriteria?.systems.find(x => x.id === systemId);
    if (!sys) return;
    Object.assign(sys, patch);
  }),
deleteHydronicSystem: (systemId) =>
  set((s) => {
    if (!s.hydronicCriteria) return;
    s.hydronicCriteria.systems = s.hydronicCriteria.systems.filter(x => x.id !== systemId);
  }),
```

### 4. Persistence

In `persistence.ts`, add to `serialize()` (around line 232, after `airflowPolicy`):

```typescript
...(s.hydronicCriteria !== undefined ? { hydronicCriteria: s.hydronicCriteria } : {}),
```

In `applyFile()`, backfill on load and call `reconcileHydronicSystemIds`:

```typescript
hydronicCriteria: saved.hydronicCriteria,
// (after store hydration)
if (saved.hydronicCriteria?.systems) {
  reconcileHydronicSystemIds(saved.hydronicCriteria.systems);
}
```

Add `hydronicCriteria` to `SavedProject`'s optional `Partial<Pick<...>>` union.

### 5. V2 adapter: projection

Create `packages/web/src/v2/adapters/projections/hydronicCriteria.ts`:

```typescript
import type { ViewerState } from '../../../viewer/store';
import type { DeepReadonly } from './shape';
import type { HydronicCriteriaState } from '../../../viewer/hydronicCriteria';
import { resolveSystemCriteria, type ResolvedSystemCriteria } from '../../../viewer/hydronicCriteria';

export type HydronicCriteriaProjection = DeepReadonly<{
  criteria: HydronicCriteriaState | undefined;
  resolved: ResolvedSystemCriteria[];
}>;

export function hydronicCriteriaProjection(s: ViewerState): HydronicCriteriaProjection {
  const criteria = s.hydronicCriteria;
  const resolved = (criteria?.systems ?? []).map(sys =>
    resolveSystemCriteria(sys, criteria?.serviceDefaults[sys.service])
  );
  return { criteria, resolved };
}
```

Export from `projections/index.ts`.

### 6. V2 adapter: commands

Create `packages/web/src/v2/adapters/commands/hydronicCriteria.ts`:

```typescript
import { useViewer, type ViewerState } from '../../../viewer/store';

export const setHydronicServiceDefaults: ViewerState['setHydronicServiceDefaults'] = (service, patch) =>
  useViewer.getState().setHydronicServiceDefaults(service, patch);
export const addHydronicSystem: ViewerState['addHydronicSystem'] = (service, name) =>
  useViewer.getState().addHydronicSystem(service, name);
export const updateHydronicSystem: ViewerState['updateHydronicSystem'] = (systemId, patch) =>
  useViewer.getState().updateHydronicSystem(systemId, patch);
export const deleteHydronicSystem: ViewerState['deleteHydronicSystem'] = (systemId) =>
  useViewer.getState().deleteHydronicSystem(systemId);
```

Export from `commands/index.ts`.

### 7. BoD page: HydronicCriteriaPage

Create `packages/web/src/v2/pages/HydronicCriteriaPage.tsx`. Pure component, takes `HydronicCriteriaProjection` as props. Shows:

- Project service defaults section (HW and CHW tabs/sections)
  - Fluid selection (dropdown of the 7 supported FluidReferenceIds with human-readable labels)
  - Supply and return design temperatures (degrees F inputs)
  - Derived delta-T (read-only when derived, editable if overridden, show disagreement flag)
  - Mean calculation temperature (proposed from temps, must be confirmed)
  - Default pipe material and compatible schedule (pre-seed a visible/editable `steel` + `sch40` or `copper` + `type-l` family when that material is selected; never infer material from heating versus chilled-water service)
  - Roughness policy
  - Safety factor: percent, category checkboxes, acknowledgement, plus non-binding guidance text: `Typical: 10% on pipe + fitting` (do not pre-fill a value or categories)

- Per-system list
  - Add system button (HW or CHW)
  - Each system card shows: name, service, and every overridable field
  - Each field shows effective value + source badge (explicit/inherited/unset)
  - Clearing an override restores inheritance
  - Delete system with confirmation

- Validation summary
  - Missing required fields listed with "set in [location]" guidance
  - Zero safety factor shows "acknowledged" or "requires acknowledgement"

Add to `basisPages.test.tsx`:

```typescript
it('Hydronic Criteria renders project defaults and system overrides', () => {
  const html = renderToStaticMarkup(
    <HydronicCriteriaPage hydronicCriteria={{
      criteria: {
        serviceDefaults: {
          'heating-water': {
            fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
            supplyDesignTempF: 180,
            returnDesignTempF: 160,
          }
        },
        systems: [{
          id: 'hydSys-1-test', name: 'HW-1', service: 'heating-water',
        }]
      },
      resolved: [{
        id: 'hydSys-1-test', name: 'HW-1', service: 'heating-water',
        fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
        supplyDesignTempF: 180, returnDesignTempF: 160,
        designDeltaTF: 20, meanCalculationTempF: 170,
        pipeMaterial: undefined, pipeSchedule: undefined,
        roughnessFt: 'catalog-default',
        safetyFactorPercent: undefined, safetyFactorCategories: [],
        safetyFactorAcknowledged: false,
        sources: {
          fluidReferenceId: 'inherited', supplyDesignTempF: 'inherited',
          returnDesignTempF: 'inherited', designDeltaTF: 'inherited',
          meanCalculationTempF: 'inherited', roughnessFt: 'unset',
          safetyFactorPercent: 'unset', safetyFactorCategories: 'unset',
        },
      }]
    }} />,
  );
  expect(html).toContain('HW-1');
  expect(html).toContain('180');
  expect(html).toContain('160');
  expect(html).toContain('inherited');
});
```

### 8. Wire the page into the BoD navigation

Add a "Hydronic Criteria" entry to whatever navigation structure the BoD workspace uses (look at how General, Weather, Building Data, Space Types, System Types, Sheet Library are listed and add alongside them).

## What NOT to do

- Do not add `hydronicCriteria` to `PROJECT_CONTENT_KEYS`. It does not stale airside sizing runs.
- Do not modify `packages/vent-calc`, `packages/pressure-drop`, or the hydronic riser pipeline.
- Do not import or install the standalone hydronic engine package yet (that's INT-08).
- Do not create nodes, sections, circuits, equipment, or ports (those are INT-03 through INT-07).
- Do not modify the existing `ventilation.heatingFluid`/`hwEwtF`/`hwLwtF` fields. They keep working as they do now. The new hydronic criteria are a separate data path.
- Do not commit, push, or deploy without Victor's approval.

## Files to create or modify

| File | Action |
|---|---|
| `packages/web/src/viewer/hydronicCriteria.ts` | **Create.** Types, resolution, ID generation, reconciliation. |
| `packages/web/src/viewer/store.ts` | **Modify.** Add `hydronicCriteria?` to ProjectSlice, add 4 actions, implement them. |
| `packages/web/src/viewer/persistence.ts` | **Modify.** Add to serialize, SavedProject, applyFile. |
| `packages/web/src/v2/adapters/projections/hydronicCriteria.ts` | **Create.** Read-only projection. |
| `packages/web/src/v2/adapters/projections/index.ts` | **Modify.** Re-export. |
| `packages/web/src/v2/adapters/commands/hydronicCriteria.ts` | **Create.** Command delegates. |
| `packages/web/src/v2/adapters/commands/index.ts` | **Modify.** Re-export. |
| `packages/web/src/v2/pages/HydronicCriteriaPage.tsx` | **Create.** Pure BoD page. |
| `packages/web/src/v2/pages/basisPages.test.tsx` | **Modify.** Add render test. |
| BoD navigation (find the nav component) | **Modify.** Add Hydronic Criteria link. |

## Verification

1. `npm run build` (or the repo's build command) passes with no type errors.
2. `npm test` passes with the new test and no regressions.
3. Create two HW systems with different criteria. Change a project default and confirm only the inheriting system changes. Clear an override and confirm inheritance resumes.
4. Save/reopen a project. Confirm hydronic criteria survive the round trip.
5. Open a pre-hydronic save file. Confirm it loads without errors and has no phantom hydronic data.
6. Undo/redo adding a system. Confirm the system appears and disappears correctly.

## Fluid reference ID display labels

For the UI dropdown:

| `FluidReferenceId` | Display label |
|---|---|
| `iapws-liquid-water-sr6-08-2011` | Water (IAPWS) |
| `dowfrost-pg-30vol-2001-09` | Propylene glycol 30% vol (Dowfrost, Sep 2001) |
| `dowfrost-pg-40vol-2001-09` | Propylene glycol 40% vol (Dowfrost, Sep 2001) |
| `dowfrost-pg-50vol-2001-09` | Propylene glycol 50% vol (Dowfrost, Sep 2001) |
| `dowtherm-sr1-eg-30vol-2008-02` | Ethylene glycol 30% vol (Dowtherm SR-1, Feb 2008) |
| `dowtherm-sr1-eg-40vol-2008-02` | Ethylene glycol 40% vol (Dowtherm SR-1, Feb 2008) |
| `dowtherm-sr1-eg-50vol-2008-02` | Ethylene glycol 50% vol (Dowtherm SR-1, Feb 2008) |

## Temperature ranges (for input validation)

| Fluid | Min degrees F | Max degrees F |
|---|---|---|
| Water | 32 | 200 |
| All glycol | 30 | 200 |

Mean calculation temperature must fall within the fluid's supported range. Supply and return temps are engineering context and are not range-checked by the engine, but mean temp is.
