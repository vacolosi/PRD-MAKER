# Hydronic pressure-drop v1 — proposed implementation plan

**Owner:** Astra (planning/independent acceptance). **Implementer:** Terra (`azure-openai-responses/gpt-5.6-terra`). **Reviewer:** Sol (`azure-openai-responses/gpt-5.6-sol`), per Victor. **Current status:** HYD-001 foundation, HYD-002/003 engine, and HYD-004 editor/Show-the-math are accepted; see `foundation-parent-review.md`, `engine-acceptance.md`, and **`ui-acceptance.md`**. HYD-005 persistence/acceptance/reporting is the next implementation stage; final HYD-006 validation remains unfinished. Victor approved ticket publication and staged implementation. Historical source/repair checkpoints below record the original gate sequence and do not supersede the current acceptance documents. Read `discovery-and-decisions.md` for user decisions and audit evidence.

## Outcome

An engineer can build a closed-loop, prescribed-design-flow hydronic calculation in a standalone browser application: define shared physical supply/return sections once, connect complete circuits through terminal equipment, enter terminal GPM, select pipe sizes, enter losses, compare circuits and inspect the governing pump-head calculation. Water and discrete 30/40/50 volume-percent glycol options are supported with named reference data. No Fabel files are changed.

## Approved product/engineering decisions

- Standalone here; future Fabel integration through a portable engine and versioned JSON contract.
- Shared sections plus explicit supply/return circuits, not isolated duplicate spreadsheets. Known terminal design GPM; no flow balancing.
- Closed filled circulation loops only. Vertical pipe length contributes friction; building elevation does not become circulating static lift. No open tower, fill-pressure, NPSH, pump curves, pump power or absolute-pressure/phase solver.
- Water: IAPWS reference properties. PG/EG: verified, named DOWFROST/DOWTHERM SR-1 reference datasets, at 30/40/50 **volume percent glycol**, not percent commercial concentrate.
- Proposed and accepted first operating range: water 32–200°F, glycol 30–200°F. One mean temperature/fluid per system. No extrapolation or silent clamping; single-phase liquid condition is an explicit engineer assumption. These bounds are software scope, not a claim to validate boiling/freezing/absolute pressure in every installation.
- Repair broken reference/element/nominal-size lookup behavior. Never reproduce spreadsheet error cells as acceptance results.
- Laminar calculation in its range; transitional flow blocks a final pump recommendation; turbulent calculation in its range.
- Outputs: feet of actual pumped fluid and its loss-equivalent differential psi (pressure equivalent of required pump total head). This is not a prediction of static gauge difference between arbitrary pump-flange measurement points; those comparisons need velocity/elevation corrections. It is never absolute system pressure.
- No preset margin. Show zero/unacknowledged and require an explicit engineer choice (including acknowledged zero), percent and included categories before acceptance.
- Small verified fitting library plus manual K/EL. Select pipe sizes and show velocity/friction rate; no automatic sizing, no operating-hour sizing tables, no ASHRAE compliance claim.

## Implementation boundary

Create a self-contained `hydronics/` application with its own package manifest/lockfile and Vite/React/TypeScript UI, strict TypeScript and Vitest. Keep engine, datasets, types and validators under `hydronics/src/engine/`, with a single public barrel. UI imports this API; engine imports no React, DOM, browser storage, Fabel packages or application state. A future package extraction must not require rewriting the math. Prefer minimal dependencies and a local-only application with no backend/account/cloud API.

Root `package.json` may gain explicit `hydronics:*` convenience scripts; preserve its existing hedral-relay dependency and unrelated files. Avoid ports 5173/8090 used by Fabel; use localhost 5175 with strictPort. No changes to Fabel, original XLSM, unrelated scripts, project agent configuration or credentials. No commits, pushes, deployment, PRs or Fabel issue writes under this plan.

## Versioned input contract

Use explicit IP-unit field names. Export an immutable JSON-serializable `hydronic-pressure-drop@1` project with stable project/system/node/section/circuit IDs. Keep calculations derived, not authoritative stored inputs. Store calculation/data version and provenance separately from user intent.

Each system owns:

