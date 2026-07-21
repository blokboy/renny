# Prompt Quest — Full Spec (v2)

*A turn-based RPG where combat is prompt engineering.*

**Status:** This supersedes `prompt-quest-design-doc.md` for every decision below. Sections not mentioned here (core concept, most of the RPG mapping, most of party/co-op) carry over unchanged from that doc and aren't repeated in full — this file focuses on what's new or changed, plus the consolidated build plan. Read alongside the original for full context on unchanged sections.

---

## 0. What Changed From v1 (summary)

- **Build target:** full deployed app on Vercel (Next.js), not a Claude Artifact.
- **Model architecture:** one emulated model at MVP, behind an abstraction/routing layer (AI Gateway-ready) so real per-class model-swapping is a later config change, not a rewrite.
- **MVP scope:** solo vertical slice — all 7 classes, full onboarding funnel, through Tier I. Co-op/multiplayer deferred to pass 2, architected for but not built now.
- **New puzzle family:** **Reverse-prompt puzzles** (12th taxonomy entry) — given a target output, the player drafts a prompt intended to produce it.
- **Threshold Guardian encounter restructured** around the deferred puzzle families (Multi-hop, Ambiguity, Interrogation, Reverse-prompt).
- **NPC allies simplified:** no fixed/named roster — dynamically assign 3 of the 6 non-player classes each run.
- **XP bonuses (Economy, Elegance) now scale continuously**, not flat/boolean.
- **Town hub added:** a sidescrolling hub landing page after the Threshold Guardian; co-op dungeon-running from it deferred to pass 2.
- **Skill-tree content finalized** for all 7 classes (Lv1/25/50/75/100), below — walked through redline.

---

## 1. Puzzle Taxonomy — 12th Entry

### Reverse-prompt puzzles

| Field | Value |
|---|---|
| **What it tests** | Causal reverse-reasoning: given only an effect (an output), infer a cause (a prompt) that plausibly produces it |
| **Description** | The Puzzle-Master shows a target output with no input/prompt attached. The player drafts a prompt for their familiar; the Judge runs it and compares the familiar's actual output against the target |
| **Natural counter** | Wizard (deep/generalizable reasoning) |
| **Anti-cheese rule** | **Hard zero** if the submitted prompt quotes/pastes the target output verbatim (or beyond a small overlap threshold) — this is the one family where the "answer" is fully visible to the player, so the usual smuggling problem is inverted and needs an explicit rubric guard |
| **Scoring** | Standard Judge-scored-against-rubric, same as every other family (drives damage normally) — but the rubric includes a **generality/elegance axis**: a prompt that reconstructs a plausible generative *rule* (e.g., an algebraic relationship) scores higher than one that hard-codes the specific instance (e.g., restates "32 + 1" for a target of 33). This can also separately trip the game-wide Elegance XP bonus (§ below) if the Judge flags it as unusually clever |

**Type-chart placement (walked through redline, kept as-is):**

