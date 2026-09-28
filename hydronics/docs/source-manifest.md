# HYD-001 source manifest — approved bounded reference basis

**Status: source choices and HYD-001 reference-data implementation accepted; HYD-001 is Done.**
This package ships selected numeric subsets, provenance and independently reviewed expected fixtures. It does
not ship source PDFs/images. Raw documents and renderings remain local temporary evidence; source availability
or hashes do not grant redistribution rights.

| ID | owner/title/revision | SHA-256 / locator | shipped use and disposition |
|---|---|---|---|
| IAPWS-SR6-08-2011 | IAPWS, *Revised Supplementary Release on Properties of Liquid Water at 0.1 MPa*, September 2011 | `fda79dde9f441a90da755477c6533e23065e4f90c7f59a505f64c394d775bd45`; Eq.2/Table1 p.4, Eq.7/Table5 p.8, Table8 p.11 | IAPWS liquid-water reference, 0.1 MPa approximation only; no absolute-pressure suitability claim. |
| DOWFROST-GUIDE | Dow, *Engineering and Operating Guide for DOWFROST and DOWFROST HD*, **Published September 2001**, Form 180-01286-0901 AMS | `149ab4ee389d7c82bcbd364eda1665e637e98dcc17311a219cad0d4c49ec6bd3`; English density Table9 printed p.18/PDF p.17; viscosity Table13 printed p.22/PDF p.21 | named DOWFROST 30/40/50 literal volume-percent propylene-glycol typical-property lookup. |
| DOWTHERM-SR1-GUIDE | Dow, *Engineering Guide for DOWTHERM SR-1 and DOWTHERM 4000*, **Published February 2008**, Form 180-01190-0208 AMS | `d017af7e02f366de1176cdc6285394e99398e69e97951bc980ba42239cb4abeb`; English density Table10 printed/PDF p.18; viscosity Table14 printed/PDF p.22 | named DOWTHERM SR-1 30/40/50 literal volume-percent ethylene-glycol typical-property lookup. |
| PIPE-STEEL | TPS *Tube & Pipe Sizes*, 7th ed.; APP v7; Botop plain-end Sch10 and Sch80 | TPS7 `8e34aae258c8f28695d58f48da74c37bf48c2d748c274c333abde207b3e74ca9`; APPv7 `276ddb4d0f89f57cf2d85efddb123e8de31f3486fc064920c46f18b437b6b6a0`; Botop10 `3ab3e33697f5f7a853b96a21b4e76c3b4a8e461bddfa72f635b0c31d69aaf071`; Botop80 `49ec6dab5ca23bc174ffca44b42f41a058634efac7508f6e7d16fcff540f1838` | 15 common NPS sizes × literal Sch10/40/80. TPS p.7, APP chart and Botop sheets were visually checked. Underlying standard edition is unspecified by publisher; it is not guessed. |
| PIPE-COPPER | CDA, *Copper Tube Handbook* (2006); Mueller reference sheet; Engineers Edge secondary corroboration | CDA2006 `b3b03656722f2ff55cca5ab8d593a4691ca0c2fa29107f93196857e5a8baeba6`, Tables2a–c pp.21–22; Mueller `212183ab06b3ced2d7d9f1ce9af81317704f57e9d09ecb57638e7da04d738540`, p.1; Engineers Edge `copper_tubing_size_chart_astm_b88_13181.htm` | 15 common nominal sizes × K/L/M. Mueller corroborates through 8 in; Engineers Edge is accepted secondary, potentially derivative corroboration for 10/12 in—not a laboratory or primary-manufacturer measurement. |
| FITTING-DOE-1992 | DOE-HDBK-1012/3-92, June 1992 | `0135196976fc613fa7e0129776e9fd74ead03e6cc3a37bab65803d5484140974`; HT-03 Table1 printed p.35/PDF p.57 | only generic standard90 elbow Le/D=30 and standard45 elbow Le/D=16. Darcy context; connection/manufacturer unspecified. |

## Boundaries and deliberate exclusions

- The glycol basis is dated named-product **typical-property** data at literal volume percent glycol, not
  percent commercial concentrate, measurements of a particular installation or current-formulation certification.
  The selected English tables are used consistently; SI/TDS rows are neither averaged, silently repaired nor spliced.
  Water always uses IAPWS, never a guide 0% column.
- Software ranges are water 32–200°F and glycol 30–200°F. There is no concentration interpolation, extrapolation,
  clamping, water fallback, phase solver or proof of a circuit's pressure/freezing/boiling suitability.
- The catalog is bounded to exactly 15 sizes × Sch10/40/80 steel and K/L/M copper. `STD`, `XS`, `S` suffixes,
  and other unsupported identifiers are rejected rather than aliased. NPS10 Sch80 is wall `.594`/ID `9.562` in;
  NPS12 Sch80 is `.688`/`11.374` in.
- Catalog roughness defaults are separately attributed approved legacy engineering assumptions (steel `.00015 ft`,
  copper `.000033 ft`), exposed as a catalog override or custom geometry. They are not material guarantees for
  every installed pipe.
- The two DOE presets are generic Darcy estimates only. Their Le/D ratio is retained and equivalent length is
  recalculated from current actual section ID. They are turbulent-only software presets and require explicit
  current-fluid/service engineer confirmation. A water confirmation does not authorize glycol. Manual K/EL remains
  available; no CDA Hazen–Williams, NIST experimental, reducer or broad fitting library is shipped.

Independent extraction fixtures are `test/fixtures/independent-source-nodes.json`; the parent-recomputed
qualification and same-guide SI diagnostic rows are `test/fixtures/independent-qualification.json`. These artifacts
are deliberately not generated from the production datasets.
