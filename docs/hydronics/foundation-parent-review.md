# HYD-001 parent source and implementation review

Status: repaired source data and R1 applicability-version prelude ACCEPTED after independent validation. HYD-001/HEDMEP-198 is Done; parent directly verified its Linear status after the engine handoff. Terra remains sole application implementation writer. HYD-002/003 are implemented but NOT yet accepted; their separate numerical/topology review found blockers, tracked in `engine-parent-review.md`. UI remains gated.

## Independently run validation

`cd hydronics && npm run build && npm test` passed: TypeScript typecheck and 8 tests. Passing tests do not establish correct transcription: the all-node test iterates the implementation dataset and derives its expectations from those same values.

## Blocking transcription defect

Astra independently extracted cells by **header x-coordinate**, not row-array position, from the pinned PDFs using PyMuPDF; then inspected the four rendered source tables. Of 216 implemented property values, 54 are wrong: all three EG density series use the next concentration column. PG density/viscosity and EG viscosity match their selected source cells.

Example, SR-1 Table 10 at 30°F:

| Literal volume percent EG | Source density lb/ft³ | Implemented density lb/ft³ |
| --- | ---: | ---: |
| 30% | 65.76 | 66.70 (40% column) |
| 40% | 66.70 | 67.59 (50% column) |
| 50% | 67.59 | 68.44 (60% column) |

At 200°F, correct 30/40/50% densities are 62.79 / 63.56 / 64.27 lb/ft³, not 63.56 / 64.27 / 64.93. Error ranges approximately +1.03% to +1.43% density over these affected samples. This is an implementation transcription repair, not a proposed engineering assumption change. Recompute EG interpolation/Re/head qualification metrics after correction. Add independent source expectations and cross-revision diagnostic checks so a shifted column cannot pass merely because conversion works.

Temporary parent audit artifacts (not distributed reference documents): `%LOCALAPPDATA%/Temp/hydronics-sources/parent-independent-source-nodes.json`, `parent-source-comparison.json`, `parent-qualification-audit.py`, `parent-independent-qualification.json`, and rendered `parent-*.png`.

## Provenance corrections

The acquired copies DO have legible back-cover dates/form numbers, verified in both extracted text and rendered covers:

- DOWFROST: **Published September 2001**, **Form No. 180-01286-0901 AMS**. Density Table 9 is printed page 18 / PDF page 17; viscosity Table 13 printed page 22 / PDF page 21.
- DOWTHERM SR-1: **Published February 2008**, **Form No. 180-01190-0208 AMS**. Density Table 10 printed/PDF page 18; viscosity Table 14 printed/PDF page 22.
- Existing raw-file hashes remain valid; do not claim unspecified revision. A Dow-domain DOWFROST guide URL was found (`https://www.dow.com/documents/180/180-01286-01-engineering-and-operating-guide-for-dowfrost-and-dowfrost-hd.pdf`), but direct request returned HTTP 403, so no downloaded-primary-content equivalence is claimed.
- Public availability or an acquisition hash does not grant redistribution rights. This authorization is local development of a bounded numerical subset with citations, not deployment, redistribution of source PDFs or legal certification. Keep raw documents temporary and retain future redistribution review as a handoff limitation, not an invented requirement to buy full ASME libraries for this private prototype.

## Independent corrected-data qualification

Astra independently recomputed leave-one-out (LOO) tests from correctly extracted source nodes: predict each interior 40–190°F value using its two neighbors (20°F bracket), linear density and log-linear viscosity. Use 100 US GPM, 100 ft, **custom** 4.026-inch actual ID (not a catalog-qualification claim), 0.00015 ft roughness, exact SI conversions, g=9.80665 m/s² and bisection Colebrook. All representative cases are turbulent. Parent numeric results:

| Series | density max/RMS % | viscosity max/RMS % | Re max/RMS % | head max/RMS % |
| --- | --- | --- | --- | --- |
| PG30 | 0.015738 / 0.008806 | 1.292377 / 0.737887 | 1.283895 / 0.738109 | 0.234354 / 0.134025 |
| PG40 | 0.016072 / 0.008798 | 1.329931 / 0.864879 | 1.320060 / 0.862159 | 0.336103 / 0.181311 |
| PG50 | 0.016013 / 0.010668 | 1.330072 / 0.774841 | 1.327642 / 0.774342 | 0.364458 / 0.181384 |
| EG30 corrected | 0.015637 / 0.008878 | 1.086229 / 0.581425 | 1.082345 / 0.582310 | 0.204588 / 0.098535 |
| EG40 corrected | 0.015389 / 0.008761 | 1.022436 / 0.598739 | 1.019521 / 0.600011 | 0.232066 / 0.113443 |
| EG50 corrected | 0.015314 / 0.009063 | 0.910729 / 0.516571 | 0.909867 / 0.518863 | 0.211051 / 0.107650 |

