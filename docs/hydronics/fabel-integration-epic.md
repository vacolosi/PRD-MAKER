# Hydronic PD integration epic: Basis of Design, modeled piping, riser and Revit export

Existing delivery issue: HEDMEP-204  
Parent: HEDMEP-134, Hydronic & controls  
Project: Hedral Heat Load Calc  
Owner and assignee: Victor  
Status: Backlog, planning specification only  
Update basis: Victor requested that the existing integration issue be expanded in place. No duplicate epic, new feedback issue, code implementation, or repository integration is authorized by this planning update.

## Summary

Allow an engineer to establish hydronic engineering criteria in Fabel's Basis of Design, author the actual piping design in its plan or model, evaluate that design with the existing hydronic pressure drop engine, and produce a readable, drawing quality riser that can be exported into Revit.

## Affected area

Hydronic & controls. Keep the existing parent, project, and discipline label. Basis of Design, model authoring, calculations, and drawings are collaborating product surfaces, not requests to move this issue into other Linear workstreams.

## Impact

Without this integration, an engineer must recreate model information in a calculator and independently maintain a schematic. Pipe lengths, equipment tags, flows, and branch connectivity can disagree between the plan, calculation, and submitted drawing. The intended workflow is one authored system with several synchronized views.

## Desired outcome & need

1. The engineer fills in reusable hydronic criteria at project setup, with separate effective criteria for each water system.
2. The engineer designs supply and return piping and connects equipment in the model or plan.
3. Fabel supplies reviewed geometry, connectivity, engineering inputs, and source identity to the existing calculator without retyping the network.
4. The calculator returns section and circuit results, the governing circuit, and actionable diagnostics.
5. The riser presents that same network with meaningful pipe and equipment labels, GPM, floor references, and clear supply and return routing.
6. The engineer can bring the exported riser into Revit and use it on a drawing after engineering and drafting review.

## Acceptance criteria

Reporter supplied definition of done, retained verbatim:

> The ideal complete scenario would be the design does the hydronic design in the fable app, then were able to do pressure drop calcs and create a riser diagram, or feed the exsiting riser in the app im fine with either and then be able to export it onto revit. i want the riser to look realistic enough to be used on a submitted drawing. it has gpms , labels on equipmrn and a user can udnerstand the system overview bylooking at it

The following acceptance checklist is a structured restatement of Victor's stated outcomes, not a replacement for his drawing review:

- [ ] An engineer can perform the hydronic design in Fabel using engineering inputs established in Basis of Design.
- [ ] That design supplies the inputs needed to perform the pressure drop calculation without recreating the design in a separate calculator.
- [ ] The same design produces a riser diagram, either through an extension of the existing riser or a compatible replacement.
- [ ] The riser includes GPM and equipment labels and allows the engineer to understand the system overview.
- [ ] The riser can be exported into Revit.
- [ ] Victor reviews the resulting riser as realistic and readable enough for use on a submitted drawing. Automatic calculation readiness is not itself drafting or engineering approval.

Detailed checks below are proposed implementation verification for those outcomes. They are not claims that integration, Revit import, or submitted drawing quality has already been verified.

## 1. Architecture and ownership

```text
Project Basis of Design       Authored plan and model       Equipment selections
          |                            |                           |
          +----------------------------+---------------------------+
                                       |
                         Resolved hydronic design
                Stable identities, source revisions, units,
                 actual connectivity, routes and input data
                                       |
                   +-------------------+-------------------+
                   |                                       |
         Existing hydronic engine                Riser layout and drafting
                   |                                       ^
                   +--- Results and diagnostics by ID -----+
                                                           |
                                                   Revit drawing export
```

The riser is a projection of the authored network. It is not a second independently editable hydraulic network. The drawing can be visible while the calculation is incomplete, but missing or stale results must remain visibly unavailable.

### Ownership boundaries

| Owner | Authoritative information | Must not silently own |
| --- | --- | --- |
| Basis of Design | Service defaults, fluid specification, design temperatures, pipe specification policies, roughness basis, safety factor policy | Actual routes, fitted equipment selections, guessed valve losses, accepted calculation snapshots |
| Authored hydronic model | Physical connections, equipment ports, pipe routes, actual size assignments, physical elevations, system membership | Pressure drop formulas or results inferred from drawing pixels |
| Equipment selection and terminal design | Reviewed terminal GPM, manufacturer loss data, valve characteristics, equipment tags and port roles | Airside CFM reused as water flow, rounded plant totals reused as terminal demands |
| Input resolution and adapter | Effective values, provenance, conversion into the supported calculation contract | New hydraulic math, silent default substitution, hidden unit conversions |
| Hydronic engine | Derived shared section GPM, fluid properties, losses, eligibility, circuit comparison and governing results | Floor arrangement, drawing appearance, automatic pipe sizing or flow balancing |
| Riser and export | Sheet layout, labels, linework, symbol arrangement and export formatting | Measured pipe lengths derived from schematic spacing, a different set of section flows |

Reuse Fabel's building levels, equipment identities, host state and command boundaries, and existing riser/export machinery where suitable. Do not introduce a separate floor table or competing equipment register. Existing heating water riser assumptions are not physical evidence: its top fed arrangement, generalized branches, and flow band sizes cannot become PD inputs without authored design support.

## 2. Initial supported scope and explicit exclusions

### Supported integration target