- Name; fluid reference ID; discrete concentration where applicable; mean temperature F.
- Distinct pump discharge and suction boundary node IDs (pump itself is outside the loss graph).
- Named nodes and directed physical sections; section role `supply`, `terminal`, or `return`.
- Each section's endpoints, pipe catalog selection or explicitly entered actual ID/roughness, actual length ft, description, and ordered non-pipe loss elements with stable IDs (unique within their section). Physical length/geometry produces pipe friction exactly once; do not include repeatable pipe markers in the input elements. Preserve element IDs on reorder/edit; duplication creates a new ID.
- Circuits with ID/name, active/draft state, finite positive terminal design GPM, ordered supply section IDs, one unique terminal section ID, and ordered return section IDs.
- Margin percent, selected categories (`pipe`, `fitting`, `valve`, `equipment`), and explicit acknowledgment state.
- Optional provenance/source references suitable for a later host adapter; do not pretend a local label is a stable Fabel asset ID.

### Connectivity and flow invariants

1. Every active circuit is continuous, oriented discharge → supply → its terminal → return → suction. Supply and return are explicit, never silently mirrored/doubled.
2. No unknown endpoints/section references, duplicate IDs, repeated section within a circuit, self-edge, pump-boundary short circuit or reused terminal section across circuits.
3. Active supply graph is a splitting tree rooted at discharge (at most one upstream supply edge per node); active return graph is a merging tree ending at suction (at most one downstream return edge per node). No cycles, cross-connections, mixing supply/return nodes or unsupported hydraulic meshes. Separately routed direct/reverse return is allowed when these constraints hold.
4. Circuit membership must match connected active sections; no hidden alternate path or disconnected active terminal. Stored unused sections are visibly marked draft/unassigned, never represented as evaluated active distribution.
5. A shared section's GPM is the sum of the active terminal demands traversing it, exactly once per circuit. No independently editable conflicting section GPM. Every traversing circuit includes that section's calculated loss once.
6. Sum series losses within a circuit. Never sum mutually parallel circuit losses as pump head. For each circuit: `raw = sum(categoryHead)`, `margin = (marginPercent / 100) * sum(selectedCategoryHead)`, `factored = raw + margin`. Store percentage units, require finite `marginPercent >= 0`, and a valid deduplicated category set. Apply once. System design flow is sum of active terminal demands; governing head is max of complete factored circuit totals. Expose raw and factored governing circuits if they differ. No active circuits means no governing result/acceptance.
7. Any invalid or incomplete ACTIVE circuit blocks the system design/acceptance result. Do not silently discard it and choose the largest remaining complete circuit. Useful individual results may remain inspectable, explicitly provisional.
8. Circuit result itemization reuses engine-calculated items. Shared section identity, flow and loss stay identical across reports. Ties are deterministic and should identify all tied governing circuits, not hide the tie.

Routine implementation simplification is permitted if it preserves these invariants and the public behavior; ask Astra before weakening topology, completeness or accounting guarantees.

## Reference data gate (HYD-001)

### Water

Independently implement IAPWS SR6-08(2011) liquid-water density eq.(2)/Table 1 and viscosity eq.(7)/Table 5. Verify with official Table 8 at 298.15 K: density 997.047013 kg/m³, viscosity 889.996774 microPa·s. Keep explicitly named SI properties for internal reference/physical calculations and provide a named IP property adapter for public reporting/integration. Centralize conversions; do not scatter implicit constants or mix dynamic/kinematic viscosity. Declare pressure-independent reference-property approximation; differential-head output does not establish absolute-pressure suitability.

Source: https://iapws.org/public/documents/fKF3T/LiquidWater.pdf

### Glycol

Use ONE pinned guide revision for each named product; do not mix TDS and guide values as if they were one dataset. Extract only the needed 30/40/50 volume-percent-glycol columns and a temperature range bracketing 30–200°F. Prefer dense English guide grid, manually verified against rendered pages. Retain source owner/title/revision, URL, page/table/column/unit, file hash and verification notes. Source PDFs/workbook remain local/private reference material and are not shipped wholesale.

Candidate primary-authored guides and independent spot checks are in `.pi/research/hydronics-engineering-evidence.md`. Apparent SI/English/TDS conflicts must be visually checked. Never infer missing entries, interpolate across a blank, silently repair source anomalies, or fabricate coefficients. Use exact canonical table nodes and document why that source/revision was selected. If no credible unambiguous set supports a promised option, stop that ticket and ask Astra; do not advertise a working option with placeholder water properties.

