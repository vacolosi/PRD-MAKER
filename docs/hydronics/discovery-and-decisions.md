# Hydronic pressure-drop calculator — discovery and decisions

Status: seven tickets published as HEDMEP-198 through HEDMEP-204 (see `linear-receipts.json`). HYD-001 provisional foundation was implemented and independently reviewed; repairs are required before dependent work. Victor approved the pinned Dow English-guide source choice and explicitly approved generic DOE Darcy-based elbow estimates with engineer applicability confirmation. See `foundation-parent-review.md` for independent evidence, qualification limits and repair gate.

## Confirmed by Victor

- Build a standalone web calculator in `C:/Users/Victor Colosi/dev/PRD maker`.
- Astra owns planning, ticket content/review, orchestration and final acceptance. Delegate ticket publication and coding to Terra (`azure-openai-responses/gpt-5.6-terra`, verified and used).
- Later integration target: `C:/Users/Victor Colosi/dev/Fabel 5 Trace 3D`. Do not modify that repository now.
- Linear destination: **Hedral Heat Load Calc**, parent **HEDMEP-134 Hydronic & controls**, matching **Hydronic & controls** pillar label.
- Include water and 30%, 40%, 50% propylene/ethylene glycol selections as **volume percent glycol**, not commercial concentrate. Use IAPWS water and verified named DOWFROST/DOWTHERM SR-1 reference data rather than legacy polynomials. One mean temperature per system; first software ranges water 32–200°F and glycol 30–200°F, no extrapolation; disclose single-phase liquid/reference-property assumptions.
- Discuss each material workbook discrepancy with Victor before selecting a changed behavior.
- After inspecting the actual airside workflow, Victor approved **shared sections + circuits**: define physical sections once, define full supply/return circuits, aggregate terminal design GPM through shared sections, compare circuit losses. Manual connections now; Fabel supplies geometry later. No drawing tools or nonlinear network-flow/pump-curve solver in this first pass.
- Correct broken workbook references, inconsistent feet-loss element support and nominal-size lookup defects; document and test differences rather than emulate error cells.
- Use laminar friction in its valid regime and turbulent friction in its valid regime; flag transitional sections and block final pump-head recommendation until resolved. No legacy all-regime Colebrook behavior.
- Primary results: **feet of actual pumped fluid plus differential psi**, converted using that fluid's density.
- Margin starts with **none applied, visibly labeled**. Engineer must acknowledge or choose percentage and included loss categories before accepting a pump-head result. No hidden 15%/25% preset.
- Closed circulation loops first; no open-system static lift, NPSH or pump curve solver. Vertical length contributes friction, not building-height static head.
- Small traceable fitting preset library plus manual K/EL; unsupported combinations require explicit values, never zero fallback. At the source checkpoint, Victor explicitly selected **Typical Darcy estimates**: start with DOE standard 90°/45° elbow Le/D estimates, visibly generic rather than manufacturer/connection-specific, requiring engineer applicability confirmation and no universal glycol/laminar validity claim. Do not adopt CDA Hazen–Williams EL as Darcy data.
- Engineer selects pipe sizes; display actual ID, velocity and friction rate. No automatic size recommendations or legacy operating-hour tables in v1.
- Proposed supporting workflow presented with these choices: local JSON save/open, printable math and CSV; manufacturer/service applicability acknowledgment for Cv or qualified direct pressure-loss input.

## Evidence and boundaries

Legacy reference: `C:/Users/Victor Colosi/Desktop/Home Page/Mechanical/Calculations- One Note/SHG_Pump PD Calc.xlsm`.

Read-only audit SHA-256: `9763963950c8c5ea1b83fa069dca3db603edb4872928f1992859c7a84b969a85`.

Research artifacts (local, not implementation contracts):

- `.pi/research/hydronics-workbook-audit.md`
- `.pi/research/hydronics-fabel-integration.md`
- `.pi/research/hydronics-airside-workflow.md`
- `.pi/research/hydronics-engineering-evidence.md`
- `.pi/research/hydronics-plan-numerical-review.md` and `.pi/research/hydronics-plan-contract-review.md` (completed; disposition recorded)

Parent-authored approved plan: `docs/hydronics/implementation-plan.md`. Machine-readable approved Linear ticket specifications: `docs/hydronics/tickets.json` (HYD-001 through HYD-007; last is deferred future integration). Parent review disposition and independent water numerical spot-check: `docs/hydronics/plan-review-disposition.md`.

Workbook read via ZIP/XML/openpyxl and static VBA inspection only. No VBA execution, workbook modification, upload, or bulk reference-library redistribution. Fabel source-only inspection; no browser validation/build/test claim. Original workbook and Fabel source remain untouched. Existing unrelated `scripts/land-safe.mjs` in PRD maker and `.pi/relay.json` modification in Fabel must be preserved.

## Airside pattern to adapt, not copy

Fabel's drawn-main workflow produces an explicit branching tree at known design CFM; shared sections accumulate downstream flows. Its pressure engine evaluates root-to-terminal paths, produces its own itemized losses and picks the highest-pressure path. It is not a flow-balancing solver. The report includes a Show the math inspector and explicit fan-static acceptance with separate non-duct allowances.

Load-bearing source paths in Fabel:

- `packages/web/src/viewer/ductTerminals.ts`: terminal guesses/overrides and tap geometry.
- `packages/web/src/viewer/ductDerive.ts`: shared tree, flow accumulation, inferred dimensions/fittings.
- `packages/web/src/pressureDropExport.ts`: flow basis, stale/missing-result gates and export.
- `packages/pressure-drop/src/engine/evaluate.ts`: itemized loss walk and governing path.
- `packages/web/src/pressureDropInline.ts`: engine boundary and result model.
- `packages/web/src/v2/pages/PressureDropInspector.tsx`: read-only math inspection and component edits.
- `packages/web/src/fanStaticAccept.ts`: explicit acceptance and stale retained values.

