---
name: prd
description: "Draft a mechanical PRD as a Notion page in the Mechanical PRD List using the standard Hedral template, then create the companion Linear issue in the PRD Creation project assigned to Victor. Use whenever the user wants to write, draft, or create a PRD for a mechanical product feature or solver. Always use this rather than hand building a PRD page."
---

Turn a rough feature description into a finished Notion PRD plus a linked Linear issue. The PRD defines one narrow product feature so Hedral's automated mechanical platform can build it.

## Non-negotiable rules

1. **One narrow feature per PRD.** Scope tight. Anything that belongs to a connected feature goes in Non-goals, named as a separate feature. Do not let the PRD sprawl.
2. **Inputs and Outputs are required sections.** The dev wants exactly what data comes in and what comes out. Never omit them.
3. **Write the PRD in Simplified Technical English (ASD-STE100).** Mandatory for all body text of the PRD. See the STE section below. This is not optional and it is not a style preference. Apply it to every section.
4. **No hyphens or em dashes in prose.** Bullets and code are fine. Technical compound terms are fine. This is a hard style rule for Victor.
5. **Problem Overview states the pain in concrete terms**, it does not teach the mechanics. Give the time cost, the count, and the failure mode. Facts do the persuading, not rhetoric. STE forbids ornate language, so the pain must come from specifics: how many rooms, how many hours, what goes wrong. The how lives in Key Features and the Decision Log.
6. **Ground every example in a real project and real numbers.** Ask which project if not given (TMD, Maxwell, etc.). Use issued schedule values where they exist.
7. **Always create the companion Linear issue** in the PRD Creation project, assigned to Victor, in the In Review state. The skill produces a finished draft, so the issue goes straight to review for Victor. Link the Notion page in the description and attach it.
8. **Keep tool/vendor names generic in the PRD body** (no brand names). Refer to reference tools generically.

## Simplified Technical English (mandatory)

Write every PRD in Simplified Technical English, the controlled language defined by the ASD-STE100 specification. STE was built so that technical documents read the same way to every reader, including readers whose first language is not English. A PRD is a build instruction for a developer, so the same goal applies: one reading, no ambiguity.

### Writing rules

**Words**
- One word has one meaning. One meaning has one word. Pick the term and keep it for the whole document.
- Never use a synonym for variety. If it is a zone in one paragraph, it is a zone in all of them. Do not switch to area, region, or group.
- Use a word in one part of speech only. If `test` is a noun in this PRD, do not also use it as a verb.
- Choose the simplest common word that is exact. Prefer `use` over `utilize`, `start` over `initiate`, `about` over `approximately`, `do` over `perform`, `find` over `determine`.
- No jargon, no idioms, no slang, no figures of speech. Keep approved technical names and engineering terms (VAV, outdoor air, static pressure, Zpz), because those are precise.

**Sentences**
- Descriptive sentences: 25 words maximum. Instructions: 20 words maximum.
- One idea per sentence. One instruction per sentence.
- Use active voice. Name the actor. Write `the solver computes the airflow`, not `the airflow is computed`.
- Use simple verb tenses only: simple present, simple past, simple future. Avoid perfect and progressive tenses.
- Avoid `-ing` verb forms (gerunds and participles). Use `the tool sizes the duct` rather than `sizing the duct is done by the tool`. Keep `-ing` only inside an established technical name.
- Keep articles. Write `the engineer opens the model`, not `engineer opens model`. Do not drop words to shorten a sentence.
- Noun clusters: three words maximum. Break up longer strings with prepositions. Write `the schedule for the terminal unit` rather than `terminal unit schedule table row`.

**Structure**
- Paragraphs: six sentences maximum.
- One topic per paragraph.
- Use a vertical list when a sequence has more than two steps or more than two conditions.
- Write instructions as commands: `Compute the total airflow.` Not `The total airflow should then be computed.`
- State the reason before the instruction when the reason matters.

### How STE interacts with the other rules
- STE and the no hyphen rule both hold. Neither overrides the other.
- STE does not soften the Problem Overview. It sharpens it. Replace `slow and error prone` with the actual number of hours and the actual failure.
- Inputs, Outputs, Key Features, and Key Flows benefit most, because those are the sections the developer builds from.
- Keep real numbers, tags, and units exactly as issued. STE controls the prose around them, never the data.

### Honest limit on compliance
The full approved vocabulary in ASD-STE100 is a defined dictionary of about 900 words. Apply the writing rules above faithfully. Where a word is uncertain, choose the simplest common word and then use that word consistently through the document. Do not claim certified STE compliance in the PRD itself.

### Quick before and after

Not STE:
> Leveraging the existing geometry pipeline, the tool will facilitate the automated determination of zone groupings, thereby significantly reducing the time-consuming and error-prone manual assignment process currently being performed by engineers.

STE:
> The engineer assigns rooms to zones by hand today. A 200 room project takes 6 hours. Mistakes in the assignment move into the equipment schedules. This feature groups the rooms into zones automatically. It uses the room geometry that the platform already holds.

## Reference data