- Closed, filled, single phase water systems evaluated at prescribed terminal design flow.
- Heating water and chilled water treated as separate systems with their own criteria, topology and pump boundaries.
- One independently evaluated pump boundary and one effective mean fluid temperature per calculation system.
- Physical supply sections, one terminal section per circuit, and physical return sections. Shared pipe is represented once and referenced by every applicable circuit.
- Selected pipe sizes, supported loss primitives, explicit applicability review, explicit safety factor review, and local reviewed result acceptance.
- Multiple independent systems can be displayed together if their identities and hydraulic results remain separate.
- The first Revit deliverable is a two dimensional riser drawing exchange. Reuse the existing DXF workflow if it satisfies the verification requirements below.

### Not supplied by this epic

- A new hydraulic solver, automatic pump selection, pump curves, NPSH, automatic balancing, nonlinear flow distribution, or automatic pipe sizing.
- Unmodeled primary and secondary circulation, hydraulic separators, pressure dependent bypass networks, parallel pump operation, or arbitrary meshed networks. Unsupported designs must be identified and blocked, not flattened into an apparently supported loop.
- Open system static lift calculations. Elevation contributes actual pipe length and drawing position, not an added building height term in this closed loop friction calculation.
- Native Revit pipe, fitting, family, or connector creation, a Revit API addin, or bidirectional BIM synchronization. Those need a separate agreed scope. Revit import of a drawing must not be advertised as a native BIM model.
- Manufacturer library scraping, invented coefficients, broad glycol interpolation, or copying legacy workbook formulas, calculated results, client metadata, macros, diagrams, or proprietary libraries.
- Any silent relaxation of the existing engine's validation, applicability, reference data, acceptance, or persistence rules.

## 3. Data required from Basis of Design

The names in the following tables are logical product data requirements. The host representation can follow its established model conventions. They do not authorize inserting new fields into the existing strict engine input schema.

Every engineering value must distinguish unset, inherited, explicitly selected, and explicitly overridden. Show its effective value, unit, source, and override scope. Missing is not zero. A display label is not an identity.

### 3.1 Project and system criteria

| Data | Requirement and source | Validation and use |
| --- | --- | --- |
| Project identity | Stable project ID, display name, design revision | Links the calculation and export to the correct source project; rename does not create a new project |
| System identity and service | Stable system ID and tag; heating water or chilled water; explicitly closed loop scope | Every connected hydraulic object belongs to one evaluated system unless an explicitly modeled boundary separates systems |
| Criteria assignment | Project service template ID and revision, per system selection and deliberate overrides | Resolve before handoff; preserve provenance and prevent project defaults from overwriting system overrides |
| Fluid reference | Exact supported named water or glycol dataset, including concentration convention | No generic glycol value or unnamed water fallback; unsupported reference blocks evaluation |
| Supply and return design temperatures | Declared degrees F for the service and operating design condition | Engineering context and upstream terminal flow basis, not a substitute for engine mean temperature |
| Design delta T | Positive magnitude in degrees F with a defined source | If derived from supply and return, show the derivation; if deliberately overridden, show the override and flag disagreement; prevent inconsistent hidden copies |
| Mean calculation temperature | Explicit effective mean fluid temperature in degrees F | One value per calculation system; if proposed from supply/return average, show and confirm that basis before using it |
| Pipe specification policy | Engineer selects material and a compatible schedule/type; steel selection visibly pre-seeds Sch 40 and copper selection visibly pre-seeds Type L | Actual nominal size still belongs to each section; a material name alone is not enough to calculate. Never infer material from HW versus CHW service. |
| Roughness policy | Catalog default or explicit override in feet, with condition/source | Never infer pipe age or condition from the drawing; each section exposes the effective roughness |
| Fitting specification policy | Applicable supported fitting defaults and declared scope | A detected bend may suggest a component, but cannot confirm its hydraulic coefficient or suitability |
| Safety factor | Percent and selected categories: pipe, fitting, valve, equipment | User facing terminology is Safety factor; internal engine field remains `margin`; no automatic preset; zero still requires explicit acknowledgement |
| Engineering review context | Reviewer, source/reference note, review revision, date if supplied | Trace why the design inputs were selected; does not autoaccept the resulting calculation |

### 3.2 Existing engine compatibility limits

These are the current supported choices and must be checked against the pinned engine/reference version at integration time:

- Water: `iapws-liquid-water-sr6-08-2011`, 32 to 200 degrees F.
- Propylene glycol: `dowfrost-pg-30vol-2001-09`, `dowfrost-pg-40vol-2001-09`, `dowfrost-pg-50vol-2001-09`, 30 to 200 degrees F.
- Ethylene glycol: `dowtherm-sr1-eg-30vol-2008-02`, `dowtherm-sr1-eg-40vol-2008-02`, `dowtherm-sr1-eg-50vol-2008-02`, 30 to 200 degrees F.
- Concentrations above are volume percent glycol, not concentrate product percentage or weight percentage.
- Do not convert a broader Fabel fluid setting to the nearest supported choice. Explain unsupported selections and withhold calculation eligibility.
- Degrees F are absolute temperature inputs. Delta degrees F are temperature differences. They must not be passed through the same absolute temperature conversion.

### 3.3 Inheritance and change behavior

