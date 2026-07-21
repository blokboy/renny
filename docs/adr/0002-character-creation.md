# ADR 0002: Character Creation flow, and provisional stats/mana placeholders

## Status

Accepted.

## Context

Issue #3 ("Character Creation Flow") asks for a player to create a named,
classed hero — sprite, retro name entry, a paged 7-class picker (tagline,
stat bars, bound familiar, spell list), and a recap screen — ending in a
persisted character record.

Two real gaps existed against this issue at implementation time:

1. **No backend.** There is no database/auth in this repo (see
   `package.json`) and none is in scope here.
2. **No stat/mana system yet, at implementation time.** Issue #5 ("Stats &
   Mana Economy") owns the real 5-stat mechanics and mana cost model, and was
   not implemented yet — Character Creation is one of its two blockers.
   (Since resolved; see docs/adr/0003-stats-mana-economy.md.) `prompt-quest-full-spec.md`
   §5.3 defines the 5 stats (STR/INT/WIS/SPD/LCK, superseding the design
   doc's original 4-bar display) and §5.1 defines the mana cost *shape*
   (`effective cost = baseline ÷ divisor`, baseline = 10% of max mana), but
   not concrete starting numbers per class.

Issue #4 (already shipped) hit an equivalent gap — undocumented hit/miss/fail
thresholds — and set the precedent this ADR follows: pick clearly-isolated,
documented placeholder constants rather than blocking on the owning issue or
guessing silently inline.

## Decision

### Persistence

A `CharacterRecord` (name, classId, sprite config, stats, startingHp,
startingMana, createdAt) is persisted to `localStorage` behind a 3-function
typed interface in `src/lib/character/storage.ts`:
`saveCharacter(record)`, `getCharacter()`, `clearCharacter()`. No database, no
auth — swapping in a real backend later means reimplementing these three
functions, not redesigning any caller.

### Stats and mana — provisional, isolated, documented

`src/lib/character/starting-stats.ts` hand-picks a starting `CharacterStats`
(1-20 scale) per class, chosen only to thematically differentiate the 7
classes on the creation screen's stat bars (e.g. Wizard highest INT but
lowest WIS, matching its "mana-starved" flavor; Knight high STR+WIS as the
tank/spine; Monk low INT/WIS, high SPD/LCK, matching its word-capped,
free-cast identity). Starting HP/mana are simple linear formulas off
STR/WIS respectively, also in that file.

**Update (issue #5):** these starting values shipped unchanged as the real,
official Level-1 stats — see docs/adr/0003-stats-mana-economy.md for the
growth curve and stat mechanics built on top of them.

`src/lib/character/mana.ts` implements the baseline-cost fraction (10% of
max mana, taken directly from `prompt-quest-full-spec.md` §5.1 — this part
is *not* a placeholder) and resolves each spell's `SpellCostModel` (`free` or
a multiplier on baseline) against a class's placeholder max mana pool into a
displayable number. The multipliers themselves
(`src/lib/character/classes.ts`) are a best-effort placeholder reading of
each named skill's prose description in the spec (e.g. Twin Strike's "2x
baseline, discounted" -> 1.5x) — exact numeric tuning is explicitly called
out as still-open in the spec itself (§9).

### Flow structure

Three routes, no dynamic segments (avoids Next.js 16's async `params`
entirely — nothing here needs a route param):

- `/character/create` — a single client-side wizard (`CreationWizard`)
  stepping through sprite customization -> retro name entry -> paged class
  picker. Draft state lives in React state only; nothing is persisted until
  the player confirms a class.
- On confirm: stats/HP/mana are computed from the chosen class, a
  `CharacterRecord` is built and saved via `saveCharacter`, and the router
  pushes to `/character/recap`.
- `/character/recap` — reads the record back via `getCharacter()` (proving
  the persistence layer is real, not just in-memory wizard state) and shows
  a placeholder "informed choice" recap. The Convocation (#10) doesn't exist
  yet, so this is generic copy, not real per-puzzle recap data — redirects
  back to `/character/create` if no character is found.

### Sprite

Sprite customization reuses the Asset Mapping system (#2/ADR 0001) directly
— `CharacterSpriteConfig`, `<CharacterSprite>`, the body/head/hair variant
registries, and `SwatchPicker`/`VariantPicker` — with zero new sprite
plumbing added here.

### Ward

Each class's Ward name/flavor/cost (from `prompt-quest-design-doc.md` §Ward
and issue #7) is shown on the class picker as a labeled line, explicitly not
wired to any status-effect logic — Ward *mechanics* belong entirely to issue
#7, which is still open.

## Consequences

- Character Creation ships without blocking on #5 or #10.
- `starting-stats.ts` and the per-spell cost multipliers in `classes.ts` are
  the two places a future #5 implementation should expect to touch/replace;
  everything else in `src/lib/character/` (types, storage, mana-fraction
  math) is expected to survive that change unmodified.
- Because nothing is persisted until class confirmation, refreshing mid-flow
  on `/character/create` loses in-progress sprite/name/class-browsing state.
  Acceptable for this issue's scope; not a design goal to fix here.

## Alternatives considered

- **Route-per-step** (`/character/create/name`, `/character/create/class`,
  ...) — rejected: would need a shared draft persisted across navigations
  (sessionStorage or a query-string-encoded draft) purely to survive
  browser navigation between steps that don't need to be independently
  linkable. A single client wizard component is simpler and sufficient for
  "paged" to mean "paging through the 7 classes," which is what the issue
  actually asks for.
- **Blocking on #5** for real stats/mana — rejected per the issue's own
  guidance and the #4 precedent; isolated placeholders are cheap to replace
  and unblock #3 today.
