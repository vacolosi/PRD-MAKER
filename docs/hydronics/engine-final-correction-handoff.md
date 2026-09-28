# Final Sol findings — consolidated Terra correction

Owner: Astra (orchestration/independent acceptance). Reviewer: **Sol**, explicitly requested by Victor. Sole implementation/test writer: **Terra**. This closes the existing third/final review, not a new product/research/architecture phase.

## Evidence and disposition

Both final reports were read completely and accepted within the approved scope:
- `.pi/research/hydronics-engine-final-math-sol-review.md` — Sol `fb68f543`, S1–S3.
- `.pi/research/hydronics-engine-final-topology-sol-review.md` — Sol `311a14fb`, F1–F2 (resumed after Azure rate limit, not a reported billing error).

Ordinary hydraulics, references, shared-flow topology implementation, G01/G03/G08 and ordinary G11 are not being reopened. Strict build/151 tests/qualification/272+14 checks/46 cases pass, but those tests do not close the specific listed omissions. Engine/UI acceptance remains withheld.

Parent independently reproduced S1 and F1 on immutable `hydronics-parent-engine-review-gwQjc9`. `%LOCALAPPDATA%/Temp/hydronics-sources/parent-check-final-engine-guards.mjs` has **8 cases**: four invalid-capture failures, the selected-margin-base diagnostic failure, and three passing valid-capture controls. Negative-control report records **5 expected failures**. This is reproduction, not passing acceptance.

## Production changes authorized — two narrow boundaries only

### S1: reject invalid raw loss data when capturing applicability

In `hydronics/src/engine/hydraulics.ts:currentApplicabilityBasis`, reuse `isValidLossElementData(element)` before projecting/capturing. Recognizable discriminator alone is insufficient. Throw the existing meaningful domain error for malformed category, quantity, coefficient or basis.

Preserve: active data version, selected primitive projection, immutable capture, irrelevant-field exclusion, valid zero coefficients/quantities, missing/old-version rejection and explicit shared-flow requalification. No new library, normalization architecture or legacy-fluid API.

### F1: explain unavailable selected margin-base arithmetic

In `hydronics/src/engine/evaluator.ts`, distinguish an unknown selected category from an overflowing sum of **known finite** selected values. If the latter sum is unavailable, emit a located `numerical-failure` at `circuit:<id>` and propagate it to system diagnostics. Existing full-output blocking remains correct. Stable summation is also acceptable, but extra magnitude support is not required.

Do not label ordinary prior input/applicability unavailability as a new arithmetic overflow. Keep genuine zero percent/zero selected base valid. No changes to physical formulas or category selection semantics.

Other production changes require a concrete blocker reported to parent, not opportunistic cleanup.

## Retained corrections — actual isolated assertions

Use the existing helpers/tables where useful. Every invalid fixture must reach the intended boundary; do not capture invalid data through the newly strict helper unless testing that helper itself. Capture a valid row, then mutate the raw input and, where needed, a copied saved basis to create malformed JSON-shaped input. Never weaken a no-throw evaluator assertion just because fixture creation throws earlier.

### C1 — S1/S2, G04 capture and invalid-row domains

- Directly assert capture rejection for Cv/fitting, fractional quantity, null Cv and wrong K basis; valid ordinary Cv, K=0 and quantity=0 remain capturable.
- Repair the masked category/quantity assertions, rather than merely adding another `complete:false` test. Use otherwise-valid six-type rows and one invalid dimension per case.
- Categories: missing, unknown and nonpipe `pipe`; also actual forbidden recognized combinations (Cv/fitting, direct-psi/fitting, direct-head/fitting, preset/valve or equipment).
- Quantities: representative negative, fractional, NaN/nonfinite, null and numeric-string mutations. Cover the shared guard across all six types with a concise parameterized table; no inflated test-count target.
- Coefficients/preset/basis: missing, negative, nonfinite, null/wrong type, Cv=0, unsupported preset/type/basis. Keep coefficient and basis mutations independent. Include quantity=0 with invalid/missing coefficient to prove zero quantity does not legitimize invalid data.
- For invalid rows assert **located invalid-input**, unavailable offending item head **and psi**, unavailable affected category and full section totals. The broader system API must contain malformed input without throwing. Existing stronger assertions may be reused; no need to duplicate cases already meaningfully protected.

### C2 — S3, G02/G05/G07 section/reporting cases

Retain the exact minimal cases listed in the math Sol report:
1. Confirmed Cv at Q10, Cv1e200, quantity1e100, zero pipe: nonzero correct head or located numerical unavailability of item/valve category/head/psi. Current implementation rejects safely.
2. Confirmed direct-head Number.MIN_VALUE, Q10, quantity1, zero pipe: contained final conversion failure, unavailable item/psi/equipment category/full totals.
3. Section API at Q1e200, ID1.049, length100: no escape, finite hydraulic state, unavailable pipe/rate/full totals, located numerical diagnostic.
4. Reporter normal rate = independent6.634316015514317 ft/100ft; zeroQ rate0; actual transitional state rate unavailable. Mutate consumed flow/velocity/Re/density/viscosity/factor/regime fields one at a time for invalid domains. Do not combine a bad regime with every other bad-field test.
5. Two **unique-ID, individually finite** equipment direct-head rows of1e308 each: same-category overflow, unavailable equipment/full total, located numerical diagnostic. Preserve existing distinct cross-category section-overflow test.
6. Confirmed PG50@30°F direct-head8ft stays exactly8ft; psi =3.6566666666666667, versus water77°F3.4579784247268464. This is actual-fluid head, not water-head conversion.