1. Resolve project service criteria, then system overrides, then applicable section/component overrides.
2. Retain both the authored override and effective value; clearing an override restores inheritance rather than writing the old default back as an explicit value.
3. A changed default affects only descendants that inherit it. Show affected systems and calculations before or alongside applying the change.
4. Reevaluate changed hydraulic inputs and invalidate affected current result acceptance under the established acceptance rules. Recheck loss applicability against the engine's actual condition basis.
5. Acknowledging a project policy does not silently confirm every equipment loss or accept all system results.
6. Draft criteria may be saved while incomplete. Final hydraulic eligibility requires all effective required values to be valid and reviewed where required.

## 4. Data required from the physical Fabel model

### 4.1 Floors, positions and coordinate conventions

| Data | Required detail | Use and guardrail |
| --- | --- | --- |
| Building floor reference | Stable floor ID, name, ordering and building datum from the authoritative floor model | Reuse for geometry and drawing levels; retain empty intermediate floors where relevant |
| Coordinate frame | Explicit world units, X/Y directions, Z datum, and any floor registration transforms | Normalize calibrated plan coordinates, not raw PDF pixels; Fabel viewer Y direction must be handled exactly once |
| Physical connection position | X, Y and known/declared Z in feet for ports, takeoffs and relevant route vertices | Z must identify actual piping or port elevation, not merely floor slab elevation |
| Pipe route | Ordered physical route vertices or equivalent routed centerline geometry, including horizontal offsets and vertical legs | Sum the actual route, not just endpoint distance, air duct path, or riser SVG length |
| Cross floor connection | Explicit connected endpoints and physical vertical path; stable relationship to floors/shaft if authored | A change of floor does not establish the connection or exact drop length by itself |
| Length basis | Measured from authored geometry, explicitly declared length, or unresolved | Display source and revision; approximations cannot masquerade as measured geometry |
| Declared length override | Feet, reason, author/revision, scope, and relationship to geometry | Deliberate replacement versus documented added physical length must be explicit; never double count both |
| Drawing placement | Separate symbol coordinates, label offsets, sheet placement and drafting preferences | Cosmetic changes must not alter physical route length or hydraulic input data |

Represent ambiguous or incomplete geometry as such. Automatic airside fallbacks such as a generic floor drop or nearest zone center must not silently transfer to physical hydronic length.

Physical length accounting must define centerline/end conventions at fittings and equipment. Equivalent length losses are separate from actual physical length. A coil body or pump symbol's drawn dimensions are not pipe lengths. Do not double count a vertical leg in both consecutive floor segments.

### 4.2 Nodes, ports, sections and pump boundaries

| Object | Required information | Rules |
| --- | --- | --- |
| Hydraulic node | Stable ID, display name, system ID and source object/port identity; type such as junction, equipment port or section boundary in host metadata | Coordinates alone do not define identity or connectivity; nearby points and graphical crossings remain disconnected unless explicitly joined |
| Equipment | Stable ID, tag, type, service, system membership, floor and location | Preserve a common identity in plan, schedules, calculation and riser |
| Equipment ports | Stable port IDs, declared roles, connection nodes and physical position/elevation where available | Distinguish inlet/outlet and supply/return connections; multiple coils in one unit remain distinct hydraulic services |
| Pump boundary | Selected pump/equipment identity plus distinct discharge and suction node IDs for the evaluated loop | Never collapse both sides into one node; do not insert the pump's head gain as a passive pressure loss |
| Section | Stable section ID, name, role, from node, to node, actual length, pipe geometry, loss elements, and source object mapping | One physical section appears once in the network; branch circuits reference shared section IDs rather than duplicate upstream pipe |
| Section boundary | Junction, terminal port, size/roughness change or another explicitly needed physical/calculation boundary | Decorative polyline vertices need not become separately named engineering nodes |
| Terminal association | Stable terminal/equipment ID and corresponding terminal section | A terminal section may have zero pipe length while containing equipment losses; zero must be deliberate |
| Draft/excluded object | Explicit inclusion state and reason | Unconnected authored objects are visible; do not silently omit a required active terminal or treat it as zero flow |

An inlet/outlet pair is not created by alternating through a node list. Actual section references define each pair; shared junctions legitimately serve more than one section.

### 4.3 Terminal water requirements

Each active terminal needs the following:

- Stable terminal and equipment identity, service and system membership.
- Prescribed `terminalDesignGpm` as an unrounded finite engineering value with documented basis and review state.
- A basis of either reviewed equipment/terminal design flow or a separately qualified load, delta T and selected fluid calculation.
- If flow is derived upstream: source heating/cooling load, load units, source run revision, operating design case, effective delta T, fluid basis, and any override. Unqualified derivation is not supplied by this PD epic.
- Distinction between terminal demand, plant aggregate, airside airflow, and displayed rounded GPM. None are interchangeable.
- Positive GPM for active demand; deliberately unused terminals remain explicitly draft/excluded. Honor any narrower engine validation without converting invalid input to zero.
- A defined hydraulic terminal loss and supply/return connection. A room centroid or equipment tag without these is not a complete circuit.

System root GPM and section GPM are engine derived from active terminal circuit membership. Neither becomes an editable imported section flow. Existing schematic riser flow labels and workbook reference flow values are not hydraulic inputs.

### 4.4 Pipe geometry and component losses

For each section, supply one of:

1. An exact supported pipe catalog ID and an optional deliberate roughness override in feet.
2. Custom actual inside diameter in inches and roughness in feet, with a declared source.

Nominal size, outside diameter, material, schedule and display text may be retained as source/drawing metadata, but are not substitutes for actual hydraulic inside diameter. Actual length is in feet and nonnegative; inside diameter is positive; roughness is nonnegative; all numbers must be finite. No pipe size is guessed from a neighboring line or a schematic flow band.

