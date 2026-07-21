import { TILE_SIZE, getTileType } from "@/lib/assets";

export interface TileGridProps {
  tileMap: string[][];
  className?: string;
}

/** Renders a tile map from the shared tileset convention as flat colored cells. */
export function TileGrid({ tileMap, className }: TileGridProps) {
  const columnCount = tileMap[0]?.length ?? 0;

  return (
    <div
      className={`inline-grid ${className ?? ""}`}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, ${TILE_SIZE}px)`,
        gridAutoRows: `${TILE_SIZE}px`,
      }}
    >
      {tileMap.flatMap((row, rowIndex) =>
        row.map((tileId, columnIndex) => {
          const tile = getTileType(tileId);
          return (
            <div
              key={`${rowIndex}-${columnIndex}`}
              title={tile.label}
              style={{ backgroundColor: tile.color }}
            />
          );
        })
      )}
    </div>
  );
}