Temperature interpolation: propose linear density and log-linear positive dynamic viscosity on adjacent verified grid nodes, exact node recovery, no concentration interpolation. Compare against held-out interior nodes and independent references; report max/RMS errors separately for density and viscosity and the resulting effect on Reynolds number and representative section/circuit head. Identify matching-revision checks separately from newer-product/TDS comparisons; cross-revision agreement is not certification. List EVERY known source conflict and proposed disposition, including English/SI disagreements, not just worker-selected material cases. Labels say these are typical named reference properties, not measurements of every commercial mixture.

**Source decision and repair checkpoint:** Victor approved pinned **DOWFROST September 2001** and **DOWTHERM SR-1 February 2008 English tables** after discussion of the English/SI discrepancy. Astra independently verified source columns and set regression limits/rationale in `foundation-parent-review.md`: per-series LOO max density <=0.025%, viscosity <=1.5%, Re <=1.5%, representative head <=0.5%, plus independently verified exact nodes. These are table regression checks, not fluid/product-accuracy guarantees. The first implementation shifted all EG density columns and must be repaired. HYD-001 cannot become Done or dependent work proceed until the actual repaired artifacts pass parent review; source choices and required corrections are now explicit.

### Pipe and fittings

Provide a bounded common-size catalog with actual IDs and source provenance. Target steel Sch 10/40/80 and copper K/L/M where data is verified, 1/2–12 inch nominal; clearly reject unavailable combinations. Qualify the EXACT dimensional designation/source edition at every size: STD/SW, XS, Sch 40/80 and S-suffix schedules are not universally interchangeable, including INSIDE this range. Specifically verify 12-inch STD versus Sch 40 and 10-/12-inch XS versus Sch 80. Test `ID = OD - 2*wall` and independent dimensional references. The workbook's hybrid labels are not canonical catalog IDs; a supplier's broad schedule heading is not sufficient evidence. Conflicting sources return to the source-acceptance gate. Explicit actual-ID/roughness entry supports unsupported pipe without inventing a nominal identity; adding STD/XS options or >12-inch catalogs is not required.

Victor explicitly approved the initial **generic DOE Darcy-based estimates**, rather than importing copper Hazen–Williams equivalent lengths or requiring product-specific presets only. Use DOE-HDBK-1012/3-92, June 1992, HT-03 Table 1 printed p.35/PDF p.57: standard 90° elbow Le/D=30 and standard 45° elbow Le/D=16. With current actual section diameter, EL=(Le/D)*D and K_equivalent=f_D*(Le/D). Clearly label generic estimates, connection/manufacturer unspecified; require explicit current-basis engineer confirmation for every use. Restrict preset use to turbulent service, and never call the generic entries manufacturer-qualified or universally glycol/laminar valid. Confirmed manual K/EL remains the escape hatch; stored preset identity/ratio must not silently turn into a stale fixed EL when diameter changes. Do not label threaded data as universal welded/grooved/copper coefficients. Manual reducers use engineer-entered K with explicit local velocity/diameter basis; do not port nominal-diameter reducer approximations. No new automatic reducer model. No unavailable lookup becomes zero. EL values from water-only tables are not automatically presented as validated for glycol. Fitting applicability and manual data provenance must be visible.

New-pipe roughness defaults may use legacy steel 0.00015 ft / copper 0.000033 ft with attribution, visible and editable; do not treat new-pipe defaults as suitable for every existing pipe.

## Calculation contract (HYD-002)

Use pure functions for unit conversions, fluid lookup, geometry, Reynolds number, Darcy friction and typed element loss. Do not copy airside calculation code; its all-regime turbulent correlation and fluid constants are inappropriate.

