# HYD-005 — local persistence, reviewed snapshots and exports

## Authorization and ownership

Implement **HYD-005 / HEDMEP-202** in the accepted standalone calculator under `hydronics/`. Terra (`azure-openai-responses/gpt-5.6-terra`) is sole application/test writer. Claude Opus4.6 is the independent reviewer, per Victor. Astra owns parent verification and acceptance.

Accepted inputs:
- foundation: `foundation-parent-review.md`
- engine: `engine-acceptance.md`
- editor/Show-the-math: `ui-acceptance.md`
- approved product contract: persistence/review/report sections of `implementation-plan.md`

Do not reopen or alter accepted engine/UI behavior to simplify persistence. Refactoring UI code into focused components/hooks/pure helpers is allowed when behavior and accessible controls remain intact. No unresolved product/source decision blocks this stage.

## Scope and boundaries

Deliver local-only:
1. versioned JSON download/open;
2. browser-local autosave and recovery, including recoverable invalid raw edits;
3. explicit local reviewed-result acceptance and current/stale/imported-history lifecycle;
4. self-contained print report;
5. itemized, spreadsheet-safe CSV export.

No backend/account/cloud sync, collaboration, authentication, PDF service, deployment or Fabel integration. No automatic sizing, balancing, pumps or new hydraulic formulas. Work in `hydronics/` plus the configured delivery report. Preserve engine/data and original five engine tests. Dependencies/config only in `hydronics`; prefer browser/platform APIs and current React/Vite/Playwright. No root tooling changes, credentials/Linear in this slice, workbook/Fabel edits, staging/commit/push/PR/deploy or child agents.

## File and autosave contracts

Define explicit app-level schemas without changing the engine's portable contract:
- downloaded project envelope, e.g. `hydronic-pressure-drop-file@1`;
- local editor draft/autosave, e.g. `hydronic-pressure-drop-editor-draft@1`.

Keep `HydronicProject` as the normalized calculation input. A downloaded envelope may include an optional historical accepted snapshot. Do not serialize derived results back into section/circuit inputs or make them authoritative inputs.

### Validate before replacement/evaluation

Treat imported JSON and localStorage as untrusted. Parse and validate into a separate candidate before touching current UI state. Reject without replacing current work:
- malformed JSON, wrong/unknown schema/version or wrong root/container type;
- missing/wrong primitive types, nonfinite numbers/coercible strings/null numeric values;
- empty/duplicate IDs, unsafe missing references, unsupported fluid/type/category/geometry/catalog values;
- malformed applicability/accepted-snapshot/version/result shapes;
- excessive file size, string length, nested array/entity counts.

Choose documented conservative bounds large enough for ordinary engineering work; do not silently truncate. Reserved string IDs supported by the engine must not create prototype-key hazards. Use Map/Set/own-key-safe structures, not unguarded object indexing. Preserve a visible diagnostic and the pre-import project/draft/acceptance when import fails. Unknown future versions require a clear migration-not-supported message; no best-effort coercion.

Successful open replaces the normalized project and editor draft atomically, selects a valid existing circuit or safe fallback, recalculates through the public engine, and reports what was loaded. An accepted snapshot from a downloaded/imported file is **historical and untrusted locally** even when its versions and results match. It may be displayed as imported history but cannot make the current project locally accepted. The engineer must explicitly accept again.

### JSON download

Download UTF-8 JSON with deterministic, human-readable formatting and a safe filename. Include:
- envelope schema;
- full normalized `HydronicProject` inputs;
- current `hydronicVersionMetadata`/calculation data identity;
- optional accepted snapshot described below.

If raw editor text is invalid, do not call it a valid project save. Disable normal project download or explicitly label any alternate as last-valid normalized input; this milestone may simply disable download until raw input is valid. Never serialize NaN/Infinity as null without rejecting first.

### Autosave and recovery

Use one versioned localStorage key and visible state: saved, pending, failed, restored, or disabled/corrupt. Autosave only after bounded debounce/change handling; catch quota/security/storage exceptions and never claim success after failure.

Autosave records:
- latest normalized last-valid project;
- raw numeric draft strings and enough validation/error state to restore pending invalid edits faithfully;
- selected UI circuit may be stored for convenience but is excluded from acceptance freshness;
- local accepted snapshot and its local-trust state.

Invalid text such as blank, `1e`, junk, nonfinite or positive underflow must reload visibly as unresolved invalid work and keep final readiness/acceptance blocked. The UI must distinguish **recoverable editor draft saved** from **valid project saved**. Do not overwrite a corrupt/unrecognized autosave with the starter merely because startup fallback rendered. Preserve it until the user explicitly discards/resets or downloads recovery text. Provide a clear `Reset to synthetic example / discard local draft` control with confirmation or comparably explicit action. Normal first launch still gets the synthetic starter.

Bound raw-draft keys/values and ensure they refer to known editable fields where feasible; unexpected entries cannot inject markup or poison identity maps.

## Reviewed-result acceptance and staleness

Add a clearly named **Accept reviewed result** action, distinct from applicability confirmation and save. It is enabled only when:
- current raw editor state is valid;
- all active topology/loss/math/margin requirements make the current engine result design-eligible;
- current metadata is supported;
- an engineer performs the explicit action.

Capture an immutable accepted snapshot containing:
- full normalized project/system calculation inputs (not only a hash);
- schema, engine version and reference-data version;
- raw and factored governing heads/psi and **all** governing IDs/ties;
- per-system/circuit raw, margin and factored result summaries sufficient to display the reviewed historical result;
- acceptance timestamp as metadata, not freshness input.

