# HYD-002 / HYD-003 parent implementation review

**CURRENT: HYD-002/003 ACCEPTED by parent for the next application stage.** See **`docs/hydronics/engine-acceptance.md`** for final disposition, Sol source-review closure, exact last-ten assertion verification and independent final gates (180 tests, qualification,272+14,46cases/298assertions,8cases/28assertions). Snapshot `hydronics-parent-engine-review-vXWkPT`; workbook hash unchanged. Latest completed Terra `c5fd8577`; no active writer/reviewer. Linear statuses have not yet been updated. Next: prepare bounded HYD-004 UI handoff, then launch Terra; Sol remains reviewer. No more broad engine review; UI/persistence/browser validation still unfinished.

Historical status/evidence below, superseded by the acceptance document:

PRIOR: Sol closure `5dd2db94` confirms S1/S3/F1 closed, no remaining runtime-source blocker. Its full report `.pi/research/hydronics-engine-sol-findings-closure.md` leaves only six isolated S2 row mutations and four explicit G09 diagnostic assertions. Parent read the report/source and accepted this finite list. Terra is sole active writer in workflow **`369005dd-5acd-4eaa-a97f-9b59cb940377`**, key `terra-last-ten-assertions`, resuming latest `55a942ec`. No production edits or broader review authorized. After delivery, parent inspects those ten assertions and reruns build/tests/qualification/all3adapters, then makes final engine acceptance disposition based on Sol's reviewed source and verified exact completions. Do not reopen another broad review loop. Older status paragraphs below are historical.

Current authority: **`docs/hydronics/engine-final-correction-handoff.md`**. Both Sol reports were read fully: math `fb68f543` S1–S3; recovered topology `311a14fb` F1–F2. Parent accepts the two bounded source fixes and the concrete retained-test corrections, without further source/architecture review. Parent independently reproduced four invalid captures and the missing selected-margin-base diagnostic; final guard adapter now has8cases,5expected negative-control failures and3passing valid controls on gwQjc9.

Terra final correction `2d21520b` and three-assertion completion `55a942ec` are COMPLETE. Parent read source/tests/handoff and independently passed build before180tests, qualification,272+14checks,46cases/298assertions and8finalcases/28assertions on immutable `hydronics-parent-engine-review-w4919Z`, with source/test hashes stable throughout. No application/test writer active. Only Sol closure verification is active: workflow **`ecbd6aee-d786-42e5-b56e-319c6667978b`**, key `sol-listed-findings-closure`, resumes Sol `311a14fb` for S1/S2/S3/F1/F2 only; NOT another broad review. Expected `.pi/research/hydronics-engine-sol-findings-closure.md`. On completed closure, parent decides engine acceptance and then authorizes the previously approved UI/persistence stages. No UI/Linear/credentials/publication yet.

Prior review/validation history (status statements below superseded by this current block): Terra de382ba0 delivered PassB; parent independently reran build before151tests, qualification,272+14checks and46cases/298assertions: all pass on snapshot `hydronics-parent-engine-review-gwQjc9`. Its11engine modules are byte-identical to parent PassA snapshotYSy7sA. Parent's masked/missing-test concerns remain for review, not presumed defects. User requested **Sol instead of Astra as reviewer**. Astra workflow `d2bfc060-362c-4b1a-bb07-379e124df874` was stopped; its interim findings are unfinalized evidence, not acceptance. Replacement workflow **`ef0dcd82-a0c4-413d-bc9f-51986613bbeb`** runs fresh **`azure-openai-responses/gpt-5.6-sol`** in both lanes: math `fb68f543`, topology `10079acb` (model confirmed in fleet). This replaces the current final review, not another broad round. Reports use `hydronics-engine-final-math-sol-review.md` and `hydronics-engine-final-topology-sol-review.md` under `.pi/research/`. Reviewer preference applies to this work; no global settings changed. Terra remains sole implementation writer, currently inactive. Latest Sol status: math `fb68f543` completed **NO-GO S1–S3** (`.pi/research/hydronics-engine-final-math-sol-review.md`, read fully). Parent inspected the missing shared loss-data guard in `currentApplicabilityBasis` and independently reproduced four invalid captures, with three valid controls passing. The other findings are isolated retained-test omissions/masking, not failures of ordinary hydraulic arithmetic. Topology `10079acb` failed from Azure Sol eastus2 **rate limit exceeded**, not a reported billing/credit error. It is now resumed ALONE in workflow **`da81b2f8-cb7b-4410-b538-2273639237cb`**, key `sol-final-topology-recovery`; no competing Sol lane or writer. Do not fall back to Astra without user approval. Await topology and consolidate only necessary bounded corrections for Terra, without another broad review round. Parent added temporary `parent-check-final-engine-guards.mjs`:7cases, current negative control4expected failures on gwQjc9. Ordinary adapter fixture now constructs malformed JSON row/basis from a valid capture (instead of requesting invalid capture), preserving evaluator-boundary assertions when S1 is fixed;272+14still pass, snapshotZ1gVAm. No application/test edits. HYD-001 stays accepted; no sources, UI or Linear status changes.

