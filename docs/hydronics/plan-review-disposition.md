# Hydronics plan review disposition

Victor approved publication and staged build after plan blockers are resolved. Astra synthesized the two independent source-only plan reviews and applied the following bounded corrections to `implementation-plan.md` and `tickets.json` before delegation.

| Finding | Disposition |
| --- | --- |
| Numerical B1: undefined glycol interpolation/source acceptance | Accepted. HYD-001 has an explicit stop and parent source-acceptance gate before qualification/Done or dependent implementation. Report max/RMS density/viscosity errors and effects on Re/head, all source conflicts, pinned revisions and same- versus cross-revision comparisons. Parent must explicitly accept measured errors with rationale or set limits. No numerical threshold or universal product accuracy silently invented. Material source decisions return to Victor. |
| Numerical B2: STD/XS versus literal schedule identity differs within 1/2–12-inch scope | Accepted. Qualify each literal dimensional designation, explicitly test 12-inch Sch40/STD and 10/12-inch Sch80/XS distinctions and ID=OD-2wall; ambiguous source values are not imported under a convenient label. No obligation to add STD/XS catalog variants; custom actual ID is the approved escape hatch. |
| Numerical B3: margin numeric domain/formula | Accepted. Finite nonnegative percentage units, deduplicated valid categories, explicit additive formula applied once before maximum selection. Added independent 32.5/34-ft governing crossover fixture. |
| Numerical B4 and contract B1: confirmation becomes stale when operating basis changes | Accepted. Applicability is tied to current derived section flow (including changes elsewhere), fluid/temperature/reference/concentration, relevant geometry and element type/data/envelope. Invalidation blocks reacceptance until requalified; applies to imports. No automatic one-point Q² scaling. Added 30→50 GPM shared-equipment browser case. |
| Numerical B5: psi semantics | Accepted. System psi is loss-equivalent pressure of required total head, not unconditional static flange gauge difference. No new velocity/elevation solver or static-lift scope. |
| Contract N1: hash is not a recoverable accepted-input snapshot | Accepted. Store full normalized accepted inputs, optionally plus freshness identity. |
| Contract optional: imported history is not authenticated approval | Adopted bounded safe behavior: imported historical snapshot requires fresh explicit local acceptance; recalculation is not human-authentication proof. |
| Contract optional: pending invalid text and autosave | Adopted. Invalid pending edits block acceptance and stale prior result even if a last-valid engine object remains; label unsaved invalid drafts versus last recoverable saved state honestly. |
| Numerical optional: more water verification points | Leave to data/validation worker; baseline official point required and independent in-range/endpoints encouraged. Do not expose unsupported liquid-service temperatures just to test correlation internals. |

No topology, flow-accounting, Fabel boundary or ticket-sequencing expansion was needed. Deferred items stay deferred: drawing, meshes/balancing, open systems/NPSH, automatic sizing, universal fitting/viscous-Cv models, and Fabel integration.

## Independent parent numerical spot-check

Astra independently evaluated the official IAPWS specific-volume and viscosity equations in an ephemeral Python calculation (not the future TypeScript implementation):

- 298.15 K: density 997.0470133997646 kg/m³; dynamic viscosity 0.000889996773678783 Pa·s. Agrees with official Table 8 printed values.
- 49°F (282.59444444444443 K): density 999.7486211670134 kg/m³; dynamic viscosity 0.0013270631394092563 Pa·s.
- Using that 49°F source state, 1800 US GPM, 10.02-inch actual ID, 15 ft pipe, 0.00015 ft roughness, exact SI unit conversions and g=9.80665 m/s², an independent bisection Colebrook solution gives Re 427998.5448307438, Darcy f 0.015476652366387792 and head 0.23173916134258887 ft.
- Legacy cached example uses different fluid/rounding/gravity conventions and gives 0.23174664595943364 ft; the source-mode difference for this ONE case is -0.003229654873226906%. This is not an overall accuracy guarantee or proof for other temperatures/fluids.

Remaining gate: reference datasets and their actual discrepancies still need implemented qualification evidence and explicit parent/user source acceptance. A plan review is not dataset qualification or application validation.
