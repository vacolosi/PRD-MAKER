# Hydronic pressure-drop editor readability design

Status: approved design direction, 2026-09-16  
Canvas: `docs/hydronics/design/hydronic-editor-readability-design.html`  
Working artboards: `docs/hydronics/design/*.dc.html` and `docs/hydronics/design/canvas.json`

## Design contract

### Purpose

Make the hydronic pressure-drop editor clearly readable and make calculated pressure drop discoverable without changing hydraulic authority, project semantics, acceptance semantics, or fail-closed behavior.

The approved direction is a roomy, tabbed engineering worksheet. A user can:

1. see the governing result and state at the top of every tab;
2. edit a physical section and see that section's own pressure drop on the same card;
3. open Results and scan a complete map of physical-section totals;
4. inspect a circuit's detailed calculation trace without mistaking parallel sections for additive system head.

### Tokens

Use resolved values; do not introduce runtime theming, webfonts, icon packages, or network requests.

- Font: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Base font size: `16px`
- Base line height: `1.55`
- Page background: `#eef2f5`
- Primary text: `#17212b`
- Heading text: `#142c3b`
- Dark teal text: `#102d3d`
- Secondary text: `#3c4f5c`
- Label text: `#526672`
- Card surface: `#ffffff`
- Card border: `#d5dee6`
- Card radius: `12px`
- Card padding: `20px`; page header padding `24px`
- Page maximum width: `1180px`
- Page padding: `28px 24px 64px`
- Primary accent: `#246b87`
- Focus outline: `3px solid #0082b4` for tab buttons; `3px solid #80c7df` for inputs/selects
- Input/select border: `#8da1af`
- Input/select radius: `6px`
- Input/select minimum height: `42px`
- Button background: `#e5f1f6`
- Button hover: `#d1e8f1`
- Button border: `#6c8796`
- Button text: `#163d4f`
- Tab rail: `#dce7ed`, radius `10px`, padding `5px`, gap `4px`
- Selected tab border: `#b8cbd5`, radius `7px`
- Neutral chip: background `#dfeaf0`, text `#23495a`, pill radius `999px`
- Quiet inset: background `#f5f8fa`, border `#dce6eb`, radius `8px`
- Loss card: background `#f8fbfc`, border `#c8d8e0`, left accent `5px solid #6b9db2`, radius `8px`
- Details card: background `#f6f9fa`, border `#dbe6eb`, radius `7px`
- Ready/available: text `#176a35`; chip background `#e2f2e7`, border `#9ecfae`
- Blocked/invalid: text `#9b1c1c`; quiet panel background `#fff7f7`, accent `#b95a5a`
- Warning/stale/unconfirmed: background `#fff6d9`, accent `#bc8200`, chip border `#d9b96a`, text `#64491b`
- Summary shadow: `0 5px 18px rgba(20, 44, 59, .07)`
- Numeric results: `font-variant-numeric: tabular-nums`
- Uppercase form labels: `12.5px`, weight `800`, letter spacing `.055em`

### Overall structure

`main` contains, in order:

1. compact product header;
2. persistent summary bar;
3. accessible tab bar;
4. exactly one visible editor tab panel;
5. print report retained in the DOM regardless of active tab.

Tabs remain:

- `System`
- `Sections`
- `Circuits`
- `Results`
- `Files & report`

Retain `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`, Arrow Left/Right, Home, and End behavior. Changing tabs changes UI state only. It does not mutate the project or acceptance state.

The summary bar remains above the tab rail and visible on every tab. The print report remains independent of the selected tab.

### Persistent summary bar

Use a three-column desktop grid:

1. governing value and root flow;
2. calculation eligibility/status and blocker route;
3. acceptance and autosave.

The visual order in column one is:

- small uppercase caption `System headline:`;
- largest text in the bar: `<head ft> ft / <loss-equivalent psi> psi.` or `unavailable ft / unavailable psi.`;
- `Root flow:` and its value.

Do not use `b:last-of-type` to enlarge a caption. Style a dedicated value element.

States:

- Blocked: top accent `#246b87`; governing value muted; existing incomplete diagnostic remains red; show additive control `View <N> blockers in Results` that selects the Results tab and focuses the Blocking diagnostics panel.
- Calculation ready, not accepted: top accent `#246b87`; full-strength governing value; existing `Calculation-ready-to-review (not accepted or saved).` remains green.
- Locally accepted/current: top accent `#176a35`; acceptance value is a green chip using exact existing text `Locally accepted / current`.
- Locally accepted/stale: top accent `#bc8200`; acceptance value is an amber chip using exact existing stale text.
- Invalid raw input: top accent `#9b1c1c`; render exact existing provisional and retained-result warnings; do not render a governing claim.
- Imported historical snapshot: use the existing text `Imported historical snapshot — not locally trusted`; do not style it as locally accepted/current.

Remove the accidental leading space produced by `main.tsx:85` without changing the status sentence itself.

### System tab

#### System and nodes card

Split the card into three visual groups while preserving the existing data model and controls.

1. System fields:
   - Project name
   - System name
   - Fluid (volume-percent glycol)
   - Mean temperature °F
2. Pump connection:
   - Pump discharge
   - Pump suction
3. Nodes:
   - Add node aligned with the Nodes subheading
   - two-column desktop list of node rows
   - each row contains editable node name, neutral id chip, and Delete node

The node id is secondary metadata. Do not use an uppercased raw id as the primary field caption.

Expected-width fields should communicate their content. Mean temperature uses a narrow numeric column; project/system/fluid fields remain wide.

Retain the existing fluid-range sentence verbatim in a quiet inset below the system fields.

#### Margin card

- Margin percent is a narrow numeric field.
- Category checkboxes appear as one aligned group: pipe, fitting, valve, equipment.
- The acknowledgment is a separate amber gate row, not another equal-weight category checkbox.
- Keep the existing acknowledgment label verbatim: `I explicitly acknowledge this margin (including zero)`.
- When unacknowledged, the row may display the engine's existing diagnostic verbatim: `margin: Margin acknowledgement is required, including explicit zero.`
- Preserve the sentence `An empty category set contributes no margin.`

### Sections tab

#### Section list

Each physical section is a card. The expanded card header contains:

- section name;
- neutral role/derived-flow chip, e.g. `supply; 30 GPM derived`;
- additive `Section PD` readout;
- Duplicate section and Delete section actions aligned right.

Inactive cards may collapse to one summary row containing the same name, role/flow chip, Section PD readout, and an expansion affordance. Collapsing is UI state only and must not change the project.

#### Section PD readout

This is an approved additive surface.

- Source values exclusively from the public engine result already used by Results; do not recalculate hydraulics in React/UI code.
- Evaluate/display the physical section at its derived shared flow.
- Available: show `<head ft> ft / <loss-equivalent psi> psi` with tabular numerals.
- Blocked by applicability, invalid raw input, topology, or another engine diagnostic: show `unavailable`; never show retained, partial, zero, NaN, or fabricated values as current section PD.
- A shared physical section appears once and has one readout at the summed member-circuit flow.
- Editing an input updates or invalidates the readout through normal engine evaluation. It must not create a second calculation path.
- The readout is informational and cannot be accepted independently of the complete result.

#### Expanded section structure

Group controls by meaning:

1. Identity: Section name, Description, Role.
2. Topology: From node → To node, followed by the narrow length field.
3. Geometry: Pipe geometry, catalog roughness override, Use catalog default roughness.
4. Derived geometry: existing actual-ID/effective-roughness sentence in a quiet inset.
5. Loss cards.

#### Loss card

- Header: loss id, applicability-state chip, Confirm current basis, Delete loss, move actions.
- Confirm current basis is visually primary because it resolves a result gate.
- Main fields: Loss type, Category, Quantity, and the type-specific value.
- Applicability envelope and Manual provenance occupy the next row.
- The full current/captured basis sentence remains verbatim and gets its own readable inset block at no less than `14px`/`1.5`.
- Preserve existing confirmation/staleness behavior and exact diagnostic strings.

### Circuits tab

Each expanded circuit card contains:

1. header row: Inspect radio, Circuit name, State, narrow Terminal design GPM, Duplicate circuit, Delete circuit;
2. three left-to-right path lanes: Supply path add → Terminal section → Return path add;
3. ordered path summary.

Each path lane preserves Choose/Add/Remove/Up/Down behavior. Path entries are compact ordered rows. Disabled move controls remain disabled and visually muted.

