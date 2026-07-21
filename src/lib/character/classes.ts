import type { ClassDefinition } from "./types";

/**
 * The 7 playable classes' static flavor + spell-list data, sourced from
 * `prompt-quest-design-doc.md` §4 (taglines, familiar lineage, capstones) and
 * `prompt-quest-full-spec.md` §5 (finalized Lv1/25/50/75/100 skill trees) and
 * §Ward (each class's unique Ward spell, named in issue #7 — Ward *mechanics*
 * aren't built yet, this is flavor/name only).
 *
 * Spell/Ward mana costs use `SpellCostModel` — either `free` or a multiplier
 * on the baseline cost (10% of max mana, `prompt-quest-full-spec.md` §5.1).
 * Multipliers below are a best-effort placeholder reading of each skill's
 * prose description (e.g. "2x baseline, discounted" -> 1.5), since exact
 * numeric tuning is explicitly still open per the spec. See
 * `src/lib/character/mana.ts` for how these resolve to a displayed number,
 * and docs/adr/0002-character-creation.md for the full accounting of every
 * choice made here.
 */
export const CLASSES: ClassDefinition[] = [
  {
    id: "rogue",
    name: "Rogue",
    tagline: "Haiku lineage. Speed is a stat.",
    familiar:
      "Bound to the Haiku line — fast, cheap, and built for volume. Progresses Haiku 3 -> 3.5 -> 4.5 -> 4.5 with prefill combo openers -> two casts per turn.",
    spells: [
      {
        level: 1,
        name: "Quickstrike",
        description:
          "A fast, literal-format cast — costs 25% less in token usage than an equivalent cast from another class.",
        cost: { kind: "baseline", multiplier: 0.75 },
      },
      {
        level: 25,
        name: "Quickdraw",
        description: "The first cast each battle costs 0 mana.",
        cost: { kind: "free" },
      },
      {
        level: 50,
        name: "Pickpocket",
        description:
          "Rogue's cast reveals a partial read of the puzzle's hidden family tag to the whole party, not just Rogue.",
        cost: { kind: "free" },
      },
      {
        level: 75,
        name: "Twin Strike",
        description: "Once per battle, cast twice in the same turn at a reduced combined mana cost.",
        cost: { kind: "baseline", multiplier: 1.5 },
      },
      {
        level: 100,
        name: "Flurry",
        description: "Capstone. Three casts per turn, each capped at 150 output tokens.",
        cost: { kind: "baseline", multiplier: 2 },
      },
    ],
    ward: {
      name: "Smoke Ward",
      description:
        "Cheap and fast, matching Rogue's speed identity — minimal mana for a quick \"disregard embedded text\" instruction.",
      cost: { kind: "baseline", multiplier: 0.5 },
    },
  },
  {
    id: "knight",
    name: "Knight",
    tagline: "Sonnet lineage. The reliable spine.",
    familiar:
      "Bound to the Sonnet line — the reliable spine. Progresses Sonnet 3.5 -> 3.7 -> 4 -> 4.5 -> 4.6, unlocking a Precise/Aggressive/Guard stance system.",
    spells: [
      {
        level: 1,
        name: "Martyr",
        description: "Knight vows to absorb 50% of all damage dealt to party members over the next two turns.",
        cost: { kind: "free" },
      },
      {
        level: 25,
        name: "Defensive Stance",
        description: "Prompt injection is 10% less likely to succeed against the Knight or its party members.",
        cost: { kind: "free" },
      },
      {
        level: 50,
        name: "Rally",
        description:
          "While Guard is active, the whole party gains resistance to one status-effect category (player's choice at cast time) for the round.",
        cost: { kind: "free" },
      },
      {
        level: 75,
        name: "Taunt",
        description: "Next turn's damage must be directed at the Knight.",
        cost: { kind: "free" },
      },
      {
        level: 100,
        name: "Perfect Form",
        description:
          "Capstone. Shields all players from 100% damage, prompt injection, and status effects for one turn.",
        cost: { kind: "baseline", multiplier: 2 },
      },
    ],
    ward: {
      name: "Shield Wall",
      description:
        "Baked into the Guard stance itself rather than a separate cast — a Knight can hold Guard across multiple turns and extend it to protect an ally's next cast.",
      cost: { kind: "free" },
    },
  },
  {
    id: "wizard",
    name: "Wizard",
    tagline: "Opus lineage. Thinking budget is spell slots.",
    familiar:
      "Bound to the Opus line — notoriously mana-starved at low tiers. Progresses Opus 4 (no thinking) -> 4.1 (+2k thinking tokens) -> 4.5 (+8k) -> 4.8 (+32k) -> Fable 5.",
    spells: [
      {
        level: 1,
        name: "First Thought",
        description: "A plain, non-extended-thinking cast — the baseline before any thinking budget unlocks.",
        cost: { kind: "baseline", multiplier: 1 },
      },
      {
        level: 25,
        name: "Deep Breath",
        description: "Once per battle, refund half the mana cost of an extended-thinking cast.",
        cost: { kind: "free" },
      },
      {
        level: 50,
        name: "Shared Insight",
        description:
          "A critical Wizard cast grants the next party member's cast a small mana/thinking-budget discount.",
        cost: { kind: "free" },
      },
      {
        level: 75,
        name: "Overclock",
        description:
          "Once per battle, temporarily raise thinking budget one full tier above Wizard's current cap for a single cast.",
        cost: { kind: "baseline", multiplier: 1.5 },
      },
      {
        level: 100,
        name: "Archmage's Reverie",
        description:
          "Capstone. Once per battle, casts a full-budget extended-thinking cast that ignores its own mana cost — the benefit extends to the whole party's next casts that round.",
        cost: { kind: "free" },
      },
    ],
    ward: {
      name: "Ward of Clarity",
      description:
        "An extended-thinking cast that reasons through why the embedded text is untrustworthy before discarding it — costs more mana but is stronger and longer-lasting.",
      cost: { kind: "baseline", multiplier: 1.75 },
    },
  },
  {
    id: "bard",
    name: "Bard",
    tagline: "Fixed cheap model, scaling headcount.",
    familiar:
      "Bound to a chorus of cheap voices, not one model — 2x Haiku vote -> 3x -> 5x with role-differentiated personas -> 7x with a Sonnet \"herald\" adjudicating.",
    spells: [
      {
        level: 1,
        name: "Twin Chorus",
        description: "The baseline 2-voice ensemble cast.",
        cost: { kind: "baseline", multiplier: 1 },
      },
      {
        level: 25,
        name: "Extra Voice",
        description:
          "Add one more voice to the ensemble for a single cast, once per battle, ahead of the next tier's headcount unlock.",
        cost: { kind: "baseline", multiplier: 1.25 },
      },
      {
        level: 50,
        name: "Chorus of Encouragement",
        description:
          "When ensemble disagreement reveals a trap, the whole party gets a small damage bonus on their next cast, not just Bard.",
        cost: { kind: "free" },
      },
      {
        level: 75,
        name: "Discordant Truth",
        description:
          "Once per battle, deliberately maximize disagreement (instead of seeking consensus) to guarantee a trap-reveal, at the cost of dealing no damage that turn.",
        cost: { kind: "free" },
      },
      {
        level: 100,
        name: "Legion",
        description:
          "Capstone. 9 spirits; disagreement among them becomes information, revealing the puzzle's trap.",
        cost: { kind: "baseline", multiplier: 2 },
      },
    ],
    ward: {
      name: "Counter-Chorus",
      description:
        "The ensemble cross-checks itself for injected content, which doubles as detection — a Bard's Ward often reveals that an injection was attempted at all, even before it lands.",
      cost: { kind: "baseline", multiplier: 1 },
    },
  },
  {
    id: "cleric",
    name: "Cleric",
    tagline: "Fixed mid model, scaling scripture (context/RAG).",
    familiar:
      "Bound to a Sonnet-class model with a growing \"prayer book\" — 4k context -> 32k -> 200k with retrieval over past battles -> 1M context -> retrieval with required citations.",
    spells: [
      {
        level: 1,
        name: "Recite",
        description:
          "A basic cast referencing the starting prayer-book context; also heals whichever party member (including the Cleric) currently has the lowest HP.",
        cost: { kind: "baseline", multiplier: 1 },
      },
      {
        level: 25,
        name: "Marginalia",
        description: "Cleric's next cast gets a small damage bonus if it cites a specific passage from context.",
        cost: { kind: "free" },
      },
      {
        level: 50,
        name: "Shared Scripture",
        description: "Share a citation-buffed context excerpt with one ally's next cast.",
        cost: { kind: "baseline", multiplier: 1 },
      },
      {
        level: 75,
        name: "Deep Archive",
        description: "Once per battle, temporarily pull in double the normal context window for one cast.",
        cost: { kind: "baseline", multiplier: 1.5 },
      },
      {
        level: 100,
        name: "Revelation",
        description:
          "Capstone. Once per battle, inject the entire run's codex into context and revive all fallen party members.",
        cost: { kind: "baseline", multiplier: 2 },
      },
    ],
    ward: {
      name: "Sealed Scripture",
      description:
        "Treats the puzzle text as \"unverified scripture\" against the Cleric's own retrieved context, matching the class's retrieval identity.",
      cost: { kind: "baseline", multiplier: 1 },
    },
  },
  {
    id: "hunter",
    name: "Hunter",
    tagline: "Scaling tool slots, not model.",
    familiar:
      "Bound to a Sonnet-class model armed with growing tool access — a calculator, then code execution, then web search, then a persistent memory scratchpad, then a Haiku \"construct\" companion.",
    spells: [
      {
        level: 1,
        name: "Calculated Strike",
        description: "A basic tool-assisted cast using the starting calculator slot.",
        cost: { kind: "baseline", multiplier: 1 },
      },
      {
        level: 25,
        name: "Quick Rig",
        description: "Reduced setup cost when chaining two tools together in one cast.",
        cost: { kind: "free" },
      },
      {
        level: 50,
        name: "Share the Kit",
        description: "Once per battle, lend a tool slot to an ally's cast for that round.",
        cost: { kind: "free" },
      },
      {
        level: 75,
        name: "Overclocked Construct",
        description: "The companion construct (once unlocked) can act twice in one round, once per battle.",
        cost: { kind: "baseline", multiplier: 1 },
      },
      {
        level: 100,
        name: "Grand Contraption",
        description: "Capstone. Chain up to 4 tool calls in a single cast; setup-heavy, discounts later casts.",
        cost: { kind: "baseline", multiplier: 2 },
      },
    ],
    ward: {
      name: "Trap Sense",
      description:
        "A lightweight tool-assisted check that flags suspicious embedded strings before casting, with a chance to reflect the injection back at the enemy.",
      cost: { kind: "baseline", multiplier: 0.75 },
    },
  },
  {
    id: "monk",
    name: "Monk",
    tagline: "Open-weights ascetic. No API cost, ever.",
    familiar:
      "Bound to an open-weights local model — 3B -> 8B -> 32B -> 70B quantized -> 100B+ MoE. Weakest model at every tier; all casts free, so the player's prompting carries everything.",
    spells: [
      {
        level: 1,
        name: "Whisper",
        description: "The baseline free cast on Monk's starting local model; also restores 1% HP to the entire party on cast.",
        cost: { kind: "free" },
      },
      {
        level: 25,
        name: "Stillness",
        description: "A cast that comes in under the current tier's word cap gets a flat +15% crit-chance bonus.",
        cost: { kind: "free" },
      },
      {
        level: 50,
        name: "Shared Silence",
        description: "Monk's free cast this round also refunds a small amount of mana to the whole party.",
        cost: { kind: "free" },
      },
      {
        level: 75,
        name: "No-Mind",
        description: "Once per battle, make two free casts in the same round.",
        cost: { kind: "free" },
      },
      {
        level: 100,
        name: "Empty Fist",
        description:
          "Capstone. A zero-shot cast (no prompt at all) that crits massively if the model solves it anyway.",
        cost: { kind: "free" },
      },
    ],
    ward: {
      name: "Empty Mind",
      description:
        "Free, matching Monk's zero-cost casts, and the simplest possible ward — refuses to engage with anything beyond the literal puzzle statement. Double-edged: it also ignores legitimate context the puzzle might have needed.",
      cost: { kind: "free" },
    },
  },
];

export function getClassDefinition(classId: string): ClassDefinition {
  const found = CLASSES.find((classDef) => classDef.id === classId);
  if (!found) {
    throw new Error(`Unknown class id: "${classId}"`);
  }
  return found;
}
