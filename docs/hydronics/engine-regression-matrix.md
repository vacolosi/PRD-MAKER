# Retained engine regression matrix

Owner: Astra. This makes the ALREADY APPROVED mathR5/topology test requirements executable as a completion checklist; it does not add product scope. External parent/reviewer probes have found defects, but temporary passing probes are not permanent protection.

**Completion requires a named retained Vitest test or parameterized case group for EVERY group G01–G12 below, with file/test-name references in Terra's handoff.** A group is not complete because an external script passed, a similarly titled test exists, or a type declaration compiles. Report actual omissions rather than mark all review findings implemented. Preserve existing tests; split focused files/helpers if clearer. No specific inflated test-count target.

## G01 — Independent numeric baselines

- Water77°F10GPM1.049in100ft:6.634316015514317ft and2.867665205558536psi; independently check v/Re/f.
- PG50@30°F1GPM same pipe:.9697711599352945ft; independently verify Poiseuille, not64/Re copied twice.
- Named-source49°F workbook-sized geometry from implementation plan:.23173916134258887ft.
- Separate declared-legacy-property arithmetic/conventions from workbook cached `.23174664595943364ft`; precise-unit/legacyg result `.23174550020482132ft` is NOT exact cache reproduction. No new legacy-fluid product mode/API is requested.

## G02 — Actual regimes, Colebrook and reporting

Assert ACTUAL computed Re for1999.999/2000/4000/4000.001, expected regime, available/unavailable section/system recommendation. Exact representable pairs are in math review. Reevaluate Colebrook residual independently; test invalid inputs and unbracketed failure. ZeroQ loss is0; positive-flow underflow is not zeroQ. Friction head/100ft is correct at physical length0and100; no division by section length. Transition reporting is unavailable.

## G03 — Positive loss/category/quantity table

At water77°F10GPM1.049in,.00015ft roughness, test every declared category for each row and quantities0/1/2 (parameterization encouraged). Assert item/category/section totals and exactly one automatic pipe contribution. Independent per-unit heads:

| Row | Allowed categories | Per-unit head ft |
| --- | --- | ---: |
| K=.75 | fitting,valve,equipment | .48186353347145255/3 |
| FixedEL12ft | fitting,valve,equipment | 1.592235843723436/2 |
| DOE90 Le/D30 | fitting | .3479698750137259/2 |
| DOE45 Le/D16 | fitting | .09279196667032691 |
| Cv40 at10GPM | valve,equipment | 1.298772888551391/9 |
| Direct3psi | valve,equipment | 6.940471296288036 |
| Direct8ft | valve,equipment | 8 |

Additionally verify K=f·EL/D with independently known f=.027080012091821405, both preset EL values at current actual ID and changed ID, and knownK0 versus missingK. Quantities change row losses, not physical pipe length.

## G04 — Invalid loss/type/category/quantity table

Across all six discriminated loss types, reject missing/unknown/forbidden categories (including nonpipe categorypipe), negative/fractional/nonfinite/wrong-type quantities, missing/negative/nonfinite/wrong-type numeric coefficients, Cv0, unsupported preset/type/basis, malformed row and missing applicability container. Valid zero coefficient is allowed except Cv. Quantity0 does not validate missing/invalid coefficient data. Assert located diagnostics, unavailable full results, and no silent omitted loss or escaping section/system exception. Include forbidden combinations such as direct-head/fitting, Cv/fitting and preset/valve.

## G05 — Service and pressure semantics

Both DOE presets block laminar and transition service; appropriately confirmed manualK/EL can be used in laminar. Water77°F versus PG50@30°F at30GPM/Cv40 gives same1.298772888551391ft but differentpsi. Direct3psi heads differ6.940471296288036versus6.563354603463994ft. Direct head is actual-fluid head, not water-head conversion. Unconfirmed rows never authorize a design result.

## G06 — Current-basis lifecycle and isolation

