# HYD-004 — standalone editor and Show the math

## Authorization and ownership

Implement the approved **HYD-004 / HEDMEP-201** milestone in `C:/Users/Victor Colosi/dev/PRD maker`. Terra (`azure-openai-responses/gpt-5.6-terra`) is the sole application/test writer. Sol (`azure-openai-responses/gpt-5.6-sol`) reviews the new application work; Astra orchestrates and independently accepts.

Foundation and engine are ACCEPTED. Read `engine-acceptance.md`, the UI/persistence/validation sections of `implementation-plan.md`, and the public engine barrel/types. Historical engine NO-GO reports are resolved by the acceptance disposition; do not reopen engine physics/source research or the old review loop. No unresolved user/source decision blocks this milestone.

Deliver a working local desktop-engineer interface, not a new plan. The next HYD-005 milestone adds durable acceptance/save/open/autosave/exports; keep seams for it, but **do not implement that separate milestone now**. Do not claim accepted/saved/design-use-ready status before it exists. A visible notice must say this milestone is an unsaved browser session and reloading discards edits.

## Boundaries

- Work within `hydronics/`, plus this milestone's configured delivery report and narrowly authorized Linear receipt update. Preserve all 11 engine source modules, existing five regression test files, source data/qualification fixtures and root tooling/config/dependencies. App tests are additive.
- Engine source/types should need no changes. If a genuine API blocker appears, report the concrete seam rather than silently modifying accepted math/contracts.
- Vite/React/TypeScript with strict checking; add dependencies and scripts only to `hydronics/package.json`/lockfile. Keep noUncheckedIndexedAccess and exactOptionalPropertyTypes. Minimal dependencies; no backend, account, cloud service, drawing canvas or Fabel imports.
- Bind local development to loopback port **5175**, strictPort; do not use Fabel ports5173/8090 or expose a LAN server. Build must typecheck before bundling.
- No Fabel/workbook edits, raw source-PDF/image copying, client metadata, root edits, staging, commits, pushes, deployments, GitHub issues/PRs or child agents.
- A compact report, not rewritten planning documents: `.pi/research/hydronics-terra-ui-handoff.md`.

## Interface and state contract

Use practical readable CSS, desktop tables/cards and accessible native controls with visible units, labels and error associations. No elaborate visual design exercise. Avoid one monolithic file when small components and pure state helpers suffice; no framework/state-management expansion is requested.

Keep normalized portable project/system data separate from UI selection and raw numeric editor text. Stable IDs survive edits/reordering. Adding/duplicating creates fresh IDs. Names are editable; IDs can be generated/read-only. Referenced entity deletion must be explicit and safe: refuse with an explanation or leave clearly diagnosed references, never silently reroute/reduce the active system. A simple selected-system interface may be used; preserve the portable project shape rather than inventing an incompatible persistence contract.

### System and topology editors

- Project/system names, named nodes, distinct discharge/suction selectors.
- Fluid selector with all seven exact supported IDs and named dated source labels: IAPWS water; DOWFROST September2001 PG30/40/50vol%; DOWTHERM SR-1 February2008 EG30/40/50vol%. Say volume-percent glycol, not concentrate percentage. Mean temperature in F; water32–200, glycol30–200; no clamping/fallback. Explain single-phase-liquid assumption and closed-loop scope.
- Section add/duplicate/delete, name/description/role/from/to nodes, physical length, catalog selection or custom actual ID and roughness. Resolve catalog values through the engine and display actual ID/effective roughness with the roughness-default assumption. Do not let an unavailable selection fall back to another pipe.
- Circuit add/duplicate/delete, name, active/draft state, terminal design GPM, ordered supply/return references and one terminal reference. Prefer selectors for existing sections; allow reorder/add/remove without copying physical sections. Show located connectivity errors. Unused inventory is visibly unassigned/draft, not included in active calculations.
- Root flow and each shared section's flow come from `evaluateHydronicSystem`; no editable section GPM or UI flow solver. Display role/demand changes immediately.

### Non-pipe loss editor and applicability

Support all six public loss types, both DOE presets, and exactly their allowed categories. Show quantity, relevant coefficient/preset and units/basis only. Switching type replaces irrelevant fields, cannot continue using an old coefficient, and cannot carry confirmed service permission into a different basis. Physical pipe is automatic once; no editable pipe-loss row.

Manual coefficient/loss data must be consciously entered; don't invent engineering defaults that look qualified. Zero is valid where the engine allows it, but not a missing value or invalid Cv. Expose stated applicability envelope and optional provenance. Label DOE estimates as generic turbulent-service Darcy approximations (connection/manufacturer unspecified), including glycol limitations. Direct psi/head are actual-fluid/design-flow values; no automatic one-point scaling. Cv lacks universal viscous/choked-service qualification.

For each row show unconfirmed/current/stale applicability and its current operating basis: derived active section flow, fluid/temperature, actual ID/roughness, selected primitives/quantity and active data version. Explicit engineer action captures `currentApplicabilityBasis`; use public engine checks, not duplicated basis comparison or a persistent Boolean. Do not allow confirmation when input is invalid, topology prevents derived flow, or geometry/properties are invalid. Unused sections have no qualifying active flow. Changing common30GPM to50GPM must stale affected saved confirmations; no auto-reconfirmation. Synthetic starting losses remain unconfirmed until explicit action.

### Numeric editing and readiness