A non-inspected circuit may collapse to its header summary. Selection and expansion are UI state only. Do not discard its path controls or data.

### Results tab

Order:

1. Results / Show the math heading and current status/headline;
2. additive Section totals rollup;
3. Blocking diagnostics when present;
4. per-circuit result articles and detailed calculation trace;
5. existing DOE/direct-psi/Cv qualification sentence.

#### Section totals rollup

This is the approved map of all physical sections.

Columns:

- Section
- Role
- Flow
- Total head ft
- Loss-equivalent psi
- Status

Behavior:

- Render exactly one row per physical section, not one row per circuit membership.
- Flow is the engine-derived flow for that physical section; shared sections therefore show summed member-circuit flow.
- Available rows show engine-authoritative section total head and loss-equivalent psi with tabular numerals.
- Blocked rows show em dashes for both numeric columns and an amber `unavailable` status. Do not expose provisional partial values as authoritative totals.
- Section order follows project section order unless a later approved sorting control is added.
- Selecting a section row may focus/expand that section's detailed occurrence in the selected circuit, but this is optional; do not block this redesign on row navigation.
- Do not add a grand-total row. Parallel physical sections are alternative paths, not additive system head.
- Include a concise explanation: the system headline is the highest complete circuit path, with shared sections counted once on that path.
- If any row is unavailable, the table may be partially populated, but the system headline remains unavailable whenever the existing engine eligibility rules require it.

#### Blocking diagnostics

- Show one calm, bounded panel headed `Blocking diagnostics` with a count chip.
- Keep every existing diagnostic string byte-identical.
- Do not deduplicate or alter diagnostic data in this presentation-only stage unless a separately approved engine contract says duplicates are equivalent.
- Per-circuit diagnostic copies may remain in their circuit article at quieter footnote weight.
- Red is reserved for actual blockers/invalid states, not ordinary data or neutral metadata.

#### Circuit results

- Circuit header contains circuit id/name, selected-inspector marker, and an additive Inspect radio bound to the same inspector state as the Circuits-tab radio.
- Summary line retains existing category subtotals and availability strings.
- Section details remain disclosure widgets.
- Section summary uses tabular numerals and retains flow, inside diameter, roughness, and flow regime.
- Detailed lines use a hanging-indent/left-rail treatment; keep calculation strings verbatim.
- The selected-inspector cumulative line remains present.

### Files & report tab

Preserve all current controls and behavior:

- Save JSON
- Open JSON
- Accept reviewed result
- Print report
- Download itemized CSV
- Reset to synthetic example / discard local draft

Retain imported-history trust rules, local acceptance rules, hostile-import validation, CSV formula neutralization, and the existing autosave/status sentences.

The screen may group actions by intent (project file, review, report, reset), but must not weaken confirmation, disablement, or validation.

### Responsive behavior

At `780px` and below:

- page padding becomes `16px 12px 40px`;
- cards use `8px` radius and `16px` padding;
- summary bar stacks vertically;
- tab bar remains horizontally scrollable and sticky at `top: 0`;
- System, Section, Loss, and circuit lane grids collapse to one column;
- section header actions wrap without covering the Section PD readout;
- section totals remain readable by using a horizontally scrollable table container or a deliberate stacked-row representation; do not shrink body text below `14px`;
- no field, diagnostic, button, or numeric result may be clipped at a 320px viewport.

### Print behavior

- Keep `.print-report` mounted regardless of active tab.
- Printing hides the editor header, summary bar, tab bar, tab panels, buttons, inputs, selects, and review-files controls.
- Printing shows only the existing print report.
- The new interactive Section PD readouts and Section totals table must not accidentally replace, duplicate, or suppress the authoritative print report.
- Preserve the existing print content and strings unless print-output expansion is separately approved.

### Components and states

#### Section PD

- Engine section total available → show ft and loss-equivalent psi.
- Applicability confirmation missing/stale → show `unavailable`.
- Raw numeric draft invalid → show `unavailable`; retained normalized result is not current.
- Section topology invalid or section flow unavailable → show `unavailable`.
- Section shared by multiple active circuits → show one row/readout at summed derived flow.
- Relevant edit → recompute or stale through the existing engine/applicability path.

#### Section totals table