Independently change flow, fluid reference, temperature, actualID, roughness, type/value, quantity, envelope and data version. Confirmations become stale. Missing old version is not backfilled. Capture uses active bundle, copies relevant primitive inputs, ignores stale irrelevant type fields, survives outer/nested object-key reordering, and cannot mutate with the original input. Retain indirect common30→50GPM fixture and assertions that only explicit requalification restores eligibility.

## G07 — Numerical validity and failure reporting

Check finite inputs causing area/velocity/factor/head/psi/category/section/circuit/margin/aggregate-flow overflow; positive underflow at conversion AND later multiplication, including tinyQ with representable nonzero Poiseuille head and extreme quantity-scaled Cv. True zero-length/quantity/known-zero losses remain valid0. Positive required results must be computed correctly or diagnosed unavailable, never silently changed to0. Stable reordered arithmetic or bounded rejection is acceptable for absurd ranges; no arbitrary-precision feature requested. Include new friction-rate reporter exception path and cross-category section-overflow diagnostic. Validate category availability, not only `complete:false`.

## G08 — Valid direct/reverse return and known shared flows

Retain two-terminal30GPM golden and parent three-terminal reverse-return fixture with all active37GPM and Bdraft26GPM. Assert shared flow and object reuse, once-per-circuit series inclusion, correct asymmetric return, equipment-specific governing circuit and no parallel-head sum. These expectations are in `engine-stage-handoff.md` and `.pi/research/hydronics-engine-acceptance-spec.md` / parent oracleJSON.

## G09 — Invalid topology, not only repeated edges

Dedicated cases: unknown endpoints/section, self-edge, reversed/discontinuous sequence, repeatedsection, duplicate node/section/circuitID, terminalreuse, supplymerge, returnsplit, supply/return node mixing, internal cycle, unique-edge dischargecycle, uniquesuctioncycle, interior visit to either pump boundary, and direct pump-discharge→suction terminal-only bypass. Each blocks final results; meaningful role/end-point diagnostics. Valid control networks prevent rejecting legitimate reverse return.

## G10 — Incomplete active versus explicit draft/unused

Missing terminal/path, malformed path container, invalid demand and bad geometry/unqualified loss variants. Invalid TOPOLOGY may conservatively yield no hydraulic evaluations; never qualify common equipment at reduced valid-only flow. Known referenced-active sections stay active/incomplete, not unused because another path field is malformed. Unknown circuit state/null record makes full active demand uncertain, not a definite partialtotal. Valid topology with bad hydraulic data keeps correct allactive shared flows, affected full totals unavailable and all final governing heads/psi/IDs absent. Unknown/error category totals are unavailable—not0 from a default argument. Explicit drafts/valid unused inventory excluded, noactive has no governing result.

## G11 — Margin, governing selection and ties

Acknowledged0 versus unacknowledged0;25percent versus.25percent; negative/nonfinite percent; duplicate/unknown categories; exact Boolean acknowledgment. Category-versus-formula distinction. CrossoverA10pipe+20equipment, B20pipe+9equipment gives rawA30>B29, factoredA32.5<B34at25%pipe-only. All tiedIDs deterministic under input reorder. Invalidactive cases expose no ordinary final governing output, regardless of remaining complete path magnitude.

## G12 — Runtime and identity boundary

Null/missing/wrong containers and entries in system/nodes/sections/circuits/path arrays/margin/elements/applicability; numeric/null/empty IDs including SYSTEM ID; unknown circuit state/role/geometrykind; raw numericstrings/null fields rejected without coercion. Catalog override absent/undefined defaults, explicitnull rejects. Low-level resolvedgeometry validates negative/nonfinite roughness even in laminar/zeroQ exits. Valid constructor/toString/__proto__ section AND circuit IDs work through positive and diagnostic-producing cases with JSON-serializable own-key records. No actual prototype pollution test or hostile getter/proxy framework is requested.

## Exit gate

Strict build BEFORE retained tests, retained qualification and independent parent comparison. Handoff maps G01–G12 to actual file/testnames and calls out any omitted case explicitly. All previous source/product constraints remain unchanged. Stop for parent acceptance before UI; do not claim the external272+14adapter alone closes this matrix.
