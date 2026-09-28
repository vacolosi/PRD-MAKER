# HYD-004 initial UI — parent disposition and correction handoff

**CURRENT: HYD-004 ACCEPTED for the HYD-005 persistence/reporting stage.** See **`docs/hydronics/ui-acceptance.md`**. All runtime findings pass parent production probes13/13; the final browser-test-only change was independently reviewed GO by Claude Opus4.6 (`f29d4c87`, `.pi/research/hydronics-ui-opus-retained-closure.md`). Parent final gates pass build before195tests, qualification, expanded isolated-Chrome checks, protected-input hashes and no-staging checks. No active writer/reviewer. Linear status updates remain administratively pending. HYD-005 is next; engine/UI acceptance does not yet make the app persistent or design-ready.

**Historical pre-acceptance status:** The first correction materially repaired ordered editing, raw/model replacement, margin/geometry controls and result structure. Focused Sol closure `1d530de4` plus parent production probes found a bounded remainder only: child-loss draft deletion, clearing optional fields/draft references, invalid governing output, primitive basis display and numerical confirmation gate, circuit-wide cumulative/provenance detail, and exact retained browser assertions. No engine or HYD-005 work is involved; no unresolved user/source decision is needed.

Latest source/test writer is Terra `33c8126d`; resume only that session for the finite finish. Parent independently passed build before195tests, qualification and delivered browser checks with protected inputs unchanged. Residual probe: `%LOCALAPPDATA%/Temp/hydronics-sources/parent-ui-repair-probes.json`; only rows without `probeError` are implementation evidence. Sol report `.pi/research/hydronics-ui-sol-repair-closure.md` is authoritative for the exact remaining list. After Terra's tests-only/application finish, parent reruns stable gates and corrected probes; Sol verifies these listed findings only, not another broad audit. Historical initial status below is superseded.

**Initial status:** The first UI runs, but required editor behavior is missing and several rendered values can diverge from evaluated inputs. This is a UI milestone review; the accepted foundation/engine is not reopened.

Writer delivery: Terra `f01dcfa5`, `.pi/research/hydronics-terra-ui-handoff.md`.
Independent reviewer: Sol `7c100dc3`, `.pi/research/hydronics-ui-sol-review.md`.

## Baseline evidence

Parent independently passed build before **190 tests**, qualification and the delivered real-Chrome smoke script. All11 engine files and the original five test files remain unchanged. Frozen inputs and logs are in `%LOCALAPPDATA%/Temp/hydronics-sources/parent-ui-review-input-hashes.json` and `parent-ui-initial-gates.json`.

Parent then exercised the **production bundle** using an isolated Chrome profile and a temporary owned loopback5175 preview. No server/browser was left running. Intended-outcome probe source/result:
- `parent-ui-initial-probes.mjs`
- `parent-ui-initial-probes.json`
- screenshot `parent-ui-invalid-headline.png`

All are under the same OS-temp directory. Final run:12 cases,10 failures,2 valid controls. The failures overlap six correction classes; they are reproduction evidence, not passing acceptance. Three initially over-exact select locators were corrected to accessible role/prefix locators, and the final run has **no probe errors**.

Directly reproduced:
- Invalid terminal text `1e` leaves the ordinary18.5498ft /8.034psi headline and governing ID unchanged despite the invalid banner.
- Quantity3 then K→Cv leaves displayed quantity3 while the result says quantity1.
- Custom ID2/roughness.0002 → catalog → custom displays ID2 while the engine result uses1.5in.
- Deleted invalid unassigned section and hidden invalid K after switching type leave global errors with **zero visible alerts** and no correction path.
- Water201F still allows capture and shows applicability current despite out-of-range property diagnostics.
- A topology error labels all six known-active sections unassigned/draft.
- A valid desired supply order `branch-1 → common-supply` is forced back into inventory order `common-supply → branch-1`.
- Required node/circuit/loss lifecycle, margin-category, envelope and catalog roughness-override controls are absent.
- Genuine scientific zeros `0e10`, `-0e-10`, `0.00E+100` are rejected as underflow.