- Preserve raw text while typing; do not use blank/null/partial numeric strings as zero or parse a numeric prefix from junk. Handle invalid text locally without UI crashes. Reject nonfinite numeric parses and nonzero decimal/scientific input that underflows to zero.
- Keep invalid state above transient editor components so selection changes cannot hide an unresolved invalid edit. If retaining a last-valid normalized object, visibly label its displayed details as last-valid/provisional and withhold current-ready/governing summary until invalid edits are corrected or explicitly discarded.
- Future acceptance must be able to depend on a single truthful editor-validity gate. No fake Accept/Save controls in this milestone.
- Domain errors (negative length, invalid active GPM, transition flow, stale losses, temperature bounds, etc.) use engine diagnostics and cannot become ordinary final results.

### Results, margin and Show the math

- No preset margin. Zero starts unacknowledged; require explicit acknowledgment even for0. Edit percentage units and included pipe/fitting/valve/equipment categories; use engine margin results without reapplying it. Explain an empty category set contributes no margin.
- Show all active circuits with category/raw/margin/factored head and loss-equivalent psi; show incomplete reasons, raw/factored governing circuits and deterministic ties. Selected inspector circuit never replaces the all-active system maximum. Draft-only/no-active systems have no final result.
- State labels distinguish incomplete, calculation-ready-to-review and provisional/invalid input. Design acceptance/stale accepted-snapshot features arrive in HYD-005.
- Selected circuit inspector follows ordered section/item results. Display derived flow, resolved geometry, velocity, Re/regime/fD, density kg/m3, dynamic viscosity Pa*s, ft actual fluid/100ft; per-item quantity/K/EL/Cv or direct value, head/psi, category and cumulative head where known/representable. Engine result totals are authoritative; simple presentation sums must reconcile, not recalculate physics.
- Preserve precision until formatting; show unavailable values as unavailable with reasons, never NaN/Infinity/false zero. Very small nonzero results need a nonzero/scientific display rather than claiming exact0. Provisional known details must not appear accepted.
- Explain actual-fluid head and loss-equivalent differential psi, not absolute pressure or unconditional pump-flange gauge differential. No static building-height addition, automatic sizing, compliance claims or pump selection certification.
- Display reference/manual provenance safely as text. React escaping; no arbitrary imported/user HTML, external telemetry or remote assets.

## Synthetic starter

Provide a plainly synthetic two-terminal example with10+20GPM, shared supply AND return, different branch/terminal losses and explicit equipment. Include a shared non-pipe loss so shared-flow applicability can be exercised. No legacy workbook metadata. Start margin unacknowledged and loss confirmations unconfirmed; give clear instructions for reviewing/confirming them. A user must be able to reach calculation-ready status through real controls.

## Verification required for this milestone

Add meaningful state/parser/component tests and retained **real-browser** tests. Playwright as a hydronics-local dev dependency is authorized. Installed Chrome exists at `C:/Program Files/Google/Chrome/Application/chrome.exe`; a Playwright `chrome` channel with isolated temporary profile may avoid a download. Never use the user's personal browser profile. Document reproducible browser setup, scripts and any environment override. Keep Playwright tests separate from Vitest discovery and strict-check relevant app code/configs.

Required observations:
1. Build bundles the app; local5175 opens without browser errors/external runtime requests.
2. Reach ready-to-review through real margin and per-row applicability controls. Root/common flow30, branches10/20; both circuit summaries and itemized totals reconcile with the accepted engine.
3. Edit a shared physical length and observe both affected circuit results update. Selecting a non-governing circuit does not change the system headline.
4. Qualify common loss at30, change second terminal20→40; common flow50, affected confirmation stale and final readiness blocked; explicit current-basis requalification is needed.
5. Invalid numeric text (blank, partial exponent, junk) is preserved/diagnosed and blocks readiness, including after changing selection. Unit tests also cover Infinity, prefix coercion and positive-underflow text; genuine0 controls remain valid where allowed.
6. Switch loss type, verify irrelevant controls/data no longer contribute. Exercise category restrictions, quantity0 versus missing coefficient, custom/catalog actual ID, transition/incomplete outputs and an invalid topology with a located explanation.
7. Existing180 tests still pass, engine source and existing tests unchanged, qualification still passes. Do not replace retained regressions with mocks or weaker assertions.

Run **build before tests**, then qualification and browser checks. Report exact commands/results and screenshot/log paths (screenshots in OS temp, not source assets). Leave a loopback preview running only if you can record owned PID/URL/logs and how to stop it; otherwise give exact launch command, never claim an untested URL is live.

## Narrow Linear authorization

This is a new application milestone, no longer the credential-forbidden engine-test slice. Using the already approved authenticated Linear mechanism, Terra may update only existing HEDMEP-199/200 to Done with `engine-acceptance.md` evidence, HEDMEP-201 to In Progress while implementing and In Review at delivery, and `docs/hydronics/linear-receipts.json` with verified read-back. Preserve IDs, markers, dependencies, parent/project/assignee/labels. No duplicate tickets; do not mark201 Done before review. Keep202/203/204 Backlog. Do not expose credentials in output or app assets. If authorized authentication is not readily available, report the pending administrative update and continue implementation; do not conduct broad credential discovery.

## Handoff / next gate

Report changed files, implemented/deferred scope, exact build/unit/qualification/browser evidence, actual preview status, source/test preservation, receipt changes and concrete residual risks. Stop for parent/Sol inspection of this UI milestone. HYD-005 follows after this bounded review; do not expand into Fabel, another engine audit or optional polish.