## Direct parent evidence

Astra reran `cd hydronics && npm run build && npm test && npm run qualify`: strict TypeScript build,18tests and all six reference qualification series passed.

The parent's independently written Python oracle and temporary Node public-API adapter passed **272 numeric assertions**, including:
-20turbulent Colebrook grid points with independent residual/factor expectations;
-54glycol/pipe conditions with separately interpolated parent-extracted properties;
-K/fixedEL/DOE ratio and quantity arithmetic;
-Cv density cancellation versus direct actual-fluid pressure conversion;
-three-terminal reverse-return, all active and middle terminal made draft, with independent shared flows, category totals, margin and governing results.

Evidence:
- `.pi/research/hydronics-engine-acceptance-spec.md`
- `%LOCALAPPDATA%/Temp/hydronics-sources/parent-engine-acceptance-oracle.py` / `.json`
- `%LOCALAPPDATA%/Temp/hydronics-sources/parent-check-delivered-engine.mjs`
- `%LOCALAPPDATA%/Temp/hydronics-sources/parent-delivered-engine-check.json`

No parent edits to application/tests. Temporary compilation snapshots are outside the repository. These successful normal-case numbers do **not** override the following reproduced blockers.

## Independently reproduced parent findings

### P1 — Actual directed cycles can be design-eligible

`evaluator.ts`, `validateHydronicTopology`: the implementation enforces at-most-one incoming supply edge/outgoing return edge but does not detect repeated nodes/root cycles. In the valid three-terminal reverse-return fixture, replace C's supply route with `PD→S1→S2→PD→S3`, using unique section IDs. Every edge is unique and continuous, yet the path revisits discharge. Actual result: `designEligible:true`, no diagnostics, all three valid circuit IDs.

Required repair: reject cycles/repeated path nodes and illegal interior pump-boundary visits, not just repeated edge IDs or local node degree violations. Include mirrored suction-cycle tests and valid direct/reverse-return controls. Preserve split-supply/merge-return restrictions.

### P2 — Finite inputs produce complete Infinity/NaN results

`hydraulics.ts`, state/pipe/aggregate paths: 100% finite input `actualLengthFt=Number.MAX_VALUE`,10GPM,1.049in, water77°F gives `complete:true`, `headFt:Infinity`, `pressureLossPsi:Infinity`, no diagnostics. Positive flow `Number.MIN_VALUE` underflows during GPM conversion, resulting in Re0 with laminarfInfinity and `headFt:NaN`, again complete with no diagnostics.

Required repair: validate intermediate representability, calculated factor/head/pressure, category/series totals and margin/max aggregation before returning any complete/eligible result. Nonzero flow underflow must not masquerade as physically zero flow. Zero actual input flow remains supported. Unavailable/error category totals must not be fabricated as known0. Add regression tests for overflow in pressure conversion and system/margin aggregation too, not just pipe multiplication.

### P3 — Runtime enum/type gaps silently omit active demands or losses

