/**
 * Public entry point for Renny's shared visual asset system.
 *
 * Consumers (Character Creation, the Convocation, the Town Hub) should
 * import everything they need from `@/lib/assets` rather than reaching into
 * individual files. See docs/adr/0001-shared-asset-system.md for the full
 * contract and usage guidance.
 */
export * from "./types";
export * from "./swatches";
export * from "./sprite-variants";
export * from "./backgrounds";
export * from "./tiles";
