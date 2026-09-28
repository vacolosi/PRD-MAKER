# Approved readability design build handoff

Date: 2026-09-16

## Implemented

Implemented the Victor-approved hydronic editor readability design in the standalone `hydronics/` app.

- Reworked the persistent summary into a value-first three-column layout, with state accents, exact existing result/acceptance/autosave messages, and the approved additive blocker route.
- Added `Section PD` to every physical-section card. It reads only `evaluateHydronicSystem`'s existing `result.sections[section.id]` record and `result.sectionFlowGpm`; it does not invoke or reproduce hydraulic calculations in React.
- Added Results `Section totals`, exactly one row per `system.sections` entry in project order. Rows expose the existing authoritative section flow/head/psi when `SectionLossResult.complete` is true; otherwise ft/psi are em dashes and status is `unavailable`. There is no grand-total row.
- Added a calm `Blocking diagnostics` panel that retains each engine-emitted diagnostic string and its order. Circuit-local diagnostics remain present in the trace.
- Added Results-side Inspect radios wired to the existing inspector state, retained the existing Circuits controls, and improved card/table/mobile presentation and print isolation.
- Removed the summary's accidental leading space without altering the status sentence.

## Changed files

- `hydronics/src/main.tsx`
- `hydronics/src/style.css`
- `hydronics/test/browser.mjs`
- `docs/hydronics/hydronics-terra-approved-readability-build-handoff.md`

## Test additions

`hydronics/test/browser.mjs` now asserts:

- six default section cards expose `Section PD`;
- Common supply, both terminal sections, and Common return remain fail-closed (`unavailable`) before confirmations;
- Branch 1 is `0.3742 ft / 0.1621 psi` and Branch 2 is `1.915 ft / 0.8294 psi` for the default data;
- Results renders six Section totals rows in physical-project order and has no grand-total text;
- a 20→40 GPM terminal-demand edit produces 50 GPM shared flow, stales the common applicability basis, and fail-closes the common Section PD.

Existing no-console-error/no-page-error/no-external-request checks remain in all browser suites.

## Validation run

From `hydronics/`:

```text
npm run build                                      passed
npm test                                           passed: 7 files / 203 tests
npm run qualify                                    passed
node test/persistence-browser.mjs                  passed
npm run test:final-browser                         passed
HYDRONICS_PORT=5178 node test/browser.mjs         passed
```

Residual risk: the approved circuit-card collapsing/grouped System layout was not structurally split into new React components; the existing semantics are retained and the visual hierarchy is chiefly CSS/card-header based. The Section totals table deliberately reports partial eligible rows while the governing headline remains fail-closed, as required. No engine/persistence/schema/print-authority behavior changed.

## Follow-up review completion

- Added Results circuit-header `Inspect` radios using the same selected inspector state as Circuits, with an independent radio group so hidden Circuits controls cannot override Results selection.
- Grouped System controls into System, Pump connection, and Nodes visual regions; the Nodes subgroup places Add node beside its heading and retains the node id/name/delete controls and deletion gate.
- Reworked Circuit cards into a header-and-three-lane presentation (Supply path, Terminal section, Return path), collapsing at narrow widths. Existing ordered-path controls and handlers are unchanged.
- Refined Section and loss action hierarchy so section and loss actions align with their card/header layout without changing labels, titles, disabled conditions, or handlers.
- Browser validation now selects circuit 2 from Results, verifies the selected-inspector marker, and confirms its Circuits-tab Inspect radio is selected. It also reads `main.tsx` as UTF-8 and requires an actual U+2014 em dash source character.

## Final parent visual-correction pass

- Corrected the desktop System grid selector specificity so the System group occupies the intended broad left area while Pump connection and Nodes fill the right area; the existing 780px single-column collapse remains in force.
- Moved the existing Duplicate section and Delete section controls into the Section header in a wrapping `.section-actions` group. Add non-pipe loss remains in the card body.
- Moved Confirm current basis, its unchanged disabled reason, Delete loss, and Move loss up into `.loss-header` beside the loss id.
- Moved Duplicate circuit and Delete circuit into a compact wrapping `.circuit-actions` group in the Circuit header.
- Confirmed modified sources decode as UTF-8 and contain neither `â` nor `Â`; browser coverage continues to require U+2014 source text for fail-closed table cells.