Each nonpipe loss needs a stable identity, owning section, category, quantity, type, declared applicability envelope, and source information. Retain at most the fields relevant to the chosen type:

| Supported type | Required scalar/selection | Category and meaning |
| --- | --- | --- |
| Manual K | Dimensionless `k`, nonnegative; section inside diameter basis | fitting, valve or equipment; source must use the same velocity basis or remain unsupported |
| Equivalent length | `equivalentLengthFt`, nonnegative; section inside diameter basis | fitting, valve or equipment; separate from physical pipe length |
| Supported preset elbow | Exact supported preset ID, current choices `doe-hdbk-1012-3-92-standard-90-elbow` or `doe-hdbk-1012-3-92-standard-45-elbow` | fitting; do not assume any arbitrary turn angle/radius matches these |
| Cv | Positive finite `cv` | valve or equipment; preserve the selected valve/opening and applicable service basis |
| Direct pressure loss | `pressureLossPsi`, nonnegative | valve or equipment; a specified pressure loss at reviewed conditions, not an automatically valid curve at every GPM |
| Direct head loss | `headFtOfSelectedFluid`, nonnegative | valve or equipment; head of the selected actual fluid, not an unspecified water column |

Quantity is a nonnegative integer. A deliberate zero must remain distinguishable from missing data and must not conceal an omitted required physical component. Manufacturer equipment data should record the rated flow, fluid and temperature/operating basis available from the source. Unsupported loss types remain unresolved instead of being converted to a guessed K.

No double counting: a coil pressure loss that already includes its internal components must not be added again as separate internal fittings. Tee branch and through paths require their own appropriate loss basis if represented; a connected tee symbol does not itself supply a valid coefficient.

## 5. Circuit compilation and engine handoff

### 5.1 How circuits are established

- Use explicit authored connectivity to identify each intended terminal's complete discharge to suction path.
- Supply section IDs are ordered from pump discharge toward the terminal.
- The terminal section connects the terminal inlet to outlet.
- Return section IDs are ordered from terminal outlet to pump suction.
- Where there is exactly one supported route and the physical input is complete, a route can be proposed from the graph. Ambiguous routes require engineer resolution; never choose the shortest or nearest route silently.
- Shared sections retain one identity across all circuits. Supply and return are both real modeled paths; do not fabricate a mirrored return from supply geometry.
- Reject missing references, discontinuities, incompatible roles, repeated sections in one path, cycles outside supported topology, unsupported cross connections and unresolved pump boundaries using engine validation plus source side checks.
- Show active but unassigned design objects separately from intentional drafts. The adapter must not obtain an apparently complete calculation by dropping problematic active equipment.

### 5.2 Engine compatible payload

The normalized calculation input remains `hydronic-pressure-drop@1`. Pin and record the actual engine and reference data versions used; initial reviewed versions are engine `hydronic-pressure-drop-engine@1.0.0` and reference data `hydronic-reference-data@1.0.0`.

The portable input must contain:

```text
Project
  schema, id, name, calculationDataVersion, provenance
  systems[]
    id, name, fluidReferenceId, meanTemperatureF
    pumpDischargeNodeId, pumpSuctionNodeId
    nodes[]: id, name
    sections[]
      id, name, role, fromNodeId, toNodeId
      actualLengthFt, geometry, description if present
      elements[]: supported loss data and applicability
    circuits[]
      id, name, state, terminalDesignGpm
      supplySectionIds[], terminalSectionId, returnSectionIds[]
    margin: percent, categories[], acknowledged
```

Coordinates, floor data, drawing layout, model revision stamps, host port types, manufacturer attachments, and Revit sheet settings remain in a separately versioned host/source context. They must not be inserted as unauthorized extra properties into the engine schema. The host context needs stable mappings back from system, node, section, circuit and loss IDs to source model objects.

Preserve `margin` internally for compatibility while displaying Safety factor. Match the installed contract rather than silently changing its shape. Unsupported payload or reference versions fail with an actionable message.

### 5.3 Source context and revisions

Record source project/system IDs, authored design revision, resolved criteria revision, equipment/flow source revisions, geometry/units convention, adapter version, export time, and an input fingerprint. A timestamp alone is not a content fingerprint. Export time must not make identical hydraulic inputs appear physically different.

Identity must survive renaming and cosmetic layout moves. Physical edits update source revisions and derived input. Splitting or merging a section requires explicit old/new identity reconciliation, with stale prior references exposed. Never rematch equipment or sections solely by display name or coordinate proximity.

A handoff review shows effective fluid and temperature, pump boundaries, terminal population and GPM basis, section counts, length sources, pipe/loss completeness, criteria overrides, and excluded objects. The engineer can inspect gaps without corrupting or discarding the model.

## 6. Results, freshness, applicability and acceptance

Required result presentation, always using the engine's returned values:

- Engine and reference data versions, evaluated input revision, and review state.
- Root design GPM and per section derived GPM where available.
- Section actual fluid head loss and loss equivalent psi with availability/completeness state.
- Circuit category losses, raw head, safety factor allowance, factored head, and pressure loss.
- Raw and factored governing circuit identity, including ties where the engine reports them.
- Diagnostic messages linked to the affected criteria, section, equipment or connection.
- Inspector details exposing the evaluated inputs and calculation breakdown without a second implementation of the equations in the UI.

