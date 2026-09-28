# HYD-002 / HYD-003 engine-stage handoff

Owner: Astra. Writer: Terra. Scope already approved by Victor: pure hydraulic loss math and explicit known-flow supply/return circuit evaluator, followed by independent review BEFORE UI/persistence. This document supplies bounded implementation guidance and independent numeric evidence; `implementation-plan.md` remains the full contract.

## Entry gate

The repaired reference data passed parent build/tests/qualification, exact comparison of all216 property values against the original parent PDF extraction, all90 catalog rows against the independently published reference transcription, and408 interior interpolated states against separately calculated values. Sources and generic DOE fitting choice are approved by Victor. No source selection question remains.

The focused repair review (`.pi/research/hydronics-foundation-repair-review.md`) completed: no other foundation blockers. **Astra authorizes Terra to first fix R1, run strict build/tests including version-only and missing-version rejection, then begin HYD-002/003 if they pass.** Failure means stop/report, not bypass. R1: applicability confirmed basis must include required `referenceDataVersion: string`, not just a fluid ID. Populate current bases from `HYDRONIC_REFERENCE_DATA_VERSION`; retain old saved values for honest mismatch detection. A data-version change or an imported pre-versioned confirmation must be incomplete until requalified. The engine must construct the current basis from the ACTUAL active reference bundle, derived flow, resolved geometry, current loss input and current envelope—not from saved confirmation fields or an imported project version string. Missing/nonfinite fields cannot acquire permission through JSON serialization (NaN/Infinity serialize as null). Only normalized finite validated values should reach basis comparison. Parent accepts the review's low-severity R2 fix during engine integration: compare a fixed field-ordered normalized representation, including nested loss data, so equivalent key order does not unnecessarily invalidate confirmation. No generic serialization framework is needed. The source qualification gate is accepted subject only to the explicit R1 prelude; do not reopen already accepted source decisions.

## Delivery boundaries

- Keep one writer and pure `hydronics/src/engine/` API: no UI, browser state, Fabel, workbook macros, network dependence or persistence in the engine.
- Implement HYD-002/HEDMEP-199 and HYD-003/HEDMEP-200; source/property code is already present. Preserve qualified data and independent fixtures.
- Do not add automatic sizing, balancing, pump curves, static lift, new reference products, broad fitting data or a drawing editor.
- Use shared diagnostics/results/types; extend code union for numerical/topology failures as needed. Caller receives auditable itemization and reasons, not only an exception string or NaN head.
- Keep accepted snapshots/UI/import security work for HYD-004/005. A reusable validator for engine input is in scope; a file picker or autosave is not.
- Statuses follow evidence: only parent-accepted foundation may become Done; engine/circuit tickets move In Progress then In Review on handoff, not Done before independent review. HYD-004–007 remain Backlog.

## Calculation and input invariants

Follow the full plan formulas and units. Key failure classes to prevent:

1. Physical section pipe length counted exactly once; fitting/valve/equipment rows are separate stable-ID non-pipe inputs. Resolve selected nominal reference to actual ID and overrideable roughness. Unsupported entries never become zero.
2. v=Q/A; SI rho/mu for Re; Darcy64/Re only for Re<2000, transition2000–4000 inclusive blocks final recommendation, Colebrook only for Re>4000 with bounded iterations and residual/convergence checks. Low-level zero flow is zero loss without division; active terminal flows are positive. Reject invalid numeric domains and derived overflow; no apparently valid NaN/Infinity or unresolved numerical solve.
3. K, fixed equivalent feet, DOE Le/D presets, Cv, direct actual-fluid psi and direct actual-fluid head. Quantity is nonnegative integer. Zero/known K is not missing K. Irrelevant fields from an old element type do not contribute.
4. DOE ratios are generic turbulent estimates, never use in laminar/transition; current geometry gives equivalent feet. Every applicable non-pipe loss needs explicit current-fluid/service confirmation before design acceptance. Manual K/EL can support other service only when explicitly qualified. Re in a pipe does not prove viscous/choked valve applicability.
5. Cv uses SG versus IAPWS water at60°F; head cancels actual-fluid density algebraically. Never multiply SG twice. Direct psi does NOT have that cancellation. Report actual-fluid head and loss-equivalent psi, not arbitrary flange static gauge differential.
6. Basis construction/confirmation helper must normalize the CURRENT element data and declared envelope, deep-copy the saved relevant basis, and include active data-version identity. Keep unconfirmed/draft elements representable. Test changes in element numerical input, quantity, envelope, fluid/T/ID/roughness, indirect shared GPM and data version. Do not trust imported matching strings as human approval; the later import workflow requires fresh explicit local acceptance.
7. No preset margin: stored percent is percent units, finite>=0, valid deduplicated category names, explicit acknowledgment even zero. raw=sum categories; increment=(percent/100)*sum selected categories; factored=raw+increment. Never apply twice or choose governing circuit before factoring.

## Topology and completeness

Implement the plan's directed split-supply/merge-return model, explicit role/endpoints and terminal identity. Circuit demand is the only authoritative flow input; shared section GPM is membership-derived sum, never separately editable.