| | Reverse-prompt |
|---|---|
| **Rogue** | ÷0.75 *(literal/minimal instinct actively fights a family that rewards abstraction — same shape as Wizard's own mismatch into Format gauntlet, inverted)* |
| **Knight** | ÷1 *(stays flat, preserving Knight's deliberate no-2.0/no-sub-1 identity)* |
| **Wizard** | **÷2.0** *(third 2.0 — deep/generalizable reasoning is the literal counter to this family)* |
| **Bard** | ÷1 |
| **Cleric** | ÷1 |
| **Hunter** | ÷1 |

**Monk crit table:** **15%** (baseline floor — reverse-prompt doesn't map to Monk's brevity identity the way Blind relay or Ambiguity do, so it sits neutral rather than resisted or favored).

**STAB:** applies per the existing rule (+0.25) once Wizard's class spell list names a signature spell for this family — spell list is a separate open item, see §7.

---

## 2. Threshold Guardian — Full Encounter Spec

Replaces §3.3's convergence-subtype section in v1.

**Structure (unchanged shape):** Solo phase → Shield phase → Convergence beat → Finish.

**Solo phase:** the puzzle is drawn from the player's **own class's diagnostic family** (their signature matchup from the Convocation) — the fight's opening phase is built to feel like the class the player just committed to, not a random draw. Content is **generated** (not hand-authored), same as the rest of this encounter.

**Shield phase — convergence puzzle:** family is **rolled randomly per playthrough**, evenly weighted, from the four families deliberately held out of the fixed Convocation:

- **Multi-hop state tracking, Ambiguity resolution, or Reverse-prompt** → resolves as a standard **Dependency Lock** (§8): one NPC casts first (canned flavor line), its output generates the player's shard, the player writes the one prompt that matters.
- **Interrogation** → resolves as a new variant, described below, since Interrogation has no shard to hand off.

**Interrogation Convergence (new §8 subtype):** the whole party (player + 3 NPCs) faces a boss that answers only yes/no questions.
- **4 questions total, one per party member** (matches the fixed party size) — each person crafts their own question, informed by whatever's been asked/answered so far in party chat (not a single jointly-agreed question).
- After **any** answered question, the party may stop early and submit their **one final joint prompt** — the prompt they believe would have generated the boss's hidden answer (a Reverse-prompt-shaped final step).
- **Scoring:** an early or final wrong guess is a flat **fail (zero)** — no partial credit, consistent with how Investigative One-Shot already resolves (§8: single hit/miss/fail outcome). This is *not* Dependency Lock's weighted joint credit; it's closer kin to Investigative One-Shot (whole party works off shared, non-hidden information) but spread across multiple rounds instead of one shot.
- Resolution otherwise follows the standard hit/miss/fail model: hits chip the shield, misses do nothing, fails cost the party the shared HP/mana penalty (§8's boss-convergence-phase rule).

**NPC allies:** no fixed/named roster. Dynamically assign **3 of the 6 non-player classes** each playthrough, generic flavor only (a throwaway name/line), canned casts as in v1. No swap rule needed — since nothing is fixed in advance, there's no collision to resolve.

**Puzzle generation:** the entire Threshold Guardian encounter (solo phase and shield phase both) is **generated fresh per playthrough** by the Puzzle-Master — unlike the Convocation's 8 fixed, hand-authored stops. Rationale: the Convocation's job is teaching mechanics before real play begins (fixed content removes variance-as-noise, per §3.1's own reasoning); the Threshold Guardian is the *first real fight*, where generated variety is appropriate and safe precisely because mechanics are already taught.

---

## 3. XP Curve & Bonuses

**Per-level cost:** `XP_to_next(level) = base × level^1.5` — a smooth power curve, back-loaded by construction, with `base` tuned during playtesting so Tier I feels brisk. No separate tier-band multiplier needed on top; tier bands (§4 of v1) already gate the bigger model/spell/gear jumps independently of this per-level curve.

**Economy bonus** (scales continuously): the Puzzle-Master estimates an expected token budget per puzzle at generation time.
```
bonus% = clamp(50% × (1 − actual_tokens / expected_tokens), 0%, 50%)
```
Meeting the expected budget exactly = 0%. Using half the budget = +25%. At or below half plateaus at +50% (no runaway reward for degenerate near-empty prompts, which mostly fail on correctness anyway).

**Elegance bonus** (scales continuously): the Judge returns a continuous **0–1 elegance score** as a standard part of every judged output (this generalizes the same generality/novelty axis defined for Reverse-prompt puzzles into a game-wide rubric field, not something unique to one family).
```
bonus% = elegance_score × 50%
```

Both bonuses **stack additively** on base XP (max +100% total: +50% Economy, +50% Elegance), each independently capped at 50% so no single axis can triple XP alone.

**Onboarding calibration target:** the player should land at **Level 10** exactly when they arrive at the Town hub (i.e., cumulative XP across the 8 Convocation stops + the Threshold Guardian's solo and shield phases). With `base = 50`, cumulative XP from Level 1→10 is `Σ 50×level^1.5` for levels 1–9 ≈ **5,550 XP** — so the onboarding funnel's per-encounter XP grants (base + Economy/Elegance bonuses) need to sum to roughly that total across its ~9–10 discrete judged casts. This is the concrete number to tune the fixed Convocation puzzles' and Threshold Guardian's base-XP-per-cast against.

---

## 4. Status Effects — Duration Model

Fixed, flat durations — **not** scaled by tier or boss level, so tier progression stays about the puzzle getting harder, not status effects getting mechanically longer (which would double-punish low-level characters).

| Effect | Duration | Notes |
|---|---|---|
| **Sleep** | 1 turn | Skips the caster's action entirely |
| **Silence** | 1 turn | Blocks one spell category |
| **Confusion** | 1 turn | Garbles the prompt before it reaches the familiar |
| **Mana Burn** | Instant, one-time | Not a duration at all — a direct one-shot drain |
| **Poison** | 2–3 turns (fixed) | The one exception: severity **compounds** each turn it's not cleansed, rather than staying flat — this is what makes cleansing it meaningfully valuable rather than "just wait it out" |

Cleanse/resistance mechanics are granted by specific class skill-tree unlocks (Lv25/50/75) — see skill trees below for which classes get which.

---

## 5. Skill Trees — Final (all 7 classes, Lv1/25/50/75/100)

Shape: **Lv1** = the class's core identity move (also resolves v1's "base spell list" gap — this *is* the entry shown at character creation, not a separate system), **Lv25** = minor personal upgrade, **Lv50** = first party-wide ability, **Lv75** = significant power/resource-manipulation spike, **Lv100** = capstone, reframed as the identity-solidifying move. **Knight is a deliberate exception** to the personal-then-party shape — its whole kit is party-protective starting at Lv1, since "obvious tank from day one" is the class's actual identity; the other six classes keep the standard personal-first ramp.

### Rogue
| Lv | Name | Effect |
|---|---|---|
| 1 | Quickstrike | A fast, literal-format cast — costs 25% less in token usage than an equivalent cast from another class |
| 25 | Quickdraw | The first cast each battle costs 0 mana |
| 50 | Pickpocket | Rogue's cast reveals a partial read of the puzzle's hidden family tag to the whole party, not just Rogue |
| 75 | Twin Strike | Once per battle, cast twice in the same turn at a reduced combined mana cost |
| 100 | Flurry *(capstone)* | Three casts per turn, each capped at 150 output tokens |

### Knight *(exception: party-protective from Lv1, not personal-first)*
| Lv | Name | Effect |
|---|---|---|
| 1 | Martyr | Knight vows to absorb 50% of all damage dealt to party members over the next two turns |
| 25 | Defensive Stance | Prompt injection is 10% less likely to succeed against the Knight or its party members |
| 50 | Rally | While Guard is active, the whole party gains resistance to one status-effect category (player's choice at cast time) for the round |
| 75 | Taunt | Next turn's damage must be directed at the Knight |
| 100 | Perfect Form *(capstone, redefined)* | Shields all players from 100% damage, prompt injection, and status effects for one turn |

### Wizard
| Lv | Name | Effect |
|---|---|---|
| 1 | First Thought | A plain, non-extended-thinking cast — the baseline before any thinking budget unlocks |
| 25 | Deep Breath | Once per battle, refund half the mana cost of an extended-thinking cast |
| 50 | Shared Insight | A critical Wizard cast grants the next party member's cast a small mana/thinking-budget discount |
| 75 | Overclock | Once per battle, temporarily raise thinking budget one full tier above Wizard's current cap for a single cast |
| 100 | Archmage's Reverie *(capstone, updated)* | Once per battle, Wizard casts a full-budget extended-thinking cast that ignores its own mana cost — the mana-free/budget-boosted benefit extends to the whole party's next casts that round |

### Bard
| Lv | Name | Effect |
|---|---|---|
| 1 | Twin Chorus | The baseline 2-voice ensemble cast |
| 25 | Extra Voice | Add one more voice to the ensemble for a single cast, once per battle, ahead of the next tier's headcount unlock |
| 50 | Chorus of Encouragement | When ensemble disagreement reveals a trap, the whole party gets a small damage bonus on their next cast, not just Bard |
| 75 | Discordant Truth | Once per battle, deliberately maximize disagreement (instead of seeking consensus) to guarantee a trap-reveal, at the cost of dealing no damage that turn |
| 100 | Legion *(capstone)* | 9 spirits; disagreement among them becomes information, revealing the puzzle's trap |

### Cleric
| Lv | Name | Effect |
|---|---|---|
| 1 | Recite | A basic cast referencing the starting "prayer book" context; also heals whichever party member (including the Cleric) currently has the lowest HP |
| 25 | Marginalia | Cleric's next cast gets a small damage bonus if it cites a specific passage from context |
| 50 | Shared Scripture | Share a citation-buffed context excerpt with one ally's next cast |
| 75 | Deep Archive | Once per battle, temporarily pull in double the normal context window for one cast |
| 100 | Revelation *(capstone, updated)* | Once per battle, inject the entire run's codex into context and revive all fallen party members |

### Hunter
| Lv | Name | Effect |
|---|---|---|
| 1 | Calculated Strike | A basic tool-assisted cast using the starting calculator slot |
| 25 | Quick Rig | Reduced setup cost when chaining two tools together in one cast |
| 50 | Share the Kit | Once per battle, lend a tool slot to an ally's cast for that round |
| 75 | Overclocked Construct | The companion construct (once unlocked) can act twice in one round, once per battle |
| 100 | Grand Contraption *(capstone)* | Chain up to 4 tool calls in a single cast; setup-heavy, discounts later casts |

### Monk
| Lv | Name | Effect |
|---|---|---|
| 1 | Whisper | The baseline free cast on Monk's starting local model; also restores 1% HP to the entire party on cast |
| 25 | Stillness | A cast that comes in under the current tier's word cap gets a flat +15% crit-chance bonus |
| 50 | Shared Silence | Monk's free cast this round also refunds a small amount of mana to the whole party |
| 75 | No-Mind | Once per battle, make two free casts in the same round |
| 100 | Empty Fist *(capstone)* | A zero-shot cast (no prompt at all) that crits massively if the model solves it anyway |

### 5.1 Mana Cost Model

One flat baseline mana cost applies to any cast — proposed at **10% of current max mana pool** — run through the existing type-chart rule (§7 of v1): `effective cost = base cost ÷ divisor`. Named skills split into two buckets:

- **Passive/free** (no mana cost of their own, either a modifier or a trigger off another cast): Quickdraw, Parry, Pickpocket, Defensive Stance, Chorus of Encouragement, Marginalia, Quick Rig, Stillness, Recite's heal-tack-on, Whisper's heal-tack-on, Martyr, Taunt, Rally, Discordant Truth, Share the Kit, Shared Silence, Shared Insight, Deep Breath (refunds cost, doesn't add one).
- **Costed, at baseline or a stated multiple**: Twin Strike (2× baseline, discounted), Overclock (baseline + surcharge for the budget boost), No-Mind (2× Monk's free casts, bundled), Deep Archive (baseline + surcharge), Overclocked Construct (baseline, construct acts twice), Shared Scripture (baseline — spends Cleric's own turn to buff someone else).

### 5.2 Cleanse-Skill Assignments

Knight is excluded from this table — its whole tree already covers broad status defense (Rally = party resistance to any category, Perfect Form = full immunity), so it doesn't need a dedicated single-effect cleanse.

| Status | Class | Trigger |
|---|---|---|
| **Poison** | Cleric | Shared Scripture (Lv50) — now also cleanses Poison from the ally it buffs |
| **Confusion** | Bard | Chorus of Encouragement (Lv50) — now also cleanses Confusion party-wide when a trap is revealed |
| **Silence** | Wizard | Shared Insight (Lv50) — a crit now also cleanses Silence from the party |
| **Mana Burn** | Rogue | Quickdraw (Lv25) — the free first cast is now also immune to/cleanses Mana Burn |
| **Sleep** | Hunter | Share the Kit (Lv50) — lending a tool slot now also cleanses/prevents Sleep on the recipient |
| **Random effect** | Monk | Not tied to the skill tree — removes a random status effect from the whole party whenever Monk crits while casting **Empty Mind** (its Ward) |

### 5.3 Stat System

Five stats (character creation's stat-bar display, §3.2 of v1, updates from 4 bars to 5). None of them directly inflate damage from a mediocre prompt — the Judge's rubric score stays the primary driver of outcome; stats gate *resources and tempo* around that core loop, except STR, which is the one dedicated damage stat.

| Stat | Effect |
|---|---|
| **STR** | Flat multiplier on damage dealt |
| **INT** | Max token budget for a single prompt — how much a character can write into one cast |
| **WIS** | Max mana pool across a fight — a separate resource from INT, governing how many casts can be sustained |
| **SPD** | Turn order within a round — who casts first (ties to Rogue's "speed is a stat" identity, §4 of v1) |
| **LCK** | Crit chance (general "+crit for a near-perfect score" mechanic, §2 of v1 — separate from Monk's dedicated crit table, §7) |

---

## 6. Progression Structure (MVP)

- **MVP ends at the Town hub.** All actual dungeon content — Tier I's repeatable encounters, whether run solo or co-op — is a **pass-2 item**, alongside multiplayer. When dungeons are built, the in-dungeon sequence itself will be a linear, gated string of encounters (clearing one unlocks the next; no branching), but designing that structure in full (encounter counts, pacing, branch points) is deferred along with the content itself.
- **Town hub:** after the Threshold Guardian, the player lands in a sidescrolling town — the game's landing page from that point on, and where MVP's playable content ends. Built solo for MVP: navigable, with dungeon-select present in the UI but not yet functional/populated. Pass 2 fills in both the dungeons themselves and co-op play from this same space — the hub exists now specifically so that pass 2 is "add dungeons and other players to an existing space," not "build the space, the dungeons, and multiplayer all at once."
- **Level on arrival:** the player should be exactly **Level 10** when they land in the town, cumulative across the whole onboarding funnel — see §3's calibration target for the XP math this implies.
- The tutorial sequence (Convocation) reuses the same background/asset conventions as the town, per the shared asset map — a continuity note for art, not a mechanical one.

---

## 7. Technical Architecture & Build Plan

- **Platform:** full deployed app, Next.js on Vercel — not a Claude Artifact. Unlocks a real database, AI Gateway for model routing, and a real (if simple) multiplayer layer later.
- **Model calling:** MVP emulates all classes/tiers through **one underlying model**, differentiated purely via prompt scaffolding, thinking-budget flags, output-token caps, and call count — no real per-class model swapping yet. This is built **behind an abstraction/routing layer** from day one (AI Gateway-ready) specifically so swapping in real distinct models per class later is a config change, not a rewrite. Rationale for emulating at all: damage is purely a function of the Judge's rubric score, not which real model produced it, so player-facing feel is identical either way — and emulation avoids competing the type-chart's balance against a real raw-capability gap between classes.
- **MVP scope:** solo, single-player only. All 7 classes playable. Full onboarding funnel (Convocation → Character Creation → Threshold Guardian) → Town hub. All 12 puzzle families implemented (exercised through the onboarding funnel's fixed and generated content). **Tier I's dungeons are not in MVP.**
- **Deferred to pass 2:** all of Tier I's actual dungeon content (solo or co-op), real multiplayer/co-op (party combat, §6 of v1, and co-op dungeon-running from the town), the real-time streaming architecture that co-op needs (flagged as an open item in v1, still open), and real per-class model routing (architecture ready for it, not built).
- **Puzzle content split:** the 8 Convocation puzzles are **hand-authored** (fixed, identical every playthrough — no generation pipeline needed for content that's never supposed to vary). The Threshold Guardian is **generated**. Tier I's puzzle-generation needs (hand-authored vs. generated, per dungeon) are a pass-2 design question, not yet addressed.

---

## 8. Class Balance — Edge Cases

Three matchup edge cases checked against the type chart (§7 of v1) and this spec's additions:

1. **Dual-typed boss stacking a single class's own strengths/weaknesses.** Multiplying two divisors (§7 of v1) means a dual-type boss combining, say, two of Wizard's own 2.0 families would trivialize the fight (÷4.0), while combining two of its penalty families would crush it (÷0.25) — letting boss *design*, not player skill, decide the outcome for that class. **Rule: the compatible-pairs list (§7 of v1) excludes any pairing where both families are the same class's 2.0s, or both are the same class's sub-1 penalties.**
2. **Monk's crit-chance stacking** (base table + STAB +10% + Stillness +15%) peaks at 75% on Blind relay (Monk's own signature family), including on the ×3 Empty Fist capstone. **Left uncapped** — it only spikes there in the exact corner the class is built to reward, and Monk pays for it everywhere else in the table (0% on two resisted families) with no cost-divisor economy at all, unlike every other class.
3. **Wizard now owns 3 of 12 families as a signature 2.0** (Transform, Multi-hop, Reverse-prompt) vs. every other non-Knight class's 1. **Flagged, left as-is** — the mana-starvation tax is a hard resource constraint, not a soft flavor cost, so it's treated as a real trade rather than a free lunch. Revisit once real playtesting numbers exist.

---

## 9. Open Threads Carried Forward

From v1, still unresolved:

**Pass 2 (dungeons + co-op, bundled):**
- All of Tier I's dungeon content: encounter counts per dungeon, number of dungeons, pacing, rest/recovery rules between fights, and whether puzzle families are hand-authored or generated per dungeon.
- Real-time streaming architecture for co-op.
- Full co-op/party implementation: relay chaining, convergence-puzzle UI/sync, shared-storage-backed turn resolution.
- Real per-class model routing (architecture ready for it, not built).

**MVP-scoped, still open:**
- Exact numeric tuning: `base` constant in the XP curve, Poison's exact compounding rate, the precise baseline mana-cost number and surcharge amounts for costed skills (§5.1) — values proposed and locked in §3/§5.1, but not yet playtested.