Concrete direct public-API probes:
- Change B's circuit state from `active` to typo `actve`: design-eligible result silently excludes its11GPM and equipment, reporting26instead of37GPM with no diagnostics.
- Unknown geometry kind `typo` is treated as custom and produces a complete normal head.
- Confirmed direct20ft equipment with category `not-a-category` is accepted by applicability validation and the section reports20ft, but circuit category sums omit it. System is design-eligible and selects a different governing circuit with no diagnostic.
- Margin acknowledgment string `'false'` is truthy and satisfies the explicit acknowledgment requirement.

These are missing ENGINE runtime domain guards, not a request to implement file-picker/import UI now. Validate discriminants/categories/actual Boolean acknowledgment and required engine structure before using them, without coercion/fallback/unknown-state exclusion. Shared validated typed-element rules should agree across basis capture and arithmetic so unsupported categories cannot disappear at aggregation. Unknown records receive located invalid diagnostics; no ordinary complete results from unsupported shapes.

### P4 — Ordinary JavaScript dictionaries are unsafe for arbitrary IDs

`evaluator.ts` uses `{}` for flow/result/diagnostic dictionaries keyed by public string IDs. Rename a valid shared section to `constructor`: accumulated common flow becomes string `function Object() { [native code] }71119`. The system becomes unusable despite otherwise valid topology. Related circuit keys can cause non-iterable/push errors through inherited prototype properties.

Required repair: use Map or prototype-safe own-property dictionaries consistently, including circuit diagnostics and section flow/results. Preserve supported valid IDs through JSON serialization; reject malformed IDs with diagnostics rather than throwing. Test `constructor`, `toString` and `__proto__` as applicable.

### P5 — Invalid active paths retain ordinary governing outputs at reduced common flows

When B's return path is missing in the reverse-return fixture, actual output reports total demand37GPM but common supply26GPM, another circuit complete, and ordinary governing head/IDs populated. `designEligible:false` is correct, but no separate provisional-output contract explains those reduced-flow results. The delivered invalid-active unit test explicitly requires a defined `governingHeadFt`.

Parent disposition: final governing/head/pressure/IDs must be unavailable when any active circuit/topology/required loss is incomplete or invalid. If partial diagnostic results are retained, label their provisional flow/basis unambiguously; do not call a remaining path complete at flow obtained by silently dropping an invalid active demand. Conservative system-wide blockage before hydraulic evaluation of invalid topology is acceptable; retaining partial numerical previews is optional. Update the contradictory test. No schema/persistence migration is needed; this engine has not been accepted or released.

## Remaining validation

The delivered five engine tests do not cover the required loss-type/category/quantity matrix, actual inclusive transition classification, numerical aggregation failures, margin crossover, ties, direct/reverse topology and malformed graphs/runtime shapes. Add regression tests for the failure classes above plus the existing plan's required cases; expected values must remain independent. Existing correct source qualification and272parent numeric checks must continue passing.

Both fresh read-only reviewers completed in workflow `95a3ed75-29ef-436f-aaa8-beeb4a663c21`:
- `.pi/research/hydronics-engine-math-review.md`
- `.pi/research/hydronics-engine-topology-review.md`

Parent has synthesized both reports with this evidence and **authorizes Terra as the single repair writer for the consolidated scope below**. No UI/persistence implementation until repaired numerical/topology acceptance. No new user source/product question is needed for these implementation defects.

## Consolidated repair disposition — authoritative next implementation scope

Accept all math-review R1–R5 and topology-review T1–T6 as bounded required corrections. They substantially overlap parent P1–P5; fix failure classes, not separate ad-hoc patches per example. Preserve ordinary-range arithmetic, current-reference confirmation identity and approved source tables/catalogs. No new features/source hunting or generic serialization infrastructure.

