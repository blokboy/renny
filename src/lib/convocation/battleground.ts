import {
  CASTLE_BACKGROUND,
  DEAD_FOREST_BACKGROUND,
  MINOTAUR_PRESETS,
  TERRACE_BACKGROUND,
  THRONE_ROOM_BACKGROUND,
} from "@/lib/assets";
import type { BackgroundScene } from "@/lib/assets";

export interface ConvocationBattleground {
  scene: BackgroundScene;
  enemyPresetId: string;
}

const [MINOTAUR_1, MINOTAUR_2, MINOTAUR_3] = MINOTAUR_PRESETS.map((preset) => preset.id);

/**
 * Stops are grouped in pairs across the Convocation's four battlegrounds
 * (issue #25's staging spec): 1-2 -> Dead Forest, 3-4 -> Castle, 5-6 ->
 * Terrace, 7-8 -> Throne Room. The Minotaur variant cycles 1 -> 2 -> 3 -> 1
 * across those same four groups.
 */
const BATTLEGROUND_GROUPS: ConvocationBattleground[] = [
  { scene: DEAD_FOREST_BACKGROUND, enemyPresetId: MINOTAUR_1 },
  { scene: CASTLE_BACKGROUND, enemyPresetId: MINOTAUR_2 },
  { scene: TERRACE_BACKGROUND, enemyPresetId: MINOTAUR_3 },
  { scene: THRONE_ROOM_BACKGROUND, enemyPresetId: MINOTAUR_1 },
];

const STOPS_PER_GROUP = 2;

/** Looks up the battleground (scene + enemy preset) staged for a Convocation stop id (1-8). */
export function getBattlegroundForStop(stopId: number): ConvocationBattleground {
  const group = BATTLEGROUND_GROUPS[Math.floor((stopId - 1) / STOPS_PER_GROUP)];
  if (!group) {
    throw new Error(`No battleground registered for stop id ${stopId}`);
  }
  return group;
}