Fresh/current requires semantic equality of the current normalized inputs and active version metadata plus valid current raw text. Exclude ephemeral UI state (selected inspector, expanded panels) and timestamps. Canonical comparison must not depend on object key insertion order. A relevant edit—including shared flow, fluid/T, section geometry/length, loss data/applicability, circuits/demand/state or margin—makes prior acceptance stale immediately while retaining its historical values. Conservative staleness for named/provenance input changes is acceptable. Reverting exactly to the accepted normalized state may restore current status only for a locally trusted snapshot; imported snapshots remain historical/untrusted until a new local action.

Status must distinguish at least:
- not accepted;
- locally accepted/current;
- locally accepted but stale, with prior values visible;
- imported historical snapshot, not locally trusted;
- invalid draft with prior accepted result stale/visible.

Loading/importing, recomputation or version equality never constitutes human acceptance. If an imported file includes a snapshot marked trusted, ignore/downgrade that trust. Local autosave may restore a locally created acceptance and its freshness state, because it remains in the same local application store; document the distinction.

## Print and CSV

### Print

Provide a print action using local browser printing and `@media print`; no service/upload. Printed content must be self-contained and clearly label project/system, date, engine/reference versions, fluid/T, scope/limitations, acceptance state/current-vs-stale/imported status, margin, all active circuit summaries/governors/ties, diagnostics and selected/all itemized math sufficient to reproduce headline totals. Missing/provisional values print as unavailable with reasons, never false zero. Hide editing controls and avoid clipped tables. User strings remain text, not HTML.

### CSV

Download UTF-8 itemized CSV with explicit units and enough columns to reconcile circuit totals: project/system/circuit/section/item identity, state/flow, geometry, Re/regime/factor/rate, kind/category/quantity/coefficient or basis, item head/psi, category/section/circuit raw/margin/factored values, governor flags, applicability/provenance and diagnostics/version/status. Engine outputs are authoritative; do not recompute physics.

Correctly quote delimiters, quotes and newlines. Prevent spreadsheet formula injection for every user/reference text cell beginning after optional leading whitespace with `=`, `+`, `-`, `@`, tab or carriage-return (prefix a single quote or another documented neutralization). Do not corrupt numeric columns by converting ordinary negative/positive numeric values into text; numeric values are engine-validated and emitted as numeric cells. Unknown values are blank plus diagnostic/status, never0. Add pure tests for escaping and exported-total parity.

## User experience

- Add a compact Review & files area with Save JSON, Open JSON/file input, autosave status, Reset/discard, acceptance status/action, Print and CSV.
- Buttons have accessible names; file input error is associated/announced. Never destroy current work on failed import.
- Display current/historical snapshot values in a readable panel; imported status cannot resemble current local acceptance.
- Preserve raw invalid input when navigating and across local reload. Current editor's global provisional labeling remains truthful.
- Continue the unsaved/local-only privacy statement, updated to accurately describe autosave and local downloads. No telemetry or external runtime requests/assets.

## Tests and validation

Create pure helper modules/tests for schema validation, canonical freshness, snapshots, autosave envelopes and CSV escaping. Keep browser scenarios isolated: clear the versioned localStorage key at scenario start unless the scenario explicitly tests restore. Use only isolated Playwright Chrome profiles and loopback5175.

Minimum retained browser outcomes:
1. Reach ready, locally accept, verify accepted/current with stored raw/factored values and all governors; change a relevant field and see stale while historical values remain; revert exactly and see current again. Inspector selection alone does not stale.
2. Accept common loss at30GPM and result; change second demand20→40: common flow50, applicability stale, result/accept action blocked, prior accepted snapshot stale and visible. Requalify all needed rows, recalculate and explicitly reaccept; new snapshot becomes current.
3. Download JSON and inspect schema/project/metadata/snapshot. Change current work, reopen the file, verify normalized inputs restored but included snapshot is imported historical/untrusted and requires local reacceptance.
4. Attempt malformed JSON, unknown schema, wrong/null/numeric-string fields, unsafe references and an oversized file: current project/raw/acceptance remain unchanged and an actionable error appears.
5. Create invalid raw text, observe prior acceptance stale, wait for visible recoverable-draft autosave, reload and see exact invalid text/error restored with acceptance blocked and previous accepted values visible. Correct it and observe valid-project autosave/status. Simulate storage write/read failure in pure tests or browser without losing current work.
6. Put commas, quotes, newlines and formula-prefix strings in user names/provenance. Download CSV; parse it independently, confirm neutralization and row/totals parity with visible engine result. Unknown/provisional results remain blank/reasoned.
7. Trigger Print through a stubbed `window.print`, verify print report content/status/versions/totals/limitations in the DOM and print CSS hides controls. No external requests, console/page errors or lingering owned processes.
8. Existing expanded HYD-004 browser workflows and195 tests remain; engine/data hashes unchanged; qualification passes.

Run strict build **before** all tests, qualification and browser suite. Parent will inspect source and independently reproduce import-preservation, autosave-invalid recovery, stale/current/import trust, CSV safety/parity and print behavior before Opus review.

## Handoff / next gate

Write `.pi/research/hydronics-terra-persistence-handoff.md` with changed files, schema/storage contracts, exact commands/results, downloaded test-artifact/screenshot/log paths, acceptance lifecycle evidence, source/test preservation, preview ownership and residual limitations. Stop for parent/Opus review. Do not begin HYD-006 broad final validation or mark the application design-ready.