| Repair area | Accepted findings | Required result |
| --- | --- | --- |
| Acyclic directed topology/boundaries | ParentP1, topologyT1 | Repeated-node/root/sink cycles and internal visits to either pump boundary rejected; supply/return global restrictions include terminal interfaces; legitimate direct/reverse return still works. |
| Numerical validity throughout | ParentP2, mathR1, topologyT4 | Validate raw domains and representability of computed area/flow/state/factor/head/psi, category/section/circuit sums, aggregate flow, margins/maxima. Unrepresentable positive-flow underflow or overflow yields located numerical diagnostics and unavailable full results, never apparently complete0/NaN/Infinity. Check stable arithmetic ordering where useful; support for physically absurd inputs is not required. |
| Validated engine input/rows | ParentP3, mathR2–R4, topologyT6 | Small reusable runtime validator(s) for engine containers, string IDs, recognized states/roles/geometry/type/preset/category, exact Boolean acknowledgment and valid loss/applicability shapes. No numeric-string/null coercion or unknown-state fallback. Every public geometry/state entrypoint validates raw resolved geometry before laminar/zero-flow shortcuts. Optional roughness absent/undefined may default; explicit null may not. Invalid rows/lookups return located diagnostics through section/system APIs instead of throwing. |
| Safe identity dictionaries | ParentP4, topologyT5 | Map or null-prototype own-key dictionaries throughout. Valid string IDs constructor/toString/__proto__ work, including diagnostic-producing paths; malformed numeric/null IDs are diagnosed. |
| Honest operating basis and complete-system outputs | ParentP5, topologyT2–T3 | Never remove an invalid active demand and then qualify common equipment at that silently reduced flow. No final governing head/pressure/IDs unless all active paths, required losses, arithmetic and explicit margin are valid and complete. Missing loss makes full path totals unavailable. |
| Durable regression suite | MathR5 and topology test matrix | Add focused parameterized positive and negative Vitest cases across all required classes, not only more happy-path goldens. See both full reports and independent parent specifications. |

### Operating-basis/partial-result policy

Parent permits the simple conservative approach: **if active topology is invalid, block hydraulic evaluation for that system**, keep the located circuit/topology diagnostics, and expose no section operating basis or complete circuit/final governing result. Partial hydraulic previews for invalid topology are optional, not required. This avoids presenting a reduced demand set as current service; it preserves the approved all-active completeness rule without designing a complex uncertainty model.

Whichever implementation is chosen:
- A well-formed positive active demand may be reported as a known declared system demand only if the ENTIRE active demand sum is valid/finite. Never replace invalid demands with0 or include negative demands in a definite total.
- A section referenced by an invalid ACTIVE circuit is still referenced-active/incomplete, not ordinary unused draft inventory. Inventory classification must use known references from all active circuits, not only fully valid candidates. If structure is indeterminate, avoid confidently labeling affected inventory unused.
- On VALID topology with a hydraulic/applicability failure, derive shared flows from ALL active demands as usual. Retain inspectable item diagnostics, but full affected circuit totals are unavailable and the whole system has no final governing outputs. Unaffected individually complete paths may remain inspectable at the correct shared flows; they do not become a system recommendation.
- If partial maxima are kept, they require an unmistakable separate provisional name/state; omitting them is simpler and accepted. Replace the delivered unit test requiring a populated ordinary governingHeadFt on invalid active input.

### Small in-scope API/reporting follow-ups accepted

- Project loss data per selected type when capturing/normalizing a basis; retain only relevant primitive fields rather than stale keys/nested references. This fixes the documented normalized-input contract while preserving key-order-independent equality. No general-purpose serializer.
- Provide an explicit engine friction-head-per100ft reporting field/helper, including zero physical length. Do not divide by section length or make UI reimplement Darcy arithmetic. At no flow it is0; transition/invalid state is unavailable. This is reporting for already implemented physics, not additional sizing behavior.
- Centralize head/pressure conversions; avoid a second set of literals in system evaluation. This is a bounded unit-boundary repair.
- Synchronize package documentation that still describes HYD-001 as In Progress. Source acceptance is not field/product certification; those limitations remain.

### Required retained tests and evidence

Promote reviewer and parent independent cases into focused permanent tests: all six loss types/allowed and forbidden categories, quantity0/1/2 and invalid variants, knownK0/missing coefficients, K=f·EL/D, both DOE ratios/current diameter/laminar restriction, Cv cancellation versus direct psi, exact regime boundaries, invalid raw geometry and absent-versus-null roughness, unknown preset/malformed row, capture mutation isolation/current-version/flow/fluid/T/envelope changes, overflow/underflow at each aggregation layer, valid reverse-return, pump-root/sink cycles, merges/splits/mixed nodes, reused IDs/terminals, reserved valid IDs, invalid-active shared flow, invalid state/container/Boolean, no active/drafts/unused inventory, deterministic ties,25vs.25percent and raw/factored governing crossover. Tests must assert diagnostic/result availability and accounting parity, not just designEligible=false.