Physical or engineering edits such as rerouting pipe, changing a vertical elevation, altering diameter, changing terminal GPM, selecting another fluid, changing temperature, editing losses, or modifying the safety factor reevaluate the input and stale affected prior acceptance. Indirect shared flow changes matter. Loss applicability is checked against the exact engine condition basis, not a host shortcut.

Historical reviewed results may remain visible but must be labeled historical/stale. Imported acceptance is not automatically trusted local acceptance. A new current acceptance requires the existing sanctioned review process. Selecting a nongoverning circuit in the inspector cannot change the governing system result.

Cosmetic sheet positioning must not change physical inputs. Renaming keeps identity; any stricter existing acceptance fingerprint behavior is retained unless separately reviewed. Preserve current save/undo/restore and invalid draft behavior. Empty inputs, NaN, infinity, unsupported fluids and missing topology never become zero or retained current results.

## 7. Riser requirements for drawing use

### Required content

- Actual authored pump/plant location, terminals, branch/merge relationships and both supply and return paths. Do not force every system to use a top fed generic plant symbol.
- Correct heating water or chilled water service identifiers and distinct systems. Do not combine water systems simply because their terminals share a floor or air system.
- Authoritative floor names and datums, meaningful equipment placement by level, and continuity through intermediate floors and sheet breaks.
- Stable equipment tags matching the plan/model and schedules; consistent terminal and pump identities.
- Readable pipe size, service and GPM labels at meaningful section/flow changes. Use engine derived flow and actual assigned pipe size, not a separate riser sizing/flow algorithm.
- Supply/return distinction that survives monochrome printing, directional arrows, recognizable equipment symbols and a legend where needed.
- Branch joins distinct from unconnected line crossings. Junction markers must communicate actual connectivity.
- Sheet title, system/service, source design revision, units, and current review/draft status.
- Clear presentation of unresolved inputs or stale labels in preview and draft exports. No drawing should silently make an unresolved network look complete.

### Drafting behavior

The riser is schematic, not a dimensioned reconstruction of the route. Sheet spacing can be adjusted for readability while the physical model retains actual lengths and elevations. Allow appropriate label offsets and layout overrides without changing hydraulic topology. A drafting drag is not a pipe reroute.

Readable means that equipment labels, GPM, sizes, arrows and floor lines do not obscure one another at the intended plotted scale. Dense systems need layout handling, sheet sizing or matchlines rather than clipped or microscopic text. Shared pipes are drawn once with their aggregate flow. Do not fill a submitted drawing with every intermediate computational node ID unless an optional debug view is enabled.

Clicking a riser section/equipment should identify the corresponding model object and calculation detail. Selecting a circuit should highlight its true supply, terminal and return path. Highlighting is not a new flow calculation or a change to the governing circuit.

Reuse the existing heating water riser layout/render/export separation when practical. Its current assumed topology and flow band sizing must not override the authored network or the PD engine. Existing airside and unrelated drawing workflows must remain functional.

## 8. Revit export requirements

Initial delivery interpretation: export a two dimensional riser drawing that can be imported into a Revit drafting/detail workflow, using the existing DXF route where suitable. Also retain a useful SVG preview/export if already supported. This is not a promise of native Revit pipes or families.

The export must preserve:

1. Visible topology, branch connections and continuity.
2. Equipment tags, GPM values, pipe sizes, service labels, floor names and notes consistent with the same model/result revision.
3. Legible text at the declared sheet/plot scale, including unit symbols, fractional sizes where used and long equipment tags.
4. Distinct supply/return line patterns and suitable lineweights/layers for monochrome drawings.
5. Symbols, arrows, floor datums, matchlines and sheet extents without clipping or unexplained scaling.
6. Explicit draft/stale status when exported as a draft. A reviewed deliverable must use current reviewed engineering data and pass drawing review; support a marked draft export rather than suppressing all visibility until completion.

Verification is a real import into a recorded supported Revit version/build, placed on a sample sheet and checked at the intended plot scale. Retain the exported file, import settings, screenshot/PDF of the sheet, source revision and reviewer notes. A valid XML or DXF parse alone does not prove the requested Revit deliverable works. Victor must sign off drawing readability. If Revit is unavailable during development, report this gate as unverified rather than calling the epic complete.

## 9. Sequenced implementation work packages

These are ticket ready work packages within the existing epic. They are not newly created Linear issues. Each has an outcome, scope, dependencies and concrete verification. Future issue splitting must preserve this epic and avoid creating another integration umbrella.

### HYD-INT-01: Agree the model, criteria and calculator data contract

**Outcome:** One explicit boundary between authored Fabel data, resolved hydraulic input, drawing context and calculated outputs.

**Scope:** Define the tables in sections 3 through 5 as versioned data ownership rules. Specify stable IDs, source mappings, unit/datum conventions, missing states, supported services, version compatibility and revision fingerprints. Define inclusion state and how unsupported networks are rejected. State which existing data can be reused and which hydronic data must be authored rather than borrowed from airside.

**Dependencies:** Current standalone engine qualification and contract review. Coordinate with the existing cross floor physical path work rather than invent a second building coordinate system.

**Verification:** Document one complete valid example and examples missing a fluid, Z value, terminal flow and connection. Show their distinct unresolved states and precise source messages. Demonstrate the same IDs across model, payload, result and drawing examples. Agree the Revit drawing exchange interpretation before implementing export.

### HYD-INT-02: Add hydronic criteria to Basis of Design