- All sections available → every row numeric/available.
- Mixed availability → numeric values only for eligible rows; blocked rows show dashes/unavailable.
- No sections → empty state may use `No physical sections.` as an additive string.
- Invalid imported/raw data → no authoritative numeric claim.
- Long names → wrap in the first column; numeric columns remain aligned.

#### Margin acknowledgment

- Unchecked → amber gate row; existing blocker remains active.
- Checked at zero → valid acknowledgment; zero remains explicit.
- Margin percent/categories changed → normal existing staleness/eligibility behavior applies.

#### Applicability confirmation

- Unconfirmed → amber state chip; Section PD unavailable where required.
- Confirmed/current → neutral or green state treatment; Section PD may become available.
- Relevant basis changed → confirmation becomes stale through the existing basis comparison; no UI override.

#### Diagnostics

- None → Blocking diagnostics panel absent.
- One or more → panel present with exact count and exact messages.
- Repeated messages from different circuit contexts → preserve each emitted diagnostic.

#### Inspect circuit

- Radio selected on Circuits → same circuit selected on Results.
- Radio selected on Results → same circuit selected on Circuits.
- Selection changes only inspector presentation, not the hydraulic project.

### Defects this fixes

- `hydronics/src/style.css:37` enlarges `b:last-of-type`, which is the `System headline:` caption in `hydronics/src/main.tsx:87`, not the governing value. Consequence: the result is subordinate to its label.
- `hydronics/src/main.tsx:87` names four blocker classes but provides no route to the detailed list in `hydronics/src/main.tsx:94`. Consequence: users must hunt across tabs.
- `hydronics/src/main.tsx:90` with `hydronics/src/style.css:56-61` flattens system fields, pump selectors, node ids, node names, actions, and margin checkboxes into the same four-column rhythm. Consequence: hierarchy and expected field width are unclear.
- `hydronics/src/main.tsx:91` renders the required margin acknowledgment at the same weight as category membership. Consequence: a result gate looks optional.
- `hydronics/src/style.css:63-79` gives text and numeric fields equal fractional widths and places applicability basis at footnote scale. Consequence: the most consequential review text is the least scannable.
- `hydronics/src/main.tsx:92` edits section inputs but has no directly visible authoritative section PD. Consequence: users leave the edited object to find its output.
- `hydronics/src/main.tsx:94` nests section totals in circuit details and has no one-row-per-physical-section rollup. Consequence: shared section results are hard to locate and compare.
- `hydronics/src/main.tsx:94` renders per-circuit diagnostics and a repeated system list. Consequence: red volume overstates the number of distinct user actions.
- `hydronics/src/main.tsx:93-94` locates Inspect selection on Circuits while its main consequence appears on Results. Consequence: reviewing another circuit requires a tab round trip.
- `hydronics/src/main.tsx:85` prefixes non-invalid status with a literal space. Consequence: needless text artifact.

### Explicitly unchanged

- The engine remains the only authority for section losses, circuit totals, governing head, governing pressure-loss equivalent, flow derivation, and eligibility.
- No hydraulic formulas, constants, datasets, units, rounding rules, topology rules, applicability rules, margin semantics, or circuit-governing rules change.
- Shared physical-section flow continues to derive from active terminal membership; section GPM does not become editable.
- Closed-loop scope remains: no static lift, pump sizing/curves, balancing, NPSH, compliance, certification, or open-loop claims.
- Head remains actual-fluid head. Psi remains loss-equivalent differential, not absolute pressure.
- Water remains IAPWS 32–200°F. Glycol remains the qualified dated DOWFROST/DOWTHERM SR-1 30/40/50 volume-percent datasets at 30–200°F. No extrapolation or fallback.
- Applicability remains condition-bound and fail-closed. Relevant edits stale confirmations.
- Margin remains raw selected-category sum plus percentage, with explicit acknowledgment required even at zero.
- Acceptance remains local and explicit. Imported history never becomes trusted local acceptance.
- Invalid raw input, import, localStorage, and download handling remain untrusted until validated.
- Exactly one system per project file remains the contract.
- CSV formula-prefix neutralization remains intact without converting numeric cells.
- Existing user-visible strings, diagnostic strings, aria-labels, file schemas, storage keys, and browser-test assertions remain byte-identical unless this contract explicitly marks a string as additive.
- Existing print report stays in the DOM and remains the print authority.
- No new runtime dependencies, webfonts, icon packages, analytics, network requests, or cloud behavior.
- No Fabel integration in this stage.