### C3 — F1/F2, G07 evaluator arithmetic layers

Use otherwise-valid systems with confirmed losses and zero physical lengths, so earlier failures cannot mask the intended layer:
- F1 selected-base regression: Q20, fitting head8.988465674311578e307, valve8.988465674311579e307, equipment1.5e292; selected order equipment/fitting/valve; percent1e-300. Raw-order sum is MAX_VALUE, selected-order accumulation overflows. A fixed fitting K=**1.0492622061220577e308** reaches the target with current1.049in geometry. Assert all sections complete/known categories before testing circuit-level result and numerical diagnostic. See parent final-guards script for the exact source-free input fixture.
- Same-category circuit-series overflow from **separate complete sections**, each9e307ft equipment, unique IDs.
- Cross-category circuit total from separate finite category sections, if not already meaningfully retained; use a category parameter to reach the raw-sum branch without same-category overflow.
- Margin-increment overflow with a finite raw/base (e.g. head1e308 and10000percent).
- Factored-total overflow with finite raw AND finite margin (e.g. head1.79e308 and1percent). A50percent example may overflow the multiplication first and does NOT isolate factored addition.

Check the intended circuit-level diagnostic and appropriate unknown categories/totals, not only eligibility. Preserve true-zero and positive-underflow guards already retained.

### C4 — F2, G09 meaningful topology assertions

Replace/fix the masked supply-merge, return-split, mixed-node and internal-cycle cases using locally continuous complete paths. The Sol topology probe has explicit usable fixtures:
`%LOCALAPPDATA%/Temp/hydronics-sol-final-review-20260323-001/probe.mjs`.

Assert the intended diagnostic (merge/cross-mesh, split/cross-mesh, supply-return mixing, repeated-node/boundary). Across the existing invalid-topology table provide expected message/class/location per case instead of accepting any generic error. In particular, terminal reuse and repeated sections must assert their own guard rather than incidental continuity failure. Preserve valid reverse-return controls and genuine discharge/suction/bypass coverage.

### C5 — F2, G10 completeness and membership

- Split unknown state and null circuit into independent tests; each must withhold active demand and unsafe unused classification.
- Extend the shared final-blocking assertion to both governing ID arrays and undefined raw head, factored head and psi.
- Early invalid topology: assert every circuit category unavailable, not zero, and no reduced-flow hydraulic qualification.
- Add isolated invalid-demand representatives; malformed path/identity with otherwise known positive demands retains the determinate total. Assert known referenced active inventory is not unused.
- Add a valid-active system with genuinely unused inventory, excluding unused hydraulic evaluation while preserving valid active results.
- Preserve existing valid-topology/bad-hydraulic-data tests at correct all-active shared flow and unavailable affected full totals.

### C6 — F2, G12 runtime and safe keys

- For constructor/toString/__proto__ circuit IDs, cause a **circuit-local** missing-terminal/path error; assert own circuitDiagnostics key, located diagnostic, JSON round-trip retention and full blocking. Margin-only failure is insufficient.
- Test {toString:null} and {toString:42} circuit IDs: no throw, located invalid result, otherwise known declared demand retained.
- Test numeric/null/empty system IDs on otherwise-valid systems, not empty malformed shells.
- Isolate representative missing/wrong return-path, margin, elements and applicability containers; raw null/numeric-string numeric fields must not coerce. Reuse meaningful G04/G11 coverage rather than duplicate it.

## Validation and delivery

No source research, UI/persistence, Fabel/workbook, credentials/Linear, root tooling/dependency changes, staging/commits/push/deploy/PR or child subagents. Parent plans/reports/oracles/probes are read-only to Terra.

Run on stable completed files, **build before tests**:
1. `npm --prefix hydronics run build`
2. `npm --prefix hydronics test`
3. `npm --prefix hydronics run qualify`
4. `node "$LOCALAPPDATA/Temp/hydronics-sources/parent-check-delivered-engine.mjs"`
5. `node "$LOCALAPPDATA/Temp/hydronics-sources/parent-check-second-engine-repair.mjs"`
6. `node "$LOCALAPPDATA/Temp/hydronics-sources/parent-check-final-engine-guards.mjs"`

Parent adapted the ordinary adapter's malformed-category fixture to build matching malformed row/basis data AFTER a valid capture, so S1's correct throw cannot short-circuit the evaluator test. All original272+14assertions remain; adaptation passes on pre-fix code, snapshotZ1gVAm. Do not edit the adapter or weaken assertions.

Deliver `.pi/research/hydronics-terra-engine-final-corrections-handoff.md`, mapping **S1/S2/S3/F1/F2 and C1–C6** to exact test names and changed source lines. Explicitly disclose omissions; do not substitute external probes or titles for retained assertions. Finish this bounded correction, not another scaffold checkpoint. If genuinely blocked, report the exact blocker and current file/build state.

Stop before UI. Parent will inspect changes, rerun independent gates and verify closure of these listed findings; no fourth broad review/research loop is authorized.