- Continuous discharge→supply→unique terminal→return→suction paths. Separate supply/return routing; valid reverse-return supported, no mirroring/doubling supply length.
- Reject unknown endpoints/section IDs, duplicates, repeats, reversed/discontinuous paths, self-edges, cycles, cross-connected meshes, incompatible section roles, mixing supply/return nodes, terminal reuse, pump-boundary bypasses and conflicting membership/connected active topology.
- Draft/unused stored sections/circuits are visibly excluded, not silently calculated with zero losses. Do not falsely call unused inventory active. Zero-length sections are allowed when topology and required data are valid; do not invent their pipe loss.
- Evaluate a shared section once, reference the SAME flow and itemized loss in each circuit. Sum series within a circuit; governing system head is max complete factored circuit, never sum parallel paths. System flow is sum active terminal demand.
- ANY incomplete/invalid ACTIVE circuit blocks final design eligibility for the entire system. Partial valid sections/circuits may remain inspectable but cannot be passed off as a complete pump recommendation. No-active-circuit systems have no governing result.
- Preserve raw and factored governing IDs, deterministic tie handling, raw/category/margin/factored subtotals, source/basis diagnostics. Sum itemization at full precision; rounding only at display/report boundary.

## Independent numeric evidence (Astra, not production engine output)

Parent used separate Python IAPWS equations and bisection Colebrook. g=9.80665m/s², ft=.3048m, inch=.0254m, USgallon=.003785411784m³, psi=6894.757293168361Pa. Roughness .00015ft in all cases below. The current rounded psi converter differs by a negligible ~5e-14 relative; do not force fake exact-bit identity.

- Water77°F: rho997.0470133997646kg/m³, mu0.000889996773678783Pa·s.
- IAPWS water60°F reference density: **999.016490664473kg/m³**.
- Water77°F,10GPM,1.049in actual ID,100ft: velocity3.7122620505542807ft/s, Re33774.58316656881, Darcyf0.027080012091821405, head**6.634316015514317ft**, loss-equivalent**2.867665205558536psi**.
- PG50 from approved2001 source,30°F,1GPM,1.049in actual ID,100ft: velocity0.3712262050554281ft/s, Re161.68063649254984, Darcyf0.3958420834330961, head**0.9697711599352945ft**, pressure**0.44326623435375745psi**. Also independently compare this laminar case to Hagen–Poiseuille, not just64/Re used twice.

### Shared two-circuit fixture

Water77°F, terminalA10GPM, terminalB20GPM. Shared supplyS0 and returnR0 each30GPM; independent branch flows10/20. Use valid distinct pump boundaries, one split supply junction, one merge return junction and one unique terminal bridge per circuit. Terminal bridge pipe length may be0; attach A's8ft actual-fluid equipment loss and B's3psi actual-fluid equipment loss to those bridges. Put Cv40 common valve inS0, confirmed at30GPM. All roughness .00015ft. Pipe-only values:

| Section | GPM | Actual ID in | Pipe length ft | Independent pipe head ft |
| --- | ---: | ---: | ---: | ---: |
| S0 common supply | 30 | 2.067 | 50 | .8746486902207692 |
| R0 common return | 30 | 2.067 | 40 | .6997189521766154 |
| SA branch supply | 10 | 1.049 | 100 | 6.634316015514317 |
| RA branch return | 10 | 1.049 | 75 | 4.975737011635739 |
| SB branch supply | 20 | 1.380 | 100 | 6.155093556301434 |
| RB branch return | 20 | 1.380 | 50 | 3.077546778150717 |

Common Cv40 valve head at30GPM = **1.2987728885513907ft**. B's3psi = **6.940471296288036ft** actual water. Therefore:

| Circuit | Pipe ft | Equipment ft | Valve ft | Raw ft | 25% pipe-only increment ft | Factored ft |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 13.18442066954744 | 8 | 1.2987728885513907 | 22.483193558098833 | 3.29610516738686 | **25.779298725485692** |
| B | 10.807007976849535 | 6.940471296288036 | 1.2987728885513907 | 19.04625216168896 | 2.7017519942123838 | **21.748004155901345** |

Result: flow30GPM, A governs, not sum of parallel heads. Include actual terminal section geometry but zero terminal pipe length; no accidental third pipe-length contribution. Parent full values are also in `%LOCALAPPDATA%/Temp/hydronics-sources/parent-independent-engine-goldens.json`.

Separately test governing crossover with pure category totals: A10pipe+20equipment, B20pipe+9equipment. RawA30>B29;25%pipe-only gives A32.5<B34. This fixture isolates margin/max order from pipe physics.

### Other required validation

- Exact Re endpoints1999.999/2000/4000/4000.001; zero flow, nonconvergence/bracket failure, invalid/overflow inputs, all loss types/categories/quantity rules and known-zero versus missing data.
- Legacy arithmetic case and named-source49°F difference in the implementation plan; do not make a legacy-property result the new water-property oracle.
- Valid direct/reverse-return graphs, shared flow conservation, ties, invalid-active blocking even with another valid larger circuit, unused drafts, membership integrity and missing/unqualified losses.
- Change B demand20→40: common equipment basis30→50GPM must become incomplete until explicitly requalified; fluid/T/loss/data-version variants too.
- Strict build BEFORE tests, qualification still passing, new tests against these independent constants rather than production-generated expectations. Stop for independent numerical and topology/completeness review before UI.