- `v = Q/A`; use actual ID, not nominal size.
- `Re = rho*v*D/mu`, with dynamic viscosity units explicit. Never confuse dynamic and kinematic viscosity.
- Use the EPA convention: `Re < 2000` laminar (`f_D = 64/Re`); `2000 <= Re <= 4000` transitional (blocked final result); `Re > 4000` iterative Colebrook with a stated tolerance, residual check and finite iteration cap. No nonconvergence value presented as a valid answer.
- At zero Q, low-level friction routines return zero loss without dividing by zero; active design circuits still require positive demand. Reject negative/nonfinite geometry, flow or properties. Pure fitting-only/zero-length section handling must not create artificial pipe friction.
- Darcy head `h = f_D*(L/D)*v²/(2g)`; K head `n*K*v²/(2g)`; EL head `n*f_D*(EL/D)*v²/(2g)`.
- Distinguish category from formula: valve K/EL remains category valve for margin even though its formula matches a fitting.
- Direct manufacturer psi is specified actual-fluid loss at design flow, not a silently water-rated value. Convert with selected density. Direct head means feet of that selected fluid. Display the assumed basis and require confirmation for design acceptance.
- Cv: `deltaP_psi = SG*(Q/Cv)^2`, SG uses a documented reference-water density at 60°F. Convert psi to actual-fluid head; density cancels algebraically in head. Do not multiply SG into that head again. No universal viscous/valve-Re correction. Engineer confirmation of applicable turbulent/nonchoked manufacturer Cv required for design-ready use; otherwise flag incomplete and request qualified pressure-loss data. Pipe Re alone cannot prove valve applicability.
- K/EL applicability is explicit. A lookup qualified for turbulent service is not silently valid for laminar flow. Store the relevant velocity/diameter basis in the input; omit presets whose other-leg or split-dependent basis cannot be represented. Do not conflate known K=0 with missing K.
- Applicability confirmations are bound to current operating conditions, not persistent Boolean permissions: record/compare section design GPM (including indirect shared-flow changes), fluid/reference/concentration/temperature, relevant geometry, element type/data and any stated valid envelope. Conservative invalidation is acceptable. Outside the qualified basis, active calculation is incomplete and new design acceptance is blocked until explicitly requalified. Apply on import too. Never auto-scale a one-point psi/head entry with Q² or invent a viscosity correction.
- Nonnegative integral quantity; finite nonnegative lengths/K/losses; Cv strictly positive. Inputs irrelevant to a selected element type cannot continue to contribute after switching types.
- Report ft of pumped fluid, psi, velocity ft/s, friction ft fluid/100 ft, Re/regime, f_D, density and viscosity. No hidden unit-specific factors distributed through UI code.

## Standalone UI (HYD-004)

A practical desktop engineer interface, not a graphical pipe designer:

- System/project header with fluid, mean temperature, root design GPM and draft/ready/accepted/stale state.
- Sections editor: names/endpoints/role, nominal material/size or custom actual ID, length and roughness, plus fitting/valve/equipment rows. Add/duplicate/delete safely; meaningful units and accessible labels.
- Circuit editor: terminal name/GPM and ordered supply/terminal/return sections. Shared selections refer to existing sections rather than copy their values. Show connectivity errors at the offending input.
- Results list: every active circuit, raw/category loss breakdown, margin, factored head and psi, governing/tie indication, incomplete reasons.
- Show the math inspector: one selected circuit's section/element rows, flow, velocity, Re/regime, applied coefficient/length, individual and cumulative losses. Summation must reproduce headline totals. Show reference-data and manual-input provenance.
- Margin controls show no margin until chosen, require acknowledgment even for zero, and expose included categories. Design acceptance always uses system governing result and all-active-circuit completeness; a selected non-governing circuit must not overwrite it.
- Friendly synthetic example with at least two terminals, shared supply and return, different branch losses and explicit equipment. Do not embed identifiable legacy project values/diagrams/metadata.

## Persistence, review and reports (HYD-005)

Versioned local JSON save/open; browser-local autosave with recoverable failure handling. No cloud transmission. Validate unknown input at load boundary, migrate only recognized versions, and preserve existing work if a file is malformed. Validate IDs, finite numbers, array sizes/references and bounds before evaluating imported files. Do not turn null/missing values or empty strings into zero defaults.

An accepted snapshot stores the actual normalized calculation inputs (a hash alone is insufficient), engine/data version, raw/margin/factored result and governing IDs. Changes to any relevant input or data version mark it stale; keep the previous accepted value visible without silently replacing it. Exclude timestamps/UI selection from numerical freshness identity. Applicability confirmations have the separate current-basis lifecycle above. Imported snapshots may display their historical values but require fresh explicit local acceptance; matching recomputation/version does not authenticate a previous human approval.

Pending invalid editor text must block new acceptance and mark the prior snapshot stale even if the engine retains a last-valid numeric object. Save/autosave must visibly distinguish last recoverable valid state from unsaved invalid edits; never claim an un-restorable invalid edit was saved. A separately validated editor-draft format is optional, not required.

