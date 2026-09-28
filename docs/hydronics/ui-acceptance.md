# HYD-004 standalone editor — parent acceptance

## Decision

**HYD-004 / HEDMEP-201 is accepted for the next persistence/reporting stage.** This accepts the local Vite/React editor, explicit applicability and margin workflow, live shared-section/circuit results, and selected-circuit Show-the-math interface. It does not accept persistence, imported files, accepted snapshots, autosave, CSV/print reporting, deployment, design-use readiness or Fabel integration.

Writer: Terra. Final reviewer: **Claude Opus 4.6**, selected by Victor after Sol usage was capped. Parent: Astra/orchestrator independent verification.

## Review closure

The initial UI review and bounded repair history are preserved in:
- `.pi/research/hydronics-ui-sol-review.md`
- `.pi/research/hydronics-ui-sol-repair-closure.md`
- `.pi/research/hydronics-ui-sol-final-closure.md`
- `.pi/research/hydronics-terra-ui-handoff.md`
- `.pi/research/hydronics-terra-ui-repair-handoff.md`
- `docs/hydronics/ui-parent-review.md`

Sol declared all finite runtime behavior GO and left only eight retained browser assertion areas. Terra `61fd1a77` changed only `hydronics/test/browser.mjs` to retain those cases. Opus `f29d4c87` independently reviewed every assertion area and returned **GO**, finding no vacuous or incidentally masked check. Its report is `.pi/research/hydronics-ui-opus-retained-closure.md`.

## Independent final evidence

Parent verified the only change after runtime GO was `hydronics/test/browser.mjs`, then reran on stable files:

| Gate | Result |
| --- | --- |
| Strict typecheck and Vite production build before tests | PASS |
| Vitest | **6 files /195 tests PASS** (accepted engine180 + additive UI15) |
| Reference qualification | PASS; approved data and limits unchanged |
| Expanded isolated installed-Chrome suite | PASS |
| Independent production-browser probes | **13/13 PASS**, zero probe errors |
| Accepted engine/source and original test preservation | PASS |
| Git whitespace/staged checks | PASS; no staged paths |

Evidence: `%LOCALAPPDATA%/Temp/hydronics-sources/parent-ui-retained-final-evidence.json`, `parent-ui-repair-probes.json`, and `parent-ui-retained-final-{build,tests,qualification,browser,probes}.log`. Reviewed hashes are included in the evidence JSON. Browser and Vite processes were test-owned and stopped.

The final retained browser suite directly protects: independent raw/factored changes on both circuits after a shared-length edit; invariant all-system governors under inspector selection; raw-draft deletion and optional-field clearing; current/captured K1.2 basis and numerical capture rejection; quantity-zero/missing coefficient; noninventory ordered path construction; custom/catalog/override geometry truth; transition blocking; located topology plus active-membership labels; and circuit-wide cumulative reconciliation. It also retains 30/10/20→50GPM shared flow/requalification, all six type/category choices, invalid raw/type cleanup, console/page-error and external-request checks.

Opus noted two non-blocking test-maintenance limitations: a single-governor regex assumes the current non-tied synthetic fixture, and locale-oriented numeric parsing assumes current sub-1000 values. These are not runtime or acceptance defects for the current fixture.

## Accepted functionality

- Loopback-only local Vite application on strict port5175.
- Synthetic two-terminal closed loop with shared supply/return,10+20=30GPM and explicit equipment.
- Project/system/nodes/sections/circuits, ordered route construction and lifecycle controls.
- Catalog/custom geometry and editable roughness assumptions.
- Six non-pipe loss types, DOE presets, exact categories and deliberate manual values.
- Current/stale/unconfirmed service applicability bound to active flow/fluid/T/geometry/data/type/value; explicit requalification.
- Explicit margin acknowledgment and category selection, including acknowledged zero and empty category set.
- All-circuit category/raw/margin/factored results and governors/ties.
- Selected-circuit section/item math with actual-fluid head, loss-equivalent psi, Re/regime/factor/rate and cumulative reconciliation.
- Truthful invalid raw state and provisional last-valid detail handling.

## Remaining boundaries / next stage

Proceed to **HYD-005 / HEDMEP-202** for local JSON save/open, autosave/recovery, local acceptance snapshots and stale lifecycle, print and safe itemized CSV. Imported historical approval must never become locally trusted merely because it matches. Malformed/unknown/oversized files must not replace current work. Invalid editor text must stale prior acceptance and be recoverably represented by autosave without being claimed as a saved valid project.

HYD-006 still owns final independent validation/documentation and broader browser workflows. HYD-007/Fabel remains deferred. No deployment or field-use claim is authorized. The workbook and Fabel were not modified. Linear status updates remain pending an authenticated administrative pass and must reuse existing receipts; no duplicate tickets.