**Parent implementation acceptance limits:** each series must have LOO max absolute density error <=0.025%, dynamic viscosity <=1.5%, Reynolds <=1.5%, and representative head <=0.5%, plus exact independently checked source-node reproduction. Rationale: corrected source data meets these conservative rounded regression thresholds; 10°F production intervals are narrower than the LOO test's 20°F brackets. These thresholds are regression checks against a pinned rounded table, NOT certified interpolation bounds, fluid-property accuracy, safety factors or a guarantee for every circuit. Do not copy a source cell into a test expectation programmatically from production data.

Additional independent check against each guide's SI tables at every 5°C from 0–90°C (32–194°F): interpolated English versus SI maximum differences across the six series were approximately **0.0108% density and 0.8873% viscosity**. This comparison includes unit-grid/interpolation/rounding differences; do not assert every difference is a typo. Store the full diagnostic comparison or a reproducible bounded harness.

At 40°C, correct EG English-guide predictions are density/viscosity (SI): 30%=1037.932353/1.343679, 40%=1051.804342/1.774363, 50%=1064.875408/2.260810. They provide useful cross-revision checks against the 2017 TDS values already recorded (1037.92/1.3398, 1051.85/1.7731, 1064.91/2.2567); no revision splicing or current-formulation accuracy claim.

## Source discrepancy disposition — approved by Victor

Victor selected **Pinned guide tables (Recommended)** in the structured source decision. Use each pinned guide's English table consistently; explicitly label the dated named-product typical-property basis. At 50°F/10°C, PG50 English viscosity is 10.65 cP, SI guide is 10.59 mPa·s (0.57% lower relative difference); 2019 TDS prints 10.6481, close to English. Do not silently average, repair, or splice tables. Wrong guide water-column behavior is irrelevant to the selected glycol columns: use the separately verified IAPWS water equations, never guide 0% data. Quarantine inconsistent TDS rows, which are not lookup sources and include out-of-product-range temperatures. User already approved volume percent **glycol**, not commercial concentrate; do not ask that decision again.

## Other findings / remaining gate

- Water function currently accepts NaN through comparisons and can return NaN properties marked nonprovisional: reject nonfinite/non-number runtime temperatures at the public calculation boundary. Unknown references must be explicit errors, not water fallback.
- Full independent code/contract review is running; source catalog research is separately running. Their accepted findings will be synthesized before one Terra repair launch.
- Catalog source identity/dimensions and a small real fitting subset still need completion. Manual-only is not the final approved fitting-library scope. Independent source reports must distinguish exact dimensions from .001-inch source-rounding differences.
- HYD-001 cannot be Done or reference options promoted merely on these limits. Source-choice decisions are now approved; correct the implementation, close accepted review findings and rerun independent validation first.

## Parent disposition of independent code review

Apply **all B1/B2/B3 and F1–F5** from `.pi/research/hydronics-foundation-code-review.md`. These are bounded prerequisite fixes, not new product scope:

- Strict finite-number property guards; accurate unknown-reference tests.
- Shared unconfirmed/confirmed applicability union for every non-pipe element, with a normalized confirmed basis covering current *derived* flow, fluid/reference/data version, temperature, resolved diameter/roughness, element type/value/quantity/preset/basis and declared envelope. Conservative mismatch invalidation; no automatic permission from matching unrelated inputs. Add foundation basis-change fixtures; full graph/browser tests remain later.
- Remove redundant input PipeElement; one section length means one automatic pipe-loss result.
- Stable per-section element IDs; exported engine/data versions and common diagnostic/completeness contracts; explicit named SI/IP boundary.
- Immutable reference data and catalog entries, validated positive finite node arrays/geometry, independent source expectations and retained qualification script.
- Replace affected Vitest tooling with a compatible patched release (no blind force-fix); rebuild/test and report full/prod audits. No UI/dev server is exposed yet.

## Catalog source acceptance and remaining transcription work

Parent acquired original reference bytes and rendered the cited sheets in `%LOCALAPPDATA%/Temp/hydronics-catalog-review/`; full URL/hash receipts are `parent-acquisition.json`. These source choices are accepted for the bounded nominal-reference catalog, not manufactured dimensional tolerances or pressure ratings:

- Steel40/80: TPS *Tube & Pipe Sizes*, 7th edition + APP v7; literal10: Botop plain-end Sch10 + APP v7. Parent visually checked APP's distinct schedule columns, Botop10/80 and TPS p.7. Accept **Sch80 NPS10 wall .594 / ID9.562** and **NPS12 wall .688 / ID11.374**. Current .593/.687 are unsupported transcription assumptions; repair, do not invent an older edition as justification. STD/XS and S-suffix are not aliases.
- Copper K/L/M: CDA *Copper Tube Handbook* 2006 Tables2a–c pp.21–22, parent visually checked; Mueller reference sheet independently cross-publishes the common rows through8 inches. For10/12, parent also fetched Engineers Edge's `copper_tubing_size_chart_astm_b88_13181.htm` and verified all six rows against CDA. **Accept this as secondary cross-publication corroboration**, honestly potentially derivative—not an independent laboratory or primary-manufacturer validation. No need to acquire paid ASTM text or block these nominal reference dimensions indefinitely.
- Implement only the15 common nominal sizes listed by the research report, at Sch10/40/80 and K/L/M. Do not reproduce entire source books. Attribute default roughness separately: approved plan already allows legacy steel .00015 ft / copper .000033 ft as visible editable *assumptions*, not material guarantees.
- Relevant raw hashes: TPS7 `8e34aae258c8f28695d58f48da74c37bf48c2d748c274c333abde207b3e74ca9`; APPv7 `276ddb4d0f89f57cf2d85efddb123e8de31f3486fc064920c46f18b437b6b6a0`; Botop10 `3ab3e33697f5f7a853b96a21b4e76c3b4a8e461bddfa72f635b0c31d69aaf071`; Botop80 `49ec6dab5ca23bc174ffca44b42f41a058634efac7508f6e7d16fcff540f1838`; CDA2006 `b3b03656722f2ff55cca5ab8d593a4691ca0c2fa29107f93196857e5a8baeba6`; Mueller `212183ab06b3ced2d7d9f1ce9af81317704f57e9d09ecb57638e7da04d738540`.

## Fitting choice — explicitly approved by Victor

After discussion of the CDA Hazen–Williams mismatch, Victor selected **Typical Darcy estimates (Recommended)**: DOE standard90/45 elbow Le/D values, generic and requiring engineer applicability confirmation, not manufacturer-specific/connection-qualified or universally glycol/laminar-valid data. This supersedes the researcher's proposed CDA conversion exercise. Do not implement CDA EL or the narrow NIST push-connect examples.

Astra fetched **DOE-HDBK-1012/3-92, June1992**, directly from `https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL3.pdf`, SHA256 `0135196976fc613fa7e0129776e9fd74ead03e6cc3a37bab65803d5484140974`; source is public release, distribution unlimited. Visually checked HT-03 Table1 printed p.35 / PDF p.57: **standard90 elbow Le/D=30; standard45 elbow Le/D=16**. Preceding section uses Darcy and K=f*(Le/D), not Hazen–Williams.

Implement two explicit generic preset definitions storing the source ratio/identity. Compute equivalent feet from CURRENT actual section diameter; diameter/fluid/flow/data changes invalidate applicability confirmation. No silent fixed-friction-factor conversion. Turbulent-only software guard is a conservative product restriction, not a claim of a tested manufacturer Re envelope. For all fluids, engineer confirmation must explicitly accept the generic approximation at current conditions; glycol must not auto-inherit a water confirmation. Laminar use requires separately qualified manual data, not these presets. Metadata must say connection/model unspecified. Manual K/EL remains available.

## Next writer authorization

The completed repair launch was HYD-001 only. Its subsequent validation and next authorization follow.

## Repaired-source validation and next authorization

Astra independently ran `cd hydronics && npm run build && npm test && npm run qualify`: strict build,13 tests and all six qualification series passed. Separate temporary transpilation of the ACTUAL repaired public engine matched all216 property values against the parent's original PDF extraction, all90 pipe rows against cross-published reference transcription, and408 interior glycol states against independently calculated interpolation. Malformed-temperature dispatcher probes also rejected as expected. This closes the source-data acceptance gate for the approved bounded typical-property/catalog/preset use; it is not field/product certification.

Fresh focused reviewer `.pi/research/hydronics-foundation-repair-review.md` found no further foundation blocker except **R1: missing referenceDataVersion in applicability basis**. Astra accepts R1 and its exact minimal fix: required string field, current basis from active exported data version, matching-version success plus changed/missing-version incomplete regressions. Never backfill an old saved permission's missing version. **Terra is authorized to fix R1 first, run strict build and tests, and then proceed to HYD-002/003 only if that prelude passes.** This bounded conditional approval does not authorize bypassing a failed test or substituting an imported project version for active data identity. HYD-001 may become Done only after that condition is met and its receipt records the evidence.

R2 is low-severity false rejection from JSON object key order. Accept fixed field-ordered normalized comparison during engine integration; do not add a generic serialization framework. Consumer validation of finite/valid current/saved bases and current-flow derivation is part of HYD-002/003 as planned.

Next scope and independent hydraulic goldens: `docs/hydronics/engine-stage-handoff.md`. Stop for independent actual numerical/graph review before UI. No new user engineering decision is outstanding; no Fabel/workbook/commit/deployment authorization changed.