**Outcome:** The engineer sets reusable project service criteria and per system overrides at setup.

**Scope:** All section 3 fields, supported fluid choices, design/mean temperature distinction, pipe/roughness policies, safety factor categories and explicit acknowledgement. Pre-seed a visible, editable pipe family when material is selected: steel -> Sch 40; copper -> Type L. Do not infer material from heating versus chilled-water service. Show non-binding safety-factor guidance (for example, `Typical: 10% on pipe + fitting`) without pre-filling a value or categories. Effective values and sources are visible; unknown remains unknown. Store review/provenance and preserve existing project defaults unrelated to hydronics.

**Dependencies:** HYD-INT-01.

**Verification:** Create CHW and heating water systems with different criteria. Change a project default and demonstrate only inheriting systems change. Clear an override and demonstrate inheritance resumes. Save/reopen without losing intent. Unsupported glycol concentration and unset temperature remain blocked. A zero safety factor still requires acknowledgement.

### HYD-INT-03: Establish hydraulic equipment ports and reviewed terminal water demand

**Outcome:** Pump, terminal and relevant equipment objects expose explicit water connections and a traceable terminal GPM basis.

**Scope:** Equipment/port identities, service and system membership, floor/location, pump discharge/suction distinction, terminal section association, design GPM and provenance. Reuse equipment tags and upstream valid water design data, not rounded airside/riser labels. Handle separate hot and chilled water coils in the same equipment. Preserve equipment source revisions and overrides.

**Dependencies:** HYD-INT-01 and effective criteria from HYD-INT-02.

**Verification:** Rename an equipment tag without changing its ID. Connect separate coil circuits correctly. Missing water flow blocks calculation while an explicit exclusion remains visible. Change terminal demand and show affected network inputs become stale. Room/airside CFM and a plant aggregate cannot be selected as terminal GPM by accident.

### HYD-INT-04: Author the connected physical supply and return network

**Outcome:** The engineer draws actual hydronic piping and explicit connections in the plan/model.

**Scope:** Nodes, junctions, ports, section boundaries, supply/return roles, shared sections, explicit joins and disconnections, active/draft inclusion, and stable source identity through edits. Reuse suitable Fabel authoring primitives without duplicating the airside state pipeline. A graphical crossing is not a connection. Return piping must be authored, not mirrored as an assumed copy.

**Dependencies:** HYD-INT-01 and HYD-INT-03.

**Verification:** Author two terminals sharing supply and return mains. Show a deliberate tee connection and a nonconnected crossing. Move equipment and distinguish moving a symbol from actually changing its connected route. Split a section and reconcile IDs/references. Delete a required connection and retain a visible diagnostic instead of silently dropping the circuit.

### HYD-INT-05: Derive physical lengths and elevations with auditable overrides

**Outcome:** Each section has a verified physical length and a visible measurement basis.

**Scope:** Calibrated world coordinates, floor registration, actual pipe elevations, centerline lengths, vertical legs, offset routes, declared overrides and double count prevention. Derive from the physical path, never a riser display. Unresolved elevation or disconnected floor transition stays unresolved.

**Dependencies:** HYD-INT-01 and HYD-INT-04; coordinate with existing cross floor routing capability.

**Verification:** Use the geometry cases in section 10. A path with bends is not reduced to straight endpoint distance. A vertical leg is counted once. Missing Z has an actionable gap rather than a default floor drop. Moving only a riser symbol leaves the hydraulic length unchanged. State the numeric tolerance and coordinate units in the tests.

### HYD-INT-06: Resolve section pipe specifications and equipment/fitting losses

**Outcome:** Each modeled section produces supported geometry and nonpipe loss inputs.

**Scope:** Catalog or custom actual inside diameter, roughness inheritance/overrides, material/size labels, physical length separation, all supported loss types in section 4.4, quantities, source notes, declared envelopes, and explicit applicability review. Suggested components from geometry remain proposals until the hydraulic basis is supplied and confirmed. Track no double counting of integrated equipment losses.

**Dependencies:** HYD-INT-02 through HYD-INT-05.

**Verification:** Map an exact catalog selection and a custom pipe correctly. Reject nominal diameter used as actual ID without resolution. Switch loss type without retaining hidden coefficient fields. A direct coil pressure loss at one basis cannot stay silently confirmed after a relevant flow/fluid change. Unsupported fittings remain unresolved rather than mapped to the nearest available elbow.

### HYD-INT-07: Compile and validate complete terminal circuits

**Outcome:** The authored network yields ordered supply, terminal and return section membership for every active intended terminal.

**Scope:** Pump boundaries, connectivity validation, unique route proposal, explicit ambiguity handling, shared physical IDs, supported topology checks, and active/unassigned reporting. The engine remains the authority for derived shared GPM and final hydraulic eligibility.

**Dependencies:** HYD-INT-03 through HYD-INT-06.

**Verification:** In the two terminal fixture, a shared main is referenced by both circuits but represented once. A missing return path, duplicate section reference, wrong system port, unsupported bypass or ambiguous route cannot produce an eligible system result. No active terminal disappears during compilation. A manually chosen inspector circuit cannot change system membership.

### HYD-INT-08: Supply the versioned engine input and source review handoff

**Outcome:** Fabel can provide the same reviewed design to the existing standalone engine without copying formulas or requiring a second authored model.