## Accepted finite correction scope

Implement **all six groups in Sol's report**, not just one reproduction per group:

1. **P0-1: truthful raw/model state.** Atomic localized updates/reset/purge for replaced/deleted field groups; clean type-specific objects; values used by the engine match visible fields. Preserve unrelated invalid fields while removing only obsolete ones. Do not fabricate known-zero manual data. Withhold ordinary governing summaries/IDs during raw invalidity; any retained details must be explicitly last-valid/provisional. Fix significand-only underflow detection; genuine scientific zero remains valid.
2. **P0-2: usable topology/lifecycle controls.** Real ordered supply/return lists with add/remove/up/down; order independent of physical section inventory. Circuit rename/duplicate/delete; node create/safe delete; section description; loss remove/reorder. IDs stable on reorder/edit, fresh on add/duplicate. Successful deletions clear only their raw/error state. Native multi-select order is not an acceptable substitute.
3. **P0-3: loss intent and applicability.** Exact permitted categories (DOE preset=fitting only), clean type replacement, deliberate new manual coefficient entry (entered0 where allowed is distinct from blank). Editable envelope and text provenance. Current and captured basis fields visible, including flow, fluid/T, geometry, primitive/quantity and active reference version. `canConfirm` must use valid public engine evaluation/geometry/properties/target-row service state, excluding only expected missing/stale-applicability diagnostics; it must not permanently disable unconfirmed valid rows. Disable with an actionable reason; no silent catch. Raw invalidity/topology uncertainty/invalid properties/transition/unsupported DOE service cannot capture a current approval.
4. **P1-4: margin/geometry choices.** Four category toggles, deduplicated set includingempty, exact explicit acknowledgment. Resolved actual ID/effective roughness for every section, including unassigned inventory. The original handoff also requires editable catalog roughness override (not only custom mode), explicit default-vs-override provenance, and safe reset of its drafts when switching modes.
5. **P1-5: result and inspector fidelity.** Category/raw/margin/factored totals, raw/factored governors/ties and circuit-local reasons; focused selected inspector with original/derived coefficient/basis/preset/provenance, item/section totals, cumulative known head and reconciliation without new hydraulic formulas. Correct **inventory labeling**: absence of computed flow under invalid topology is not proof of unused membership. Use the evaluator's explicit unused inventory; show flow-unavailable rather than falsely unassigned for known active references. This is the additional parent-reproduced case within the existing display/topology contract.
6. **P1-6: meaningful retained tests.** Implement Sol's enumerated state/browser observations plus the parent geometry round-trip, invalid-entity deletion, active-inventory labeling and scientific-zero controls. Verify missing/blank coefficients do not become known zero, including at quantity0. Exercise a valid route whose order differs from inventory and successful recovery/requalification, not only blocked states. Capture console/page errors and external requests. Strict-check Vite config; correct the stale README introduction. Browser cleanup must close owned browser and server on failed assertions as well as success.

The original `ui-stage-handoff.md` remains the approved product/validation contract; this is completion/correction, not new feature scope. Plain readable controls suffice. Small components and pure draft/state helpers are appropriate; no state framework, visual redesign, drag-and-drop or engine changes are requested. Do not classify missing required construction/editing/reporting features as future polish.

## Exit / restrictions

Terra is sole application/test writer. Preserve all accepted engine/data and five retained tests; new tests are additive. Build/typecheck before all tests, qualification, then expanded real-browser checks. Preserve parent probes/review documents. Keep modifications in `hydronics/` and the configured handoff; no root/Fabel/workbook changes, credentials discovery, staging/commits/push/PR/deploy or child agents. Existing authorized Linear updates remain administratively pending; absence of authentication does not block these UI fixes. No HYD-005 implementation yet.

Deliver `.pi/research/hydronics-terra-ui-repair-handoff.md` with a six-group closure table, actual files/commands and observed browser assertions, remaining limitations and preview ownership if any. Parent independently verifies the corrected UI, then Sol checks this finite correction scope. This is the first UI repair; do not launch another broad engine review or optional-polish loop.
