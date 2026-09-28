# Hydraulic engine — parent acceptance

## Decision

**HYD-002 / HEDMEP-199 and HYD-003 / HEDMEP-200 are accepted for the next standalone application stage.** This accepts the bounded pure hydraulic engine and its retained regression coverage. It does not certify field use, a finished browser application, persistence, reporting or Fabel integration.

Reviewer: **Sol**, per Victor's request. Implementation/test writer: **Terra**. Astra owns this independent acceptance disposition.

## Review closure

The final Sol source review and correction verification are preserved at:
- `.pi/research/hydronics-engine-final-math-sol-review.md`
- `.pi/research/hydronics-engine-final-topology-sol-review.md`
- `.pi/research/hydronics-engine-sol-findings-closure.md` (Sol `5dd2db94`)

Sol explicitly closed **S1, S3 and F1**, and found no remaining runtime-source blocker. Its last NO-GO was limited to six exact S2 invalid-row assertions and four exact F2 topology diagnostic assertions; it was not an unresolved physics/topology implementation defect.

Terra `c5fd8577` completed that finite test-only list after `2d21520b` / `55a942ec`. Parent inspected all ten additions directly:
- `hydronics/test/final-corrections.test.ts`, confirmed-row mutation table: unknown type with valid applicability; wrong equivalent-length basis; wrong preset basis; negative K; negative direct-psi; negative direct-head. Every mutation reuses `expectInvalidRow`, requiring a located invalid-input diagnostic and unavailable item head/psi, affected category and section totals.
- `hydronics/test/topology-matrix.test.ts`, G09 table: unknown endpoint and self-edge require the section endpoint diagnostic at their exact section locations; unknown section requires the circuit unknown-reference diagnostic; duplicate circuit requires the unique-ID diagnostic. The table executes these expected-message/location assertions, so unrelated continuity/terminal errors cannot satisfy them.

**Parent therefore closes S2 and F2 based on the exact completed assertions and passing independent gates.** This is not a claim that Sol authored a later all-GO report. It is parent disposition of Sol's finite remaining list. No fourth broad review loop is needed.

Only the two reviewed production changes were made: shared loss-data validation at applicability capture, and a located numerical diagnostic for an overflowing known selected-margin base. The final assertion passes made no production changes. G01–G12 protection is supplied collectively by the foundation, engine, math-matrix, topology-matrix and final-corrections test files.

## Independent final evidence

Parent reran, in order, on stable final files:

| Gate | Result |
| --- | --- |
| Strict build before tests | PASS |
| Retained Vitest suite | **5 files / 180 tests PASS** |
| Reference qualification | PASS, approved limits unchanged |
| Independent ordinary numerical adapter | **272 numerical +14 repair assertions PASS** |
| Repair/sibling adapter | **46 cases /298 assertions PASS** |
| Final Sol guard adapter | **8 cases /28 assertions PASS** |
| Source/test stability through gates | Hashes unchanged during execution |
| Git whitespace/staged checks | No reported whitespace errors; no staged paths |

Immutable engine snapshot: `C:/Users/VICTOR~1/AppData/Local/Temp/hydronics-parent-engine-review-vXWkPT`.

Full evidence, source/test hashes and command-log paths:
`%LOCALAPPDATA%/Temp/hydronics-sources/parent-engine-acceptance-evidence.json`.
Logs: `parent-engine-accepted-{build,tests,qualification,core,46-cases,final-8}.log` in the same directory.

The final guard adapter was sensitivity-checked before repair: four invalid-capture cases and the selected-margin diagnostic case failed, while three valid capture controls passed. The ordinary adapter's malformed-category fixture was adjusted only to construct malformed JSON row/basis data after a valid capture; it still tests evaluator containment and has unchanged intended-outcome assertions.

Original workbook SHA-256 remains:
`9763963950c8c5ea1b83fa069dca3db603edb4872928f1992859c7a84b969a85`.
No workbook/Fabel edits, staging, commits, pushes, deployment or PR were performed by this work. Fabel's unrelated pre-existing state is not claimed as task-owned.

## Next authorization and remaining boundaries

Proceed with the previously approved standalone UI stage **HYD-004 / HEDMEP-201**, then persistence/acceptance/reporting **HYD-005 / HEDMEP-202**, and browser/full-workflow validation **HYD-006 / HEDMEP-203**. Prepare a bounded implementation handoff before launching Terra; keep one writer, with Sol as reviewer. No new user/source decision is required.

Use the approved `hydronics/`-local Vite/React/TypeScript design and localhost5175 strictPort. Preserve root tooling/dependencies and Fabel. The engine remains browser-independent and the sole hydraulic calculation authority. UI/import/persistence safety and real-browser validation remain separate, unfinished work.

Linear statuses/receipts were NOT changed during the test-only slice. At the next authorized delivery update, Terra may mark existing HEDMEP-199/200 Done with this evidence, move HEDMEP-201 In Progress when editor implementation begins, and keep later work truthful. Reuse existing receipts; no new tickets. HYD-007 / HEDMEP-204 remains Backlog/deferred.

Continue all previously approved restrictions: named pinned fluid data, no extrapolation, actual-fluid head/loss-equivalent psi, closed loops/known terminal demands, no automatic sizing/balancing/pump curves, explicit service applicability and margin acknowledgment. Extreme unrepresentable arithmetic is diagnosed rather than certified. A completed engine is not yet a design-use-ready application.
