import type { TileType } from "./types";

/** Fixed tile size (px) for the shared tileset convention. */
export const TILE_SIZE = 32;

/** A small flat-color tile registry, usable for simple ground/collision maps. */
export const TILE_TYPES: TileType[] = [
  { id: "grass", label: "Grass", color: "#5f9a4a" },
  { id: "path", label: "Path", color: "#c9a876" },
  { id: "water", label: "Water", color: "#3d7dbf" },
  { id: "stone", label: "Stone", color: "#8a8a8a" },
  { id: "void", label: "Void", color: "transparent" },
];

/** Looks up a tile type by id, throwing on an unknown id. */
export function getTileType(id: string): TileType {
  const found = TILE_TYPES.find((tile) => tile.id === id);
  if (!found) {
    throw new Error(`Unknown tile type id: "${id}"`);
  }
  return found;
}

/** A small demo tile map (rows of tile ids), used by the debug/demo page. */
export const DEMO_TILE_MAP: string[][] = [
  ["grass", "grass", "grass", "path", "path", "grass", "grass", "grass"],
  ["grass", "stone", "grass", "path", "path", "grass", "water", "water"],
  ["grass", "stone", "grass", "path", "path", "grass", "water", "water"],
  ["grass", "grass", "grass", "path", "path", "grass", "grass", "grass"],
];