**Notion**
- Mechanical PRD List data source: `collection://36d98640-5acd-80f0-95e0-000b52d93e5f`
- Type options: `Calculation`, `Visual`, `On Drawings`, `Connector`
- Phase options: `1 Win & Set Up`, `2 Design Criteria`, `3 Calculations`, `4 Equipment Selection`, `5 Layout & Modeling`, `6 Coordination`, `7 Sheet Production`, `8 Compliance & QA/QC`, `9 Construction Admin`
- PRD Progress options: `Complete`, `In Progress`, `Not Started`, `Dont use`. Set `In Progress` while drafting.
- Implementation Progress options: `Not Started`, `In Progress`, `In Review`, `Done`, `Blocked`, `backlog`. Set `Not Started` for a new PRD.

**Linear**
- Team Hedral-MEP: `2ac3c649-41f8-4ba3-ac45-1d92ccf1afef`
- PRD Creation project: `c280a969-aa16-43fc-a34b-46123ea776e5`
- Assignee Victor Colosi: `a16bfe31-25dd-44bf-befc-2c7364356476`
- State In Review (drafted, awaiting Victor's review): `ac0627ca-eb93-44ee-9f18-0754137cf84a`. The skill produces a finished draft, so the companion issue lands In Review assigned to Victor. Other states: Backlog `e9c51834-1c72-47bc-a7f7-42860802c0af` = Not Started, In Progress `91087068-f7d1-4cc9-a4a8-e7139d9f855b` = drafting, Done `c8bf65d7-3f87-4052-be64-ff1ada16e2fd` = PRD Complete and handed to dev.

## Workflow

### Step 1 — Gather and classify
From the user's input determine: the feature name, the one sentence of what it does, the reference project, the Type, and the Phase. If the reference project or Type is unclear, ask one short question; otherwise infer and state your assumption.

### Step 2 — Draft the PRD body
Fill the template below. Every section is required. Inputs and Outputs must be concrete. Ground claims in the project's real numbers.

Write the whole body in Simplified Technical English. Before you create the page, read the draft back and check it:
- Is any sentence longer than 25 words? Split it.
- Did you use two different words for the same thing? Pick one and replace the other.
- Is any sentence passive? Name the actor.
- Any `-ing` verb forms? Rewrite them.
- Any noun cluster longer than three words? Break it with a preposition.
- Any word that is fancy where a plain word works? Replace it.

### Step 3 — Create the Notion page
Create in the Mechanical PRD List data source with properties: Name = `<Feature name> - PRD`, Type, Phase, PRD Progress = `In Progress`, Implementation Progress = `Not Started`. Use an emoji icon that fits the feature.

### Step 4 — Create the companion Linear issue
Create in the PRD Creation project, team Hedral-MEP, assignee Victor, state In Review (the PRD is a finished draft ready for Victor to review). Title = the feature name without the `- PRD` suffix. Description = a short summary plus a markdown link to the Notion PRD. Then attach the Notion URL to the issue (Linear addAttachment).

### Step 5 — Report
Give the user the Notion URL and the Linear issue key and URL. Note any assumptions made (project, Type, Phase).

## PRD template (Notion markdown)

Every prose line below is written in STE. The bracketed guidance describes what to write, not the wording to copy.

```
<table>
<tr><td></td><td>**Revision History**</td><td></td><td></td></tr>
<tr><td>Issuance/Revision Date</td><td>Revision</td><td>Author</td><td>Approvers</td></tr>
<tr><td>YYYY.MM.DD</td><td>Initial Issuance</td><td>Victor Colosi</td><td></td></tr>
</table>
<table_of_contents color="gray"/>
## <span color="blue">Problem</span>
### Target Audience
One sentence: who the user is and the single capability this gives them, automatically, instead of by hand.
### Problem Overview
State the pain with numbers. How long the manual way takes, how many items the engineer touches, what goes wrong, and what falls out of sync. Short active sentences. End with one short paragraph that says what the feature does.
### Goals & Success
- Bulleted goals
Success is one sentence tied to a real project case with real numbers.
### Non-goals
1. Things that belong to connected features, each named as separate and deferred.
### Risks
- The ways the inputs or assumptions can be wrong.
## <span color="blue">Solution</span>
### Personas
**Mechanical Engineer:** what they set, review, and sign.
### Key Features
- The things to automate, with the underlying logic. Name engine functions where relevant.
### Inputs (required)
**From <source>:** the concrete values in, grouped by source.
### Outputs (required)
Numbered list of what is produced and what each output feeds downstream.
### Key Flows
**Primary flow:** input to result, arrow by arrow.
**Revision flow:** what recomputes when an input changes.
### Decision Log
- The scope calls, the method, the validation reference, and what is deferred.
<empty-block/>
```

## Notes
- One PRD per call unless asked for more.
- If the Linear or Notion tools are not loaded, load them first (notion create-pages, notion fetch, Linear createIssue, Linear addAttachment).
- Pass the current date into the revision history (do not guess it).
- After creating, if the feature clearly feeds or depends on other PRDs, offer to wire the Feeds / Depends on relations; do not set them silently.
