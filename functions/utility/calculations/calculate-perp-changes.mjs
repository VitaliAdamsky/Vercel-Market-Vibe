import { calcChange } from "../calculations/calculate-change.mjs";

export function calculatePerpChanges(perps) {
  if (!Array.isArray(perps)) {
    throw new Error("Expected 'perps' to be an array");
  }

  return perps.map((perp) => {
    const { symbol, data, ...meta } = perp;
    if (!Array.isArray(data)) return { symbol, ...meta, data: [] };

    let prev = null;

    const processed = data.map((entry) => {
      const changes = {
        quoteVolumeChange: calcChange(entry.quoteVolume, prev?.quoteVolume),
        volumeDeltaChange: calcChange(entry.volumeDelta, prev?.volumeDelta),
        closePriceChange: calcChange(entry.closePrice, prev?.closePrice),
        buyerRatioChange: calcChange(entry.buyerRatio, prev?.buyerRatio),
      };

      prev = entry;

      return {
        ...entry,
        ...changes,
      };
    });

    return {
      symbol,
      ...meta,
      data: processed.slice(1), // slice to remove first entry (no prev comparison)
    };
  });
}