**Scope:** Produce the exact supported input schema, separate host context, source ID mappings, pinned versions, unit conversion boundary, effective values and input fingerprint. Provide a review of missing inputs, overrides, provenance and exclusions. Support a portable handoff for independent evaluation and later the in app boundary using the same normalized input.

**Dependencies:** HYD-INT-01 through HYD-INT-07.

**Verification:** The same normalized fixture evaluated directly and through the host gives matching results within the engine's documented tolerances. No intermediate rounding. Unknown schema/reference versions fail safely. Source export timestamps do not alter hydraulic inputs. Imported history is not local acceptance. Raw workbook flows, riser geometry and airside units never populate water calculation fields.

### HYD-INT-09: Integrate results, source diagnostics and stale aware review

**Outcome:** The engineer sees PD results and can review/accept them from Fabel with complete traceability to modeled objects.

**Scope:** Required results from section 6, selected circuit highlighting, per section/circuit math, governing and tie behavior, missing states, result freshness, applicability invalidation, local acceptance and historical output labeling. Relevant valid changes may trigger recalculation or mark an available result stale according to the established execution policy, but a recalculation never silently renews engineering review/acceptance. Route diagnostics to the correct BoD value, section, port or equipment object. All engine errors remain visible and fail closed.

**Dependencies:** HYD-INT-08 and current engine qualification.

**Verification:** Change flow, physical route, elevation, pipe size, fluid and component loss separately and inspect freshness and review state. Confirm indirect shared flow changes are included. Confirm an available recalculation does not renew acceptance without explicit engineer review. Unavailable never appears as zero/current historical output. Reaccept only after the engine and review gates are satisfied. Selecting a lower loss circuit does not change the governing head.

### HYD-INT-10: Generate a drawing quality riser from the authored network

**Outcome:** The riser clearly communicates the same designed system and its current reviewed flow/size data.

**Scope:** All section 7 content; reuse or extend the existing heating water riser architecture while removing any dependency on schematic assumptions for physical inputs. Support service separation, source floor data, actual plant connection location, shared branches, equipment labels, GPM, pipe sizes, legend, monochrome line styles, branch/crossing distinction and useful layout overrides. Display unresolved objects without inventing connectivity.

**Dependencies:** HYD-INT-01, HYD-INT-04, HYD-INT-07 and HYD-INT-09 for result overlays. A draft network view may be developed earlier if it is explicitly nonfinal.

**Verification:** Compare every displayed tag and branch GPM with the source/result for the fixture. Demonstrate a pump not at the top floor, two separate water systems, an intermediate empty floor, a dense branch and a long equipment label. There must be no hidden clipping or ambiguous crossing. Selecting a line identifies the same section in the model/calculation. Moving a label leaves geometry and calculation inputs unchanged. Obtain Victor's actual readability review.

### HYD-INT-11: Export the reviewed riser into a Revit drawing workflow

**Outcome:** The generated drawing is usable on a Revit sheet, not merely downloadable as a file.

**Scope:** Section 8; reusable DXF export, declared unit/scale convention, layers/linetypes, equipment symbols, legible text, revision/status notes, sheet extents and matchlines as needed. Include clear import instructions and no native BIM claims. Preserve existing unrelated export behavior.

**Dependencies:** HYD-INT-10 and agreed Revit exchange format from HYD-INT-01.

**Verification:** Perform and document a real import into the target Revit version. Place it on a representative sheet, inspect at intended plot size and compare tags, GPM, sizes, line patterns and connectivity with Fabel. Retain the export and screenshot/PDF evidence. Draft exports show their status. If Revit testing is unavailable, this package remains unverified.

### HYD-INT-12: Prove the complete workflow and protect persistence/regressions

**Outcome:** The requested workflow is repeatable from project setup through a reviewed Revit sheet.

**Scope:** End to end fixture from section 10; BoD entry, physical authoring, input review, PD, riser, Revit export, later physical revision and rereview. Verify save/open, undo/redo, invalid draft recovery, stable IDs, source overrides, migrations and existing airside/riser behavior. Define compatibility behavior for old projects with no hydronic data instead of manufacturing defaults.

**Dependencies:** HYD-INT-02 through HYD-INT-11.

**Verification:** Record the complete engineer walkthrough and output revisions. In the shared-main fixture, change one terminal demand and confirm that its branch, shared supply/return flow, affected losses, governing result, and drawing labels all update from the same source revision. Save/reopen must preserve authored data but not treat imported historical acceptance as a new local review. Undo/redo must restore a coherent graph and review status. Existing Fabel build/typecheck, tests and relevant browser suites pass under the repository's current protocol. Independent engineering review and Victor's drawing review are recorded before Done.

### Delivery order

```text
01 Contract
  -> 02 Criteria
  -> 03 Equipment and water demand
  -> 04 Physical connectivity
  -> 05 Geometry and lengths
  -> 06 Pipe and loss data
  -> 07 Circuits
  -> 08 Handoff
  -> 09 PD review and freshness
  -> 10 Riser
  -> 11 Revit export
  -> 12 Complete workflow signoff
```

Some UI work can proceed in parallel after the contract is agreed. No implementation task may bypass its data or review prerequisites merely to render a plausible drawing.

## 10. Proposed verification fixtures and evidence

These are synthetic implementation test scenarios, not copied workbook inputs/results and not submitted engineering calculations.

### A. Network and flow fixture

One supported closed loop with terminal A at 10 GPM and terminal B at 20 GPM. Both circuits share one common supply section and one common return section, with distinct terminal branches and terminal sections. Put the terminals on different declared levels with the pump at the lower level.

