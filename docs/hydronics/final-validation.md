# HYD-006 final validation evidence (implementation handoff)

## Status and boundary

This document records Terra's retained HYD-006 validation/documentation implementation and its local test evidence. It is **not** a parent acceptance of HYD-006 and does not make the calculator field-certified, deployed, design-use-ready, or Fabel-integrated.

The application remains a standalone, loopback-only browser calculator for closed-loop, prescribed-design-flow, single-phase-liquid pressure-drop work. It reports actual-fluid head and loss-equivalent differential psi; it does not perform pump selection, pump curves, NPSH, static-pressure analysis, automatic sizing/balancing, open-system analysis, or field certification.

## Reproducible commands

Run from `C:/Users/Victor Colosi/dev/PRD maker/hydronics` after installing the package dependencies:

```text
npm run build
npm test
npm run qualify
node test/persistence-browser.mjs
npm run test:final-browser
```

The required order is build before tests. The commands run for this handoff passed with:

- strict TypeScript/Vite production build;
- Vitest: **7 files / 203 tests**;
- reference-data qualification: all approved regression limits passed;
- persistence Chrome/Vite workflow on test-owned loopback `127.0.0.1:5176`;
- final Chrome/Vite workflow on test-owned loopback `127.0.0.1:5177`.

Both browser scripts start and stop their own Vite and Chrome processes. They do not bind, stop, or otherwise modify the parent-owned local preview on `127.0.0.1:5175`.

`test/browser.mjs` remains the accepted HYD-004 retained browser workflow and binds 5175 by design. It was not rerun in this implementation handoff because the existing parent preview owns that strict port; its accepted evidence is retained in `ui-acceptance.md`. Run it only when an exclusive owned 5175 server arrangement is available.

## HYD-006 evidence map

| HYD-006 evidence requirement | Retained evidence |
| --- | --- |
| Water, glycol source nodes, units, bounds, interpolation and no extrapolation | `test/foundation.test.ts` verifies IAPWS Table 8, 216 independently extracted glycol nodes, dated volume-percent labels, interpolation, range guards, catalog dimensions and frozen data. `npm run qualify` independently checks the approved glycol density/viscosity/Re/head limits. |
| Darcy/regime/numerical checks | `test/math-matrix.test.ts` covers independent Poiseuille arithmetic, Colebrook residual, zero flow, exact 2000/4000 regime boundaries, invalid solver inputs, roughness/ID units and failure containment. |
| Losses, actual-fluid semantics and margin | `test/math-matrix.test.ts` covers K/EL equivalence, DOE presets, Cv psi/head cancellation, direct psi/head, all loss categories/quantities and the 25% pipe-only A/B governing crossover. |
| Legacy arithmetic fixture | `test/math-matrix.test.ts` retains the declared 1800-GPM, 10.02-in-ID, 15-ft legacy-property arithmetic fixture and explicitly documents its precise-gravity/unit difference from the workbook cache value. It is arithmetic evidence only, not legacy-workbook authority. |
| Shared-flow/network/topology | `test/topology-matrix.test.ts` and `test/final-corrections.test.ts` cover 10+20=30 shared flow, direct/reverse return, asymmetric return, governing/ties, all-active completeness, invalid topology, duplicate/reused identity, malformed containers and finite overflow behavior. |
| JSON/autosave/report safety | `test/ui/persistence.test.ts` and `test/persistence-browser.mjs` cover versioned untrusted input validation, import non-replacement, local acceptance/staleness/imported-history lifecycle, invalid raw recovery, CSV quoting/formula safety/reconciliation, print CSS/report, and localStorage read/write failure handling. |
| Final cross-stage browser lifecycle | `test/final-browser.mjs`, owned port 5177, begins with the fresh synthetic 10+20=30-GPM project, confirms applicability and locally accepts it; changing demand 20→40 proves both common sections derive 50 GPM, stales confirmations and the prior snapshot, blocks acceptance, requires requalification, and explicitly accepts a new result. It repeats stale/requalification/reacceptance after a fluid change, verifies unresolved `1e` raw input blocks acceptance while historical values remain, and fails on console/page errors or requests outside its loopback origin. |

## Workbook example cross-check (parent, out-of-tree)

The legacy workbook's `Calc Ex (K)` example sheet was replayed end to end through the engine as an independent parent check. All 92 element rows were driven at the sheet's own GPM, actual inside diameters, lengths, K values, equivalent lengths and PSID values, using named IAPWS water at 49°F and a 25% margin on the pipe and fitting categories only.

| Quantity | Workbook cached (ft) | Engine (ft) | Delta |
| --- | --- | --- | --- |
| Pipe/fittings subtotal | 27.36853 | 27.37844 | +0.036% |
| 25% margin on pipe/fittings | 6.84213 | 6.84461 | +0.036% |
| Valves/components subtotal | 63.71858 | 63.72774 | +0.014% |
| **Total** | **97.92924** | **97.95080** | **+0.0216 ft, +0.022%** |

Maximum single-row absolute difference is 0.080%. The differences are convention differences, not disagreements about method:

- K and velocity-head rows differ by a uniform +0.0801%, which is the workbook's `g = 32.2 ft/s²` against standard gravity 9.80665 m/s² (ratio 1.000808).
- Pipe friction rows differ by −0.0725%, the same gravity effect combined with IAPWS viscosity at 49°F against the workbook's single rounded 0.000899 lb/(ft·s) value.
- Direct-PSID rows differ by at most 0.0103%, because the engine converts psi with actual fluid density instead of the constant 2.307 ft/psi.

The engine is not adjusted to reproduce the workbook's rounded constants. The example row data stays in the operating-system temporary folder and is not copied into this repository, because the workbook and its example content are proprietary. The replay script is retained at `%LOCALAPPDATA%/Temp/hydronics-sources/parent-workbook-example-check.test.ts`.

## Preservation and scope checks

The HYD-006 implementation adds an isolated final browser test and its package script plus this documentation. It does not change engine source/data, the original engine tests, workbook, Fabel workspace, root tooling, credentials, Linear state, or the parent preview server. `git diff --check` and `git diff --cached --name-only` were checked after validation; no staged files were present.

## Residual limitations

- The existing 5175 HYD-004 browser suite remains port-conflicted with the parent preview in this handoff; its prior accepted evidence remains authoritative until rerun under exclusive ownership.
- Browser automation verifies retained functional scenarios, not printer-driver pagination across every OS/browser or spreadsheet behavior in every office application.
- The local app has no backend, user accounts, cloud synchronization, PDF-generation service, collaboration, deployment, pump curves, balancing solver, or design/field certification.
- Only named water and dated discrete 30/40/50 volume-percent glycol reference datasets are supported in their declared ranges. No extrapolation, concentration interpolation, or absolute-pressure/phase suitability inference is provided.
