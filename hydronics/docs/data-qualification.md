# HYD-001 retained reference-data qualification

The selected source basis is approved: the dated English tables for DOWFROST September 2001 and DOWTHERM
SR-1 February 2008. HYD-001 is **Done** after parent acceptance of the repaired reference-data gate; this does not make the calculator design-certified. These limits are table-regression checks against pinned rounded tables,
not certified interpolation bounds, fluid-product accuracy, safety factors or a guarantee for every circuit.

## Independent expected evidence and reproducible harness

`test/fixtures/independent-source-nodes.json` was built from Astra's independently header-coordinate-extracted,
visually checked source cells. It contains the 216 expected English table values and source locators/hashes without
reading `src/engine/glycol.ts`. The production lookup test compares against that fixture, preventing a shifted source
column from passing merely because both expectation and implementation were shifted.

Run the qualification-only harness from `hydronics/`:

```sh
node scripts/qualify-reference-data.mjs
```

It intentionally implements interpolation/Colebrook independently and reads only the independent fixtures. It uses
100 US GPM, 100 ft, custom 4.026-in actual ID, `.00015 ft` roughness, exact SI conversions, `g=9.80665 m/s²`, and
100 bisection iterations. It holds out each 40–190°F source node using a 20°F bracket. The custom diameter is a
qualification condition, not a catalog claim. All states in this check are turbulent.

| series | density max/RMS % | viscosity max/RMS % | Re max/RMS % | head max/RMS % |
|---|---:|---:|---:|---:|
| PG30 | .015738 / .008806 | 1.292377 / .737887 | 1.283895 / .738109 | .234354 / .134025 |
| PG40 | .016072 / .008798 | 1.329931 / .864879 | 1.320060 / .862159 | .336103 / .181311 |
| PG50 | .016013 / .010668 | 1.330072 / .774841 | 1.327642 / .774342 | .364458 / .181384 |
| EG30 corrected | .015637 / .008878 | 1.086229 / .581425 | 1.082345 / .582310 | .204588 / .098535 |
| EG40 corrected | .015389 / .008761 | 1.022436 / .598739 | 1.019521 / .600011 | .232066 / .113443 |
| EG50 corrected | .015314 / .009063 | .910729 / .516571 | .909867 / .518863 | .211051 / .107650 |

Acceptance limits per series: maximum absolute density error `<= .025%`, viscosity `<= 1.5%`, Reynolds `<= 1.5%`,
and representative head `<= .5%`, plus exact independently checked source-node recovery. The complete parent
recomputed metrics and every 0–90°C/5°C same-guide SI diagnostic row are retained in
`test/fixtures/independent-qualification.json`. The English-versus-SI comparison's approximate full-set maxima are
`.0108%` density and `.8873%` viscosity; it includes grid/interpolation/rounding differences and is not a claim that
every difference is a source typo.

At 40°C, corrected English-guide EG predictions (SI) are: 30% `1037.932353 kg/m³`, `1.343679 mPa·s`; 40%
`1051.804342`, `1.774363`; 50% `1064.875408`, `2.260810`. They are cross-revision diagnostic checks against the
recorded 2017 TDS values, not revision splicing or a current-formulation claim.

## Source discrepancy dispositions

- Use each pinned guide's English table consistently. PG50 at 50°F remains English `10.65 cP`; the SI guide's
  `10.59 mPa·s` and later TDS are not merged or silently repaired.
- Do not use the guide 0% water column; IAPWS water remains separate. Quarantine inconsistent sparse TDS rows.
- Source back-cover dates/form numbers are established, not unknown: DOWFROST September 2001/Form
  180-01286-0901 AMS and SR-1 February 2008/Form 180-01190-0208 AMS.
- Raw acquisition/public availability does not grant redistribution rights. This bounded local numerical subset
  remains subject to future distribution review; no full standards purchase is asserted as a prerequisite.

No hydraulic loss engine, graph evaluator, UI, persistence, or field-certified sizing claim is implemented here.