Expected flow membership: common supply and common return each carry 30 GPM; each A only section carries 10 GPM; each B only section carries 20 GPM. Each shared section has one identity. Change B to 40 GPM: common sections become 50 GPM, A only sections remain 10 GPM, B only sections become 40 GPM. Inspect applicability, current result state and historical acceptance after the change.

Use valid supported pipe data and explicitly reviewed loss primitives for a ready case. Obtain loss result expectations from the existing qualified engine/independent engineering fixtures, with documented numeric tolerance. Do not invent pressure drop goldens in the UI or adapt formulas to the legacy workbook.

### B. Geometry fixture

In world feet, use the ordered route `(0,0,0) -> (3,0,0) -> (3,4,0) -> (3,4,12)`. Expected actual routed length is 19 ft, not the 13 ft straight endpoint distance. Declare all vertices in one consistent frame and count the vertical leg once. A reasonable proposed floating point check for this synthetic exact case is absolute error at most 0.000001 ft; document the chosen tolerance explicitly.

Missing final Z must expose unresolved physical elevation. A separate supported diagonal route can use its declared 3D segment length; do not flatten it into plan length. Do not import a three dimensional length convention into a host route that only defines orthogonal plan and vertical legs without documenting the conversion.

### C. Missing and unsupported cases

Missing fluid, unsupported concentration, unset mean temperature, absent actual ID, invalid coefficient, missing coil flow, missing return connection, unresolved vertical leg, unsupported mesh/bypass, incompatible equipment port, unknown schema and stale upstream load basis. Each must have an actionable reason and no false current final result.

### D. Change and identity cases

Rename equipment, move only a riser label, reroute physical pipe, change one inheritable BoD value, change an explicit override, split a section, delete/reconnect a terminal and reopen an older project. Confirm identities/source mappings, inherited values, calculation freshness and explicit omissions. Cosmetic layout changes must not overwrite physical design.

### E. Drawing and Revit cases

At least one multilevel branched fixture and a separate heating/chilled service fixture. Include long tags, fractional pipe labels, a non top fed pump, intermediate floors, a dense branch and a sheet continuation if required. Compare the source graph, Fabel riser and imported Revit sheet. Test in monochrome as well as screen color. Record reviewer findings and resolve any ambiguity in system overview, tag readability or branch connectivity.

### Required handoff evidence

- Field/ownership contract with version and unit conventions.
- Valid and intentionally invalid synthetic source/handoff fixtures.
- Result parity and shared flow checks with documented tolerances and engine versions.
- Geometry measurement and source/revision tests.
- Screenshots of incomplete, ready, stale and reviewed states.
- Save/open and undo/redo evidence plus relevant regression results.
- Riser source revision, export file, Revit version/build and import settings.
- Revit sheet screenshot/PDF at the intended plot scale and Victor's drawing approval.
- Explicit residual limitations and unsupported system types.

## 11. Decisions and boundaries retained for implementation planning

- Basis of Design owns reusable engineering criteria; specific coil/valve loss data remains with its equipment/component and inherits only suitable policies.
- The existing hydronic engine remains the calculation authority. The riser does not independently size pipes or generate PD results.
- The existing integration ticket is expanded in place under Hydronic & controls and remains assigned to Victor. No duplicate epic or new feedback ticket is required.
- The first Revit deliverable is a drawing exchange, not a native BIM model. Confirm that interpretation during the contract work package before implementing export.
- This issue now describes the future integration target in detail; it is not evidence that Fabel already has the required physical hydronic authoring capability.
- This planning update does not authorize code changes, deployment, commits, pushes, copying protected workbook content, or altering unrelated issues/states.
- Existing standalone validation/handoff work and cross floor physical path work remain dependencies/coordination points. Do not mark those issues complete based on this planning document.

## 12. Post-epic product roadmap (not part of HEDMEP-204 completion)

The following items are intentionally deferred until the complete, reviewed workflow above is proven. They should be created as separate follow-on issues only after duplicate review; they do not expand HEDMEP-204's definition of done.

| Order | Proposed follow-on | Outcome and boundary |
| --- | --- | --- |
| 1 | Assisted hydronic pipe sizing | Recommend supported catalog sizes from engineer-defined velocity and friction-rate limits; preserve locked sizes and require explicit review before applying. Recheck loss applicability after geometry changes. This is proposal support, not automatic final engineering selection. |
| 2 | Hydronic schedules and connected-load/flow summary | Produce coordinated equipment tags, reviewed terminal GPM, temperatures, losses and pump design duty. Keep connected terminal totals distinct from diversified plant-capacity sizing. |
| 3 | Reusable hydronic system templates | Provide editable starting networks for already-supported topology. Templates must not invent physical lengths, confirmed loss coefficients, or reviewed terminal demand. |
| 4 | Bounded hydronic design alternative comparison | Compare separately authored, supported designs with changed pipe sizes, delta-T, fluid or criteria. Do not imply annual-energy simulation, arbitrary-network flow solving, or automatic selection. |

Separate future epics, not enhancements to this one, would be required for manufacturer library selection, pump curves/operating-point selection, NPSH, automatic balancing, primary-secondary or bypass arrangements, parallel pumps, or arbitrary meshed-network solving.

<!-- hydronic-pd-v1:HYD-007 -->

---
Updated in place at Victor's request. Acceptance outcome supplied by Victor; detailed requirements and proposed verification elaborated for implementation planning.