Do not carry over these limitations:

1. Drawn runouts are zone-centroid estimates; missing floor elevation can use a warned 12-foot fallback. Generated routing is a separate proposal/export pipeline, not the inline pressure report's input.
2. Source omissions/approximations can coexist with engine-complete status. New hydronic result eligibility must distinguish valid arithmetic from complete circuit inputs.
3. `V2PressureVentDerived.ts` builds a fan acceptance offer per main; `V2PageHost.tsx` accepts the selected row and `store.ts` does not enforce a maximum across mains. Hydronic pump acceptance must use the complete governing circuit across its declared boundary, not any arbitrarily selected lower-loss circuit.
4. Airside equipment losses are system allowances. Hydronics needs actual branch/common equipment placement and an explicit loss basis.
5. Airside fluid constants, duct dimensions, fitting vocabulary and supply-only topology are not hydronic contracts.

## Open engineering decisions / discrepancy register

No recommendations here are approved merely because they are documented.

| ID | Evidence | Decision still needed |
| --- | --- | --- |
| D1 — approved | `Calculations!J15` contains literal #REF!; current totals cache #VALUE!. Some rows omit COMPONENT(FEET); VBA tee-main EL code uses actual ID to search a nominal-size table. | Correct structural defects and invalid-input behavior rather than reproduce broken results. Use saved examples only as candidate regression evidence. |
| D2 — approved | Colebrook applied regardless of regime; template PG example Re about 2,390. | Laminar math and turbulent math in their ranges; transition blocks final head recommendation. Explicit zero-flow/validation/convergence behavior belongs in implementation contract. |
| D3 — approved | Darcy/K produce feet of flowing fluid while labels say feet H2O; fixed psid × 2.307 ignores fluid density. | Feet of actual fluid plus psi, density-aware conversion. Preserve correct standard Cv head cancellation; separately label viscous correction limitations. |
| D4 — source selection approved | Legacy polynomials and source discrepancies independently reviewed. | Victor selected pinned DOWFROST September 2001 and DOWTHERM SR-1 February 2008 English tables; keep dated typical-property labels and discrepancy notes, no splicing. Astra set quantitative regression limits in `foundation-parent-review.md`. EG density transcription must be repaired and source-node tests independently verified before acceptance. IAPWS water and previous concentration/range decisions unchanged. |
| D5 — approved | Current margin 15%, examples/instructions 25%; only PIPE and FITTING receive margin, not valves/components. | No preset; visibly show zero/unacknowledged. Engineer acknowledges or sets percentage and included categories before acceptance. |
| D6 — source choice approved | Copper handbook EL uses Hazen–Williams, not an interchangeable Darcy calibration. | Victor approved DOE generic Darcy-based 90°/45° elbow estimates plus manual K/EL, with explicit engineer confirmation and honest generic geometry/connection limitations. Missing/unsupported never zero. DOE source table and equation independently verified by Astra; implementation remains to be repaired/completed. |
| D7 — proposed deferral | Reducer formulas use nominal diameter ratios and simplified geometry assumptions. | No automatic legacy reducer model; engineer-entered manual K with stated velocity basis proposed in final plan. |
| D8 — approved | Legacy sizing uses operating-hour tables and company-specific minimum-size rules. | Explicit size selection/checks only; no recommendations/operating-hour tables/compliance claim in v1. |
| D9 — approved | Spreadsheet allows manually entered cooling-tower head but does not distinguish open/closed loops. | Closed-loop only, defer open-system static head/NPSH. Vertical length friction is not static lift in a filled closed circulation loop. |
| D10 — approved | Final supporting plan approved with staged build. | Local save/open JSON, itemized print/CSV, accepted snapshot/staleness behavior and endpoint/connectivity validation. Imported historical acceptance requires fresh explicit local acceptance. |

## Tracking preparation

Read-only Linear lookup verified parent `HEDMEP-134` has no children. Project search for hydronic, pressure and pump titles returned only the parent (not a guarantee against all semantic duplicates; recheck when final ticket titles exist).

Resolved IDs for later authorized publication:

- Verified runtime Terra model: `azure-openai-responses/gpt-5.6-terra` (local live model-store contains it; unlike the older relay setting's provider).
- Team Hedral-MEP: `2ac3c649-41f8-4ba3-ac45-1d92ccf1afef`
- Project Hedral Heat Load Calc: `b6a89518-aa85-41a9-9b70-391afcc1f0e4`
- Parent HEDMEP-134: `082bf1de-e40e-4bce-8447-8cd2e71f6757`
- Hydronic & controls label: `c22ea7c0-9537-422d-9675-0909771f88b7`
- Victor: `a16bfe31-25dd-44bf-befc-2c7364356476`

Authentication is local configuration only; never write credential values to artifacts or issues. User requested Linear-first standalone tickets; Fabel's GitHub-mirror protocol does not authorize creating Fabel issues or changing that repo during this isolated first pass.

## Proposed next steps

1. Resolve calculation/data discrepancies and remaining bounded MVP scope with Victor.
2. Astra writes a portable TypeScript engine contract, UI boundaries, acceptance criteria and dependency-ordered tickets; obtain plan approval.
3. Delegate final Linear ticket publication and implementation to a single writer. Keep independent reviews read-only and apply fixes serially.
4. Verify independent hydraulic cases, shared-section/circuit fixtures, invalid inputs, persistence and an actual browser workflow; report limitations honestly.
5. Do not commit/push/publish a deployment or modify Fabel without additional authorization.