Reviewer exact-Re input pairs and temporary executable probes are in their reports; adapt them into regressions rather than claiming a rounded GPM reaches an exact boundary. Parent oracle and actual-API adapter paths above are available. Old reviewer probe scripts intentionally ASSERT some pre-fix defects; do not treat an unchanged bug-reproduction assertion failing AFTER repair as a new engine defect. Convert assertions to correct intended outcomes.

Legacy arithmetic disposition (no new user decision): retain the cache `.23174664595943364ft` as a clearly labeled workbook cache, precise-US-unit calculation with declared legacy rho/mu and g32.2 as `.23174550020482132ft` (about−.0004944% versus cache), and named-source49°F head `.23173916134258887ft` as a separate regression. Do not silently force unlike conventions to equality or claim exact cache reproduction. See math reviewerR5 for evidence. This small convention discrepancy is documented, not a change to approved reference properties.

Run strict build BEFORE tests, retained qualification, and independent comparisons after repair. Return a traceable findings/tests disposition and actual commands/results. Stop for focused independent repair review before UI. HEDMEP-198 remains Done; only199/200 status/evidence updates are in scope, preserving markers/dependencies/assignment/project.201–204 stay Backlog. No workbook/Fabel/unrelated-root edits, staging, commits, push, deployment or PRs.

## First repair verification checkpoint — pending focused review synthesis

Terra repair workflow `f4e39205-ee4c-48e0-ae95-83b2842ec436` completed, retained worker run **45982951** (use this latest ID for any subsequent resume). Handoff: `.pi/research/hydronics-terra-engine-repair-handoff.md`. Parent independently reran strict build,26retained tests, qualification and272numerical+14repair assertions: all passed.

Nevertheless, direct parent sibling probes reproduced remaining defects in the same accepted repair classes:
- Direct terminal-only discharge→suction bypass is now accepted; its former explicit guard was removed.
- Q1e-200 produces eligible0head through velocity-square underflow, versus independently representable Poiseuille head9.28468710433447e-202ft for the200ft circuit.
- Newly added friction-rate reporting can throw out of the section diagnostic API after a caught arithmetic failure.
- Numeric systemID42 is silently changed to invalid-system while remaining design-eligible.
- One malformed path field makes known active references appear unused; unknown circuit state still publishes a definite partial demand.
- Error categories remain0 in several paths. In both modules `emptyCategories(undefined)` invokes the function's default0 parameter; it does NOT create unavailable category values. Negative pipe length also omits the pipe item and yields known-zero pipe category.
- Cross-category section overflow gives incomplete status without a section diagnostic.

Evidence: `%LOCALAPPDATA%/Temp/hydronics-sources/parent-engine-repair-siblings.mjs` and `.json`, against parent snapshot `hydronics-parent-engine-review-KgTXrE`. No application/test edits by parent.

The retained engine suite still does not implement the approved R5/T-test matrix; external probes are not a substitute. Parent clarified the existing requirements as named completion groupsG01–G12 in **`docs/hydronics/engine-regression-matrix.md`**. This is not new product scope.

Focused fresh repair-review workflow **`0e57212c-2891-41b9-910b-5c23b6289eaa`** is COMPLETE. Math reviewer c6bd7e11 and topology reviewer9c53ddc9 both return NO-GO before UI. Parent read the first25lines of each final report before the context checkpoint; read BOTH reports completely before authorizing the next serialized repair:
- `.pi/research/hydronics-engine-repair-math-review.md`
- `.pi/research/hydronics-engine-repair-topology-review.md`

Final report summary: math M1–M4 cover positive-loss underflow/conversion helpers, friction-rate diagnostic/state guards, false-zero categories/missing aggregate diagnostics and incomplete retained coverage. Topology RT1–RT4 cover terminal-only pump bypass, malformed membership/uncertain total, false-zero early categories, invalid systemID and malformed circuit-ID objects throwing during early return. Several original defects are resolved; do not reopen those or source qualification.