### Approved additive UI strings

These strings are new presentation labels and do not replace existing strings:

- `View <N> blockers in Results`
- `Blocking diagnostics`
- `Section PD`
- `Section totals`
- `Each physical section is evaluated once at its derived shared flow.`
- `<N> physical sections`
- `Total head ft`
- `Loss-equivalent psi`
- `Status`
- `available`
- `unavailable`
- `Unavailable rows remain fail-closed until their applicability basis is confirmed on the Sections tab.`
- `Section totals are not added together for the system headline. The governing head is the highest complete circuit path, with shared sections counted once per path.`
- `No physical sections.` when applicable
- Collapsed-card helper text and circuit-path helper text shown in the approved canvas

If implementation can reuse an existing exact string instead of adding synonymous copy, prefer the existing string.

### Acceptance

#### Summary and navigation

- The governing head value, not its caption, is the largest text in the summary bar.
- A blocked result shows no numeric governing claim.
- `View <N> blockers in Results` selects Results and focuses the Blocking diagnostics panel.
- Tab keyboard behavior and ARIA relationships remain correct.
- The summary remains visible on every editor tab.

#### Section PD

- Each Section card shows `Section PD` in its header.
- For the default synthetic project before applicability confirmations, Common supply, Terminal 1 equipment, Terminal 2 equipment, and Common return display `unavailable` rather than partial numeric totals.
- For the default synthetic project, Branch 1 displays engine-authoritative `0.3742 ft / 0.1621 psi` at `10 GPM`.
- For the default synthetic project, Branch 2 displays engine-authoritative `1.9150 ft / 0.8294 psi` at `20 GPM`.
- After confirming all applicable bases and acknowledging margin, section readouts match the public engine result for the same section and flow.
- Changing a shared-flow circuit from 20 GPM to 40 GPM updates the shared section's derived flow to 50 GPM and updates/stales its Section PD through the normal engine path.
- Invalid raw draft text makes affected/current Section PD unavailable; no last-valid number is presented as current.

#### Section totals map

- Results contains one Section totals row for each physical section and no duplicates for shared circuit membership.
- The default project displays exactly six rows in project section order.
- Flow, ft, and psi columns use tabular numerals and align consistently.
- Available values exactly match the corresponding Section-card readout and public engine section total.
- Unavailable rows use dashes for ft/psi and an `unavailable` status.
- There is no grand-total row summing parallel physical sections.
- The explanatory text states that the governing value is the highest complete circuit path with shared sections counted once per path.

#### Diagnostics and gates

- Every existing diagnostic sentence remains byte-identical.
- Red styling appears only for actual blockers/invalid states.
- Margin acknowledgment remains required, including explicit zero.
- Applicability cannot be bypassed through the new readouts or table.
- A relevant fluid, temperature, geometry, flow, loss, or topology edit preserves existing staleness behavior.

#### Responsive, print, and non-regression

- At 1440px, card headers, actions, numeric readouts, and table columns do not overlap.
- At 780px and 320px, all controls and results remain reachable without clipping; the section table is scrollable or deliberately stacked.
- Print output remains the existing print report regardless of selected tab.
- Build, all 203 unit tests, qualification, persistence-browser, final-browser, and redesigned browser suite pass without weakened assertions.
- Browser suites still fail on page errors, console errors, or non-loopback runtime requests.
- No new runtime dependency or external request is introduced.

### Open implementation choices

These are implementation details, not product decisions:

- The Section totals row may optionally navigate to/focus the corresponding section detail; omission does not fail acceptance.
- Components may remain in `src/main.tsx` or be split into `src/app/ui/` modules. The public engine barrel remains the only calculation source.
- Desktop table may become stacked cards below 780px if semantics and values remain equivalent.

### Approved visual reference

The approved canvas is `docs/hydronics/design/hydronic-editor-readability-design.html`. It contains Current, Proposed System, Proposed Sections, Proposed Circuits, Proposed Results, Summary States, and Section totals artboards. The contract governs whenever an artboard and executable behavior could be interpreted differently.