Print a self-contained calculation report; export itemized CSV with units, basis, warnings and provisional labels. Missing losses have blank/unavailable fields and reasons, never false zero totals. Preserve full calculation precision until display. Escape user strings in HTML/CSV; defend formula-injection spreadsheet cells on CSV export. No arbitrary HTML injection from names/notes/imported files.

## Acceptance and validation contract (HYD-006)

Run baseline environment checks before implementation. Existing repo has no application test suite. New application must support reproducible `npm ci`, `npm run build` (typecheck first), `npm test`, and an actual browser smoke suite. Root convenience scripts are optional but documentation must name exact cwd/commands. Build before tests, as in Fabel.

Required evidence:

1. Water official verification values; every accepted glycol table node; units, concentration labels, bounds, no extrapolation, conflicting/missing-cell rejection and interpolation evidence.
2. Independent laminar Poiseuille check; turbulent Colebrook residual/reference; zero flow; exact regime boundaries; nonconvergence/error cases; roughness and ID units.
3. K and equivalent length arithmetic; applicable K=f*EL/D equivalence fixture; Cv psi/SG/head cancellation; direct psi and feet; every margin category and quantity rule, finite/nonnegative percentage validation and percent-versus-fraction fixture. Independent margin crossover: A=10 ft pipe+20 ft equipment, B=20 ft pipe+9 ft equipment; 25% pipe-only gives A=32.5 ft and B=34 ft, changing the governing circuit.
4. Separate legacy arithmetic fixture using declared legacy water properties: `Calc Ex (E.L.)!row13` 1800 GPM, 10.02-inch ID, 15 ft, roughness .00015 ft, rho 62.412954115716 lb/ft³, mu .00089912434435185 lb/(ft*s) => f .015489555351622424, legacy head .23174664595943364 ft (legacy g=32.2). Document any precise-unit/gravity difference. This proves arithmetic only, not authority of legacy properties. Named-source-mode deltas against Excel are documented, not forced away. Broken current sheet and transition example are not approved engineering goldens.
5. Known-flow network fixture: demands 10+20 GPM yield 30 GPM common supply/return, 10/20 in branches; shared loss appears once per circuit; parallel head is max not sum; asymmetric return, equipment-specific governing path, tie, margin-changing governing circuit and all-circuit completeness.
6. Invalid connectivity, duplicate/reused IDs/terminal/sections, reversed edges, cycles/meshes, unassigned active component, missing data, zero/negative/NaN/Infinity, partial numeric edits, unsupported pipe/fitting combinations, unknown schema version and corrupt save.
7. Browser: create/edit shared section and see both affected circuit totals update; invalid input visibly blocks acceptance; switch element type without stale inputs; accept acknowledged margin, change fluid/GPM/section and see stale status; JSON round trip; reject malformed JSON without data loss; print and CSV contain the same itemized total and labels. Qualify common equipment at 10+20=30 GPM, then change the second demand to 40 GPM: the new 50-GPM basis must invalidate its confirmation, retain old accepted result as stale, block new acceptance, and require explicit loss requalification. Include fluid/temperature and invalid pending text variants.
8. Fresh independent review of actual code/datasets and tests before completion. Parent checks final diff and validation artifacts. Data qualification and numerical bugs are blockers, not optional polish.

Do not claim field-certified pump selection or general hydraulic-network balancing. Report remaining library/domain restrictions, manual assumptions, source uncertainty and any unexecuted validation.

## Delivery sequence

1. Astra finalizes plan/tickets, applies independent plan-review corrections; Victor's bounded-plan approval is recorded.
2. Terra publishes seven Linear tickets under HEDMEP-134, assigned to Victor with Hydronic & controls label, checking duplicates and recording receipts immediately. HYD-007 is future integration only and stays Backlog.
3. Terra implements HYD-001 qualification artifacts/contract as sole writer and stops for explicit source acceptance. After parent/user source decisions, authorize HYD-002 and HYD-003, then independently review math/graph/tests before UI. Do not proceed past either checkpoint with unresolved material engineering/data decisions.
4. Parent synthesizes review and authorizes the same or one replacement sole writer to fix and implement HYD-004 through HYD-006.
5. Independent numerical/data and browser/workflow review, fix cycle, final build/test evidence. Update only these ticket statuses truthfully; do not mark unreviewed work Done or touch unrelated issues.
6. Report app launch instructions, issue URLs, exact validation, output paths and residual limitations. No Fabel implementation under HYD-007 now.
