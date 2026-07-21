/**
 * Public entry point for Renny's Character Creation domain layer (issue #3).
 * Consumers should import from `@/lib/character` rather than reaching into
 * individual files. See docs/adr/0002-character-creation.md for the full
 * contract and the provisional-placeholder notes on stats/mana.
 */
export * from "./types";
export * from "./classes";
export * from "./skill-trees";
export * from "./starting-stats";
export * from "./mana";
export * from "./tokens";
export * from "./storage";
