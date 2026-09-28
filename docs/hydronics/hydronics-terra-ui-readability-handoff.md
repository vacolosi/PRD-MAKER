# Terra HYD-004 readability redesign handoff

## Scope and guardrails

This is a presentation-only redesign of the standalone hydronic calculator. No engine calculation, validation, persistence, reporting, editor helper, reference-data, CSV, print-report *content*, Fabel, workbook, root-tooling, credential, deployment, Linear, staging, or commit work was changed.

## Changed files

- `hydronics/src/main.tsx` — adds the accessible top-level visual information architecture while retaining the existing state/effects/handlers and every existing control and result sentence.
- `hydronics/src/style.css` — replaces the dense presentation with roomy system-font cards, grid-like field treatment, numeric alignment, calm diagnostic hierarchy, tab styling, responsive behavior, and retained print behavior.
- `hydronics/test/browser.mjs` — makes its owned port configurable through `HYDRONICS_PORT` (default `5175`), adds required tab navigation, and verifies default tab plus ArrowLeft/ArrowRight/Home/End selection.
- `hydronics/test/persistence-browser.mjs` — adds only required tab navigation before its existing interactions.
- `hydronics/test/final-browser.mjs` — adds only required tab navigation before its existing interactions.
- `docs/hydronics/hydronics-terra-ui-readability-handoff.md` — this handoff.

## Information architecture and interaction decisions

- The default visible panel is **System**. The persistent summary bar stays above the tab bar and carries the existing governing headline/current-unavailable wording, root flow, acceptance status, and autosave status.
- Five `role=tab` controls inside a `role=tablist` operate five labelled `role=tabpanel` containers: **System**, **Sections**, **Circuits**, **Results**, and **Files & report**. Every tab has `aria-selected`, `aria-controls`, correct roving `tabIndex`, and ArrowLeft/ArrowRight/Home/End support.
- The system tab contains the pre-existing System and nodes plus Margin forms. Sections retains the complete physical-section editor, Circuits retains the complete circuit editor, Results retains all math/diagnostic output, and Files & report retains the pre-existing file/review actions.
- The print report remains in the DOM outside the screen panels. It is screen-hidden to avoid duplicating a long report in every tab, but print CSS forces it visible even when another panel is active; tabs, summary, and editing/review controls remain hidden in print.
- Typography uses only a system stack at 16px / 1.55. Cards use 20px padding, labels are muted 13px uppercase/letter-spaced labels, figures use tabular numbers, inputs have 42px minimum targets, and the content width is 1180px.
- Losses remain complete, but are visually separated cards with the exact `current`, `stale`, or `unconfirmed` text styled as a small chip. The existing basis sentence remains intact in a quieter inset.
- The Results tab preserves every result, section, and item sentence. Circuit cards, section `details`, item indentation, and indented blockers replace the former dense wall; red is reserved for actual blockers.

## Browser-test navigation added

No assertion was deleted or weakened.

- `browser.mjs`: selects System before the margin acknowledgement; Sections before confirmation, geometry, loss, and section work; Circuits before flow/path/radio work; Results before result assertions. It now uses `HYDRONICS_PORT=5178` for isolated validation instead of binding the parent-owned 5175. It additionally checks default System, End -> Files & report, Home -> System, and ArrowRight -> Sections tab behavior.
- `persistence-browser.mjs`: uses System -> Sections -> Results for review readiness; Files & report for save/open/accept/download/print; Circuits for inspector and terminal-flow edits; and System for project-title edits.
- `final-browser.mjs`: uses System for margin/fluid work; Sections for confirmation and stale-state inspection; Circuits for terminal-flow edits; Results for eligibility/current-headline assertions; and Files & report for acceptance/history checks.
- Summary and Results intentionally repeat the existing eligibility/current-unavailable strings, so the pre-existing broad text locators were scoped with `.first()` only where two equally valid visible instances now exist. All assertions retain their prior intended string and condition.

## Exact-string and protected-path evidence

The redesign does not change engine or application-logic files. Final protected-path name check emitted no paths:

```text
git diff --name-only -- src/engine src/app/persistence.ts src/app/reporting.ts src/app/editor.ts
# no output
```

The following exact existing strings were grepped successfully from `src/main.tsx` after the redesign:

```text
Local-only browser application: autosave stays in this browser profile and downloads remain on this device. No telemetry, account, cloud sync, or external runtime requests.
Closed-loop single-phase liquid scope. Head is actual-fluid head and psi is loss-equivalent differential, not absolute pressure, static lift, or pump certification.
Current headline unavailable.
I explicitly acknowledge this margin (including zero)
Print calculation report
```

Existing dynamic aria-label template expressions were left in place, including terminal design GPM, loss type, envelope, provenance, and circuit supply/return add controls. The only new visual labels are the user-required tab captions.

## Full validation output

Commands were run from `C:/Users/Victor Colosi/dev/PRD maker/hydronics` after the final source edit:

```text

> hydronic-pressure-drop-foundation@0.1.0 build
> npm run typecheck && vite build


> hydronic-pressure-drop-foundation@0.1.0 typecheck
> tsc --noEmit

[36mvite v6.4.3 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 42 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                 [39m[1m[2m  0.41 kB[22m[1m[22m[2m │ gzip:  0.29 kB[22m
[2mdist/[22m[35massets/index-IJz9BFR3.css  [39m[1m[2m  6.80 kB[22m[1m[22m[2m │ gzip:  2.12 kB[22m
[2mdist/[22m[36massets/index-BSiff6Rx.js   [39m[1m[2m309.57 kB[22m[1m[22m[2m │ gzip: 94.00 kB[22m
[32m✓ built in 886ms[39m

> hydronic-pressure-drop-foundation@0.1.0 test
> vitest run


 RUN  v4.1.11 C:/Users/Victor Colosi/dev/PRD maker/hydronics


 Test Files  7 passed (7)
      Tests  203 passed (203)
   Start at  10:00:10
   Duration  495ms (transform 835ms, setup 0ms, import 1.31s, tests 165ms, environment 1ms)


> hydronic-pressure-drop-foundation@0.1.0 qualify
> node scripts/qualify-reference-data.mjs

dowfrost-pg-30vol-2001-09: {"density":{"maxAbsPercent":0.015738117721120215,"rmsPercent":0.008805872343521095},"viscosity":{"maxAbsPercent":1.2923772135973177,"rmsPercent":0.7378870729287641},"Re":{"maxAbsPercent":1.2838947504766995,"rmsPercent":0.7381091395965179},"head":{"maxAbsPercent":0.23435446459283416,"rmsPercent":0.1340246193649395}}; 40C English prediction kg/m3=1019.639268, mPa·s=1.629679
dowfrost-pg-40vol-2001-09: {"density":{"maxAbsPercent":0.016072002571521082,"rmsPercent":0.008797866768806801},"viscosity":{"maxAbsPercent":1.3299311563350846,"rmsPercent":0.8648786245518484},"Re":{"maxAbsPercent":1.3200604744518118,"rmsPercent":0.8621592009668146},"head":{"maxAbsPercent":0.3361029325846143,"rmsPercent":0.18131143162233995}}; 40C English prediction kg/m3=1026.399059, mPa·s=2.244529
dowfrost-pg-50vol-2001-09: {"density":{"maxAbsPercent":0.01601281024821155,"rmsPercent":0.010667722463083477},"viscosity":{"maxAbsPercent":1.3300724564126787,"rmsPercent":0.774841452257706},"Re":{"maxAbsPercent":1.32764151571092,"rmsPercent":0.7743422554385236},"head":{"maxAbsPercent":0.3644581958329285,"rmsPercent":0.18138414356685886}}; 40C English prediction kg/m3=1032.197743, mPa·s=3.113641
dowtherm-sr1-eg-30vol-2008-02: {"density":{"maxAbsPercent":0.015637216575459245,"rmsPercent":0.008877736296995968},"viscosity":{"maxAbsPercent":1.0862285652023518,"rmsPercent":0.5814247363213575},"Re":{"maxAbsPercent":1.0823446048711216,"rmsPercent":0.5823104331902962},"head":{"maxAbsPercent":0.20458830936422867,"rmsPercent":0.09853537538770853}}; 40C English prediction kg/m3=1037.932353, mPa·s=1.343679
dowtherm-sr1-eg-40vol-2008-02: {"density":{"maxAbsPercent":0.015389350569416926,"rmsPercent":0.008761297531547944},"viscosity":{"maxAbsPercent":1.0224360245587594,"rmsPercent":0.5987392848400082},"Re":{"maxAbsPercent":1.0195207124469863,"rmsPercent":0.6000107562890266},"head":{"maxAbsPercent":0.23206570439016083,"rmsPercent":0.11344282978454123}}; 40C English prediction kg/m3=1051.804342, mPa·s=1.774363
dowtherm-sr1-eg-50vol-2008-02: {"density":{"maxAbsPercent":0.015313935681482427,"rmsPercent":0.009062526070806086},"viscosity":{"maxAbsPercent":0.9107288974347316,"rmsPercent":0.5165709777938262},"Re":{"maxAbsPercent":0.9098674788019512,"rmsPercent":0.518862703601296},"head":{"maxAbsPercent":0.211051313285604,"rmsPercent":0.10765044589288836}}; 40C English prediction kg/m3=1064.875408, mPa·s=2.260810
Independent fixture qualification passed all approved regression limits. Full same-guide SI diagnostic rows are retained in independent-qualification.json.
Persistence browser checks passed: local acceptance lifecycle, stale/revert, invalid draft restore, CSV safety/reconciliation, print CSS/report, storage read/write failure handling.

> hydronic-pressure-drop-foundation@0.1.0 test:final-browser
> node test/final-browser.mjs

Final browser checks passed: 30→50 shared-flow stale/requalification/reacceptance, fluid stale/requalification/reacceptance, invalid raw acceptance block, no external requests/errors.
Browser checks passed: flows/reconciliation, shared update, stale/requalification, type cleanup, zero/raw invalid gating.
```

`git diff --check` and `git diff --cached --name-only` produced no output. The subsequent staged-name check likewise produced no output. `git status --short` reports only the workspace's pre-existing untracked top-level `docs/`, `hydronics/`, and `scripts/` trees; no files are staged.

## Residual risks for parent verification

- This is a deliberately broad presentation refactor within the existing monolithic `main.tsx`; the engine, persistence, and reporting contracts are untouched, but parent should visually inspect the live System, Sections, Results, narrow viewport, and printed report.
- The summary deliberately repeats the existing eligibility/unavailable copy so it is persistent; tests use scoped/first locators only where that creates two visible copies of the same legacy text.
- Browser testing exercises Chrome's CSS/print media behavior. Native printer pagination remains OS/printer-driver dependent, as before.
- The parent-owned `127.0.0.1:5175` preview was not bound, stopped, or killed by validation. The retained browser suite used isolated owned port 5178.
