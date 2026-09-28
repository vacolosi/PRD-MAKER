# Hydronic pressure-drop editor and engine (HYD-001–004)

> **Retired.** The engine now lives in `vacolosi/Heat-Load-Calcs` as
> `packages/hydronic-pd`, which is its source of truth (copied from commit
> `2fd601c`). Don't fix bugs or add features here, because nothing copies them
> across anymore. This folder is kept as a record and for the standalone editor.

Standalone TypeScript calculation engine for prescribed-design-flow closed hydronic circuits. It contains a local browser editor for HYD-004, plus no persistence, Fabel integration, workbook access, pump curves, balancing solver, static-lift calculation, or automatic pipe sizing**.

Run from this directory:

```sh
npm ci
npm run build                 # strict TypeScript typecheck; run before tests
npm test
npm run qualify               # retained HYD-001 reference-data qualification
```

## Public API

`src/engine/index.ts` is the only public barrel. In addition to immutable named fluid/catalog/preset references and SI/IP adapters, it exports:

- `resolvePipeGeometry`, `hydraulicState`, `colebrookDarcyFrictionFactor`, and `evaluateSectionLoss` for pure section-level Darcy/Colebrook loss calculation and itemization.
- `currentApplicabilityBasis` for a fresh current reference-data/flow/geometry/element/envelope basis. It binds to `HYDRONIC_REFERENCE_DATA_VERSION`; old missing versions are invalid rather than backfilled.
- `validateHydronicTopology` and `evaluateHydronicSystem` for explicit directed discharge → supply → one terminal → return → suction known-flow circuits.

The evaluator derives shared section GPM from active terminal membership, evaluates each physical section once, and reuses that same immutable result object on every traversing circuit. System GPM is the active-demand sum and system head is the maximum complete **factored** circuit head—not a sum of parallel paths. It emits itemized pipe/fitting/valve/equipment results, regime/state data, category subtotals, margin subtotals, topology/applicability diagnostics, and deterministic governing ties.

## Calculation limits and safeguards

Use actual inside diameter and explicit roughness. `Re < 2000` uses Darcy `64/Re`; the inclusive `2000 <= Re <= 4000` transition interval blocks a complete recommendation; `Re > 4000` uses a bounded residual-checked Colebrook solve. Zero flow is a safe low-level zero-loss case, while active terminal demands must be positive. Unsupported or nonfinite inputs, unavailable catalog entries, invalid topology, incomplete losses, and unacknowledged/invalid margins do not become zero or design-eligible.

Non-pipe inputs support manual K, fixed equivalent length, the two approved generic DOE Le/D elbows (turbulent-only), Cv, direct actual-fluid psi, and direct actual-fluid head. All require a matching explicit current applicability confirmation. Cv uses IAPWS 60°F water as its SG reference and correctly cancels actual-fluid density only in its head conversion; direct psi uses actual density. Generic DOE elbows are connection/manufacturer-unspecified estimates, not product qualification.

Head is feet of the actual pumped fluid; psi is its loss-equivalent differential—not arbitrary pump-flange static gauge pressure or absolute pressure. The engine is a bounded calculator milestone, not field-certified pump selection or a general hydraulic-network solver. An independent numerical/topology review remains required before UI or persistence work.

## HYD-004 browser editor

```sh
npm run build                 # strict check, then Vite bundle
npm run dev                   # loopback-only http://127.0.0.1:5175 (strict port)
npm run test:app
npm run test:browser          # starts its own loopback Vite server and uses installed Chrome
```

`test:browser` launches `C:/Program Files/Google/Chrome/Application/chrome.exe` through Playwright with Playwright's isolated temporary profile; set `HYDRONICS_CHROME` only to override that executable path. It does not use a personal Chrome profile. The editor is intentionally an unsaved browser session; persistence, accepted snapshots, and exports are HYD-005 work.