Parent has now read both final reports completely and inspected the affected implementation. The next repair resumes Terra **45982951** as sole writer, under the authorization below. No UI, new source decision or user input is needed.

## Second repair authorization — M1–M4 / RT1–RT5

This is completion of the existing scope, not a new architecture or source round. All remaining findings in the two focused reports are accepted as bounded fixes:

1. **Positive numeric losses:** Check positive-factor arithmetic for lost magnitude, including intermediate underflow in pipe/K/EL/Cv/rate/conversions. Compute correctly through practical stable ordering or explicitly reject unsupported ranges; never turn a positive required result into a known0. Preserve real zero flow/length/quantity/coefficient. No arbitrary-precision library or new fluid/operating mode.
2. **Reporting boundary:** Validate consumed state/regime before shortcuts in any exported friction-rate helper. Contain reporting errors inside section diagnostics and retain inspectable items. Low-level helpers may throw meaningful domain/numerical errors; section/system APIs return located failures.
3. **Availability and diagnostics:** Make unknown-category initialization explicit in both modules. Invalid required pipe length has an unavailable pipe item/category, not an omitted known0. Otherwise-known cross-category section-sum overflow emits a located numerical diagnostic.
4. **Pump bypass:** Restore the explicit active discharge→suction bypass rejection, including a terminal-only path. Preserve legitimate zero-length sections and valid reverse return.
5. **Membership and total:** Collect individually valid references from explicit active records regardless of invalid circuitID/other path fields. Withhold unused classification conservatively when membership is indeterminate; an empty unused list is sufficient. Full declared demand is unavailable for unknown state/non-object records or invalid active demand/aggregate. A merely invalid path/identity does NOT erase an otherwise determinate positive total.
6. **Identity error paths:** Reject invalid systemID before eligibility; use validated primitive circuitIDs only for dictionary lookups, including early errors. JSON objects with noncallable toString must produce diagnostics, not escaped coercion errors. Preserve valid reserved string IDs.
7. **Durable tests:** Implement ALL named G01–G12 groups in `engine-regression-matrix.md`, preserving accepted independent constants. Add intended-outcome regressions before each fix where practical; do not weaken tests, substitute temporary scripts or mark a group complete based only on a similarly titled test. Handoff maps every group to actual file/test names and explicitly identifies any omission. Tests of failure availability/accounting are required, not only eligibility Booleans.

Acceptance evidence: strict build before tests, retained qualification, parent272+14 comparison, and intended-outcome versions of focused review probes. Old math probes deliberately assert defects; their unchanged failures after repair are not regressions. New tests may use the reported constants and source-free fixtures, never production-derived expected answers. No new dependencies expected.

Terra may edit `hydronics/src/engine/`, retained `hydronics/test/` and directly related package evidence docs; record existing HEDMEP-199/200 status/evidence in Linear receipts. Parent review/matrix/oracle artifacts are read-only for Terra. Preserve HEDMEP-198 Done and201–204 Backlog. Same workbook/Fabel/root-tooling/Git-publication prohibitions apply.

Required handoff: `.pi/research/hydronics-terra-engine-second-repair-handoff.md`, with M/RT disposition, G01–G12 traceability, changed files, exact validation/exit codes, remaining risks and ticket receipts. Stop before UI for parent verification and focused recheck; do not imply calculator completion.

## Boundary/status recheck

Parent independently queried Linear after handoff: HEDMEP-198 Done; HEDMEP-199/200 In Review; HEDMEP-201–204 Backlog. All seven still match HEDMEP-134, intended project, Victor, pillar label and stable markers. No parent Linear writes.

Workbook SHA-256 still matches original `9763963950c8c5ea1b83fa069dca3db603edb4872928f1992859c7a84b969a85`. No staged changes or tracked root diff. Read-only Fabel status shows modified `.pi/relay.json` (previously recorded) and untracked `.claude/launch.json` (observed, provenance not inferred); neither file was edited or removed by this task. Do not conflate preexisting/unrelated working-tree state with our implementation footprint.
