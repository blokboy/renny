"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterSprite, SceneBackground } from "@/components/assets";
import { TUTORIAL_ZONE_BACKGROUND } from "@/lib/assets";
import { getCharacter, saveCharacter, type CharacterRecord } from "@/lib/character";
import {
  applyGuardianCast,
  createInterrogationState,
  createInitialBattleState,
  GUARDIAN_MAX_HP,
  markGuardianComplete,
  recordInterrogationAnswer,
  submitInterrogationFinal,
  type GuardianBattleState,
  type GuardianCastResponse,
  type GuardianEncounter,
  type GuardianPuzzle,
  type InterrogationAnswer,
  type InterrogationState,
} from "@/lib/guardian";
import { applyXpGain } from "@/lib/xp";

interface BattleLogEntry {
  turn: number;
  phase: string;
  result: GuardianCastResponse;
}

const PHASE_LABEL: Record<GuardianBattleState["phase"], string> = {
  solo: "Solo phase",
  shield: "Shield phase",
  finish: "Finish",
  victory: "Guardian cleared",
  defeat: "Run ended",
};

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const percent = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="min-w-0">
      <div className="mb-1 flex justify-between gap-3 font-mono text-[11px] text-white/75">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden bg-black/60">
        <div className={`h-full ${tone} transition-[width] duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function GuardianBattle() {
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterRecord | null>(() => getCharacter());
  const [encounter, setEncounter] = useState<GuardianEncounter | null>(null);
  const [battle, setBattle] = useState<GuardianBattleState | null>(null);
  const [prompt, setPrompt] = useState("");
  const [question, setQuestion] = useState("");
  const [interrogation, setInterrogation] = useState<InterrogationState | null>(null);
  const [finalMode, setFinalMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<BattleLogEntry[]>([]);

  useEffect(() => {
    if (!character) router.replace("/character/create");
  }, [character, router]);

  async function beginEncounter() {
    if (!character) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/guardian/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: character.classId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The Puzzle-Master did not answer.");
      setEncounter(data);
      setBattle(createInitialBattleState(character.startingHp, character.startingMana));
      setInterrogation(data.shield.kind === "interrogation" ? createInterrogationState() : null);
      setFinalMode(false);
      setLog([]);
      setPrompt("");
      setQuestion("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not begin the encounter.");
    } finally {
      setLoading(false);
    }
  }

  function activePuzzle(): GuardianPuzzle | null {
    if (!encounter || !battle) return null;
    return battle.phase === "shield" ? encounter.shield.puzzle : encounter.soloPuzzle;
  }

  function currentPhaseLabel(): string {
    if (battle?.phase === "shield" && encounter?.shield.kind === "interrogation") {
      return "Interrogation";
    }
    if (battle?.phase === "shield") return "Dependency Lock";
    return battle ? PHASE_LABEL[battle.phase] : "";
  }

  async function askQuestion(event: React.FormEvent) {
    event.preventDefault();
    if (
      !encounter ||
      encounter.shield.kind !== "interrogation" ||
      !battle ||
      !interrogation ||
      !question.trim()
    ) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/guardian/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          hiddenAnswer: encounter.shield.hiddenAnswer,
          facts: encounter.shield.facts,
        }),
      });
      const data = (await response.json()) as { answer?: InterrogationAnswer; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error ?? "The Guardian did not answer.");
      const next = recordInterrogationAnswer(interrogation, question, data.answer);
      setInterrogation(next);
      setBattle({ ...battle, turn: battle.turn + 1 });
      setQuestion("");
      if (next.exchanges.length === 4) setFinalMode(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Guardian did not answer.");
    } finally {
      setLoading(false);
    }
  }

  async function cast(event: React.FormEvent) {
    event.preventDefault();
    const puzzle = activePuzzle();
    if (!character || !encounter || !battle || !puzzle || !prompt.trim()) return;
    if (battle.phase === "victory" || battle.phase === "defeat") return;
    const isInterrogationFinal =
      battle.phase === "shield" && encounter.shield.kind === "interrogation";

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/guardian/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          classId: character.classId,
          stats: character.stats,
          maxMana: character.startingMana,
          currentMana: battle.playerMana,
          phase: battle.phase,
          puzzle,
          mode: isInterrogationFinal ? "interrogation-final" : "standard",
        }),
      });
      const result = (await response.json()) as GuardianCastResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The cast failed.");

      const next = applyGuardianCast(battle, {
        outcome: result.resolution.outcome,
        damage: result.resolution.damage,
        manaCost: result.manaCost,
        xpGained: result.xpGained,
        terminalOnFail: isInterrogationFinal,
      });
      setBattle(next);
      setLog((entries) => [{ turn: battle.turn, phase: currentPhaseLabel(), result }, ...entries]);
      setPrompt("");
      if (isInterrogationFinal && interrogation) {
        setInterrogation(submitInterrogationFinal(interrogation));
      }

      const leveled = applyXpGain(
        { level: character.level, xp: character.xp },
        result.xpGained,
        character.classId,
      );
      const updated = { ...character, level: leveled.state.level, xp: leveled.state.xp, stats: leveled.stats };
      saveCharacter(updated);
      setCharacter(updated);

      if (next.phase === "victory") markGuardianComplete(encounter.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The cast failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!character) {
    return <main className="min-h-screen bg-zinc-950 p-8 text-zinc-400">Loading your hero...</main>;
  }

  if (!encounter || !battle) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
        <SceneBackground scene={TUTORIAL_ZONE_BACKGROUND} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-black/55" />
        <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-end px-6 py-10 sm:justify-center">
          <div className="max-w-xl border-l-4 border-emerald-300 bg-black/70 p-6 backdrop-blur-sm">
            <p className="font-mono text-xs text-emerald-300 uppercase">The shrine exit</p>
            <h1 className="mt-2 text-4xl font-bold">Threshold Guardian</h1>
            <p className="mt-4 leading-relaxed text-zinc-300">
              The gate reads your newly bound familiar and builds a trial around its defining
              strength. At half health, it will lock behind a party shield.
            </p>
            {error && <p className="mt-4 border border-red-400/40 bg-red-950/50 p-3 text-sm text-red-100">{error}</p>}
            <button
              type="button"
              onClick={beginEncounter}
              disabled={loading}
              className="mt-6 rounded bg-emerald-300 px-5 py-3 font-mono text-sm font-bold text-zinc-950 hover:bg-emerald-200 disabled:opacity-40"
            >
              {loading ? "Puzzle-Master generating..." : "Begin the fight"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const puzzle = activePuzzle();
  const terminal = battle.phase === "victory" || battle.phase === "defeat";

  return (
    <main className="min-h-screen bg-zinc-950 font-mono text-white">
      <section className="relative h-[44vh] min-h-72 overflow-hidden border-b border-white/15">
        <SceneBackground scene={TUTORIAL_ZONE_BACKGROUND} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-x-3 top-3 grid gap-3 bg-black/65 p-3 backdrop-blur-sm sm:grid-cols-3">
          <Meter label="GUARDIAN" value={battle.bossHp} max={GUARDIAN_MAX_HP} tone="bg-red-400" />
          <Meter label={character.name.toUpperCase()} value={battle.playerHp} max={character.startingHp} tone="bg-emerald-300" />
          <Meter label="MANA" value={battle.playerMana} max={character.startingMana} tone="bg-cyan-300" />
        </div>

        <div className="absolute inset-x-5 bottom-2 flex items-end justify-between sm:inset-x-16">
          <div className="flex flex-col items-center">
            <CharacterSprite config={character.sprite} size={118} className="drop-shadow-[0_8px_3px_rgba(0,0,0,0.7)]" />
            <span className="bg-black/70 px-2 py-1 text-xs">Lv {character.level} {character.name}</span>
          </div>
          <div className="flex flex-col items-center">
            <CharacterSprite config={{ presetId: "wraith-03" }} size={180} className="scale-x-[-1] drop-shadow-[0_10px_5px_rgba(0,0,0,0.8)]" />
            <span className="bg-red-950/90 px-3 py-1 text-xs">THRESHOLD GUARDIAN</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 border-b border-white/15 p-4 sm:p-6 lg:border-r lg:border-b-0">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-emerald-300 uppercase">Turn {battle.turn} · {currentPhaseLabel()}</p>
              <h1 className="mt-1 text-xl font-bold">{puzzle?.title ?? PHASE_LABEL[battle.phase]}</h1>
            </div>
            {battle.phase === "shield" && (
              <span className="border border-cyan-300/50 bg-cyan-950/50 px-3 py-1 text-xs text-cyan-100">SHIELD ACTIVE</span>
            )}
          </header>

          {!terminal && puzzle && (
            <>
              <div className="mt-4 border-y border-white/10 py-4 text-sm leading-relaxed">
                <p className="text-zinc-400">{puzzle.flavor}</p>
                {battle.phase === "shield" && encounter.shield.kind === "dependency-lock" && (
                  <div className="mt-4 border-l-2 border-cyan-300 bg-cyan-950/25 p-3">
                    <p className="text-xs text-cyan-200 uppercase">{encounter.shield.firstCaster.name} casts first</p>
                    <p className="mt-2 text-zinc-300">{encounter.shield.firstCaster.castLine}</p>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-cyan-100">{encounter.shield.npcOutput}</pre>
                  </div>
                )}
                <p className="mt-4 whitespace-pre-wrap text-white">{puzzle.brief}</p>
              </div>

              {battle.phase === "shield" && encounter.shield.kind === "interrogation" && interrogation && (
                <div className="mt-4 border-y border-white/10 py-4">
                  <p className="text-xs text-zinc-500 uppercase">Party chat</p>
                  {interrogation.exchanges.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-600">No questions answered yet.</p>
                  ) : (
                    <ol className="mt-3 space-y-3">
                      {interrogation.exchanges.map((exchange) => {
                        const speaker = exchange.speakerIndex === 0
                          ? character.name
                          : encounter.allies[exchange.speakerIndex - 1].name;
                        return (
                          <li key={exchange.speakerIndex} className="border-l-2 border-cyan-300/50 pl-3 text-sm">
                            <p className="text-xs text-cyan-200">{speaker}</p>
                            <p className="mt-1 text-zinc-300">{exchange.question}</p>
                            <p className="mt-1 font-bold uppercase text-white">Guardian: {exchange.answer}</p>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              )}

              {battle.phase === "shield" &&
              encounter.shield.kind === "interrogation" &&
              interrogation &&
              !finalMode ? (
                <form onSubmit={askQuestion} className="mt-4">
                  <label htmlFor="guardian-question" className="text-xs text-zinc-500 uppercase">
                    Question {interrogation.exchanges.length + 1} of 4 · {interrogation.exchanges.length === 0
                      ? character.name
                      : encounter.allies[interrogation.exchanges.length - 1].name}
                  </label>
                  <textarea
                    id="guardian-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={loading}
                    placeholder="Author this party member's yes/no question..."
                    className="mt-2 min-h-28 w-full resize-y border border-white/20 bg-black/45 p-3 text-sm leading-relaxed outline-none focus:border-cyan-300 disabled:opacity-50"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Each party member gets one question.</span>
                    <div className="flex flex-wrap gap-2">
                      {interrogation.exchanges.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFinalMode(true)}
                          className="rounded border border-emerald-300/60 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10"
                        >
                          Submit joint prompt
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !question.trim()}
                        className="rounded bg-cyan-300 px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-cyan-200 disabled:opacity-35"
                      >
                        {loading ? "Asking..." : "Ask Guardian"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={cast} className="mt-4">
                  <label htmlFor="guardian-prompt" className="text-xs text-zinc-500 uppercase">
                    {battle.phase === "shield" && encounter.shield.kind === "interrogation"
                      ? "Final joint prompt"
                      : "Your cast"}
                  </label>
                  <textarea
                    id="guardian-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    disabled={loading}
                    placeholder={battle.phase === "shield" && encounter.shield.kind === "interrogation"
                      ? "Write one prompt intended to reproduce the hidden answer..."
                      : "Write the prompt your familiar will receive..."}
                    className="mt-2 min-h-32 w-full resize-y border border-white/20 bg-black/45 p-3 text-sm leading-relaxed outline-none focus:border-emerald-300 disabled:opacity-50"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Family: {puzzle.family}</span>
                    <div className="flex flex-wrap gap-2">
                      {battle.phase === "shield" &&
                        encounter.shield.kind === "interrogation" &&
                        interrogation &&
                        interrogation.exchanges.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setFinalMode(false)}
                            className="rounded border border-white/20 px-4 py-2 text-xs hover:bg-white/10"
                          >
                            Ask another question
                          </button>
                        )}
                      <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="rounded bg-emerald-300 px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-200 disabled:opacity-35"
                      >
                        {loading
                          ? "Casting..."
                          : battle.phase === "shield" && encounter.shield.kind === "interrogation"
                            ? "Commit final prompt"
                            : "Cast"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

          {terminal && (
            <div className="mt-6 border-l-4 border-emerald-300 bg-black/35 p-5">
              <h2 className="text-2xl font-bold">{battle.phase === "victory" ? "The shield goes dark." : "The gate rejects the run."}</h2>
              <p className="mt-2 text-sm text-zinc-300">
                {battle.phase === "victory"
                  ? `The Guardian falls. ${battle.totalXpGained} XP was earned in the fight.`
                  : "Begin a fresh generated run to challenge the gate again."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {battle.phase === "defeat" && (
                  <button type="button" onClick={beginEncounter} className="rounded bg-emerald-300 px-4 py-2 text-sm font-bold text-zinc-950">Generate a new run</button>
                )}
                {battle.phase === "victory" && (
                  <button type="button" onClick={() => router.push("/")} className="rounded bg-emerald-300 px-4 py-2 text-sm font-bold text-zinc-950">Leave the shrine</button>
                )}
              </div>
            </div>
          )}

          {error && <p className="mt-4 border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}
        </div>

        <aside className="min-w-0 p-4 sm:p-6">
          <p className="text-xs text-zinc-500 uppercase">Party</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[{ classId: "player", name: character.name }, ...encounter.allies].map((member) => (
              <div key={member.classId} className="min-w-0 border border-white/15 bg-white/5 p-2 text-center">
                <span className="block text-lg text-cyan-200">{member.name.slice(0, 1)}</span>
                <span className="block truncate text-[10px] text-zinc-400" title={member.name}>{member.name}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-zinc-500 uppercase">Combat log</p>
          <div className="mt-2 max-h-80 space-y-3 overflow-y-auto pr-1">
            {log.length === 0 && <p className="text-sm text-zinc-600">No casts resolved yet.</p>}
            {log.map((entry) => (
              <div key={entry.turn} className="border-l-2 border-white/20 pl-3 text-xs">
                <p className="text-zinc-500">Turn {entry.turn} · {entry.phase}</p>
                <p className="mt-1 font-bold text-white">
                  {entry.result.resolution.outcome.toUpperCase()}
                  {entry.result.resolution.isCrit ? " · CRIT" : ""} · {entry.result.resolution.damage} damage
                </p>
                <p className="mt-1 text-zinc-400">{entry.result.judge.feedback}</p>
                <p className="mt-1 text-emerald-300">+{entry.result.xpGained} XP · -{entry.result.manaCost} mana</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
