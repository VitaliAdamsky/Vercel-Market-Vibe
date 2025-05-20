import { getDataFromRedis } from "../utility/redis/get-data-from-redis.mjs";
import { dataKeys } from "../utility/redis/data-keys.mjs";
import { fetchDominantCoinsFromRedis } from "./fetch-dominant-coins-from-redis.mjs";

export const fetchSortedCoinsFromRedis = async (coinType, dominant) => {
  const dominantCoinsObject = await fetchDominantCoinsFromRedis(
    coinType,
    dominant
  );

  const dominantCoins = Object.values(dominantCoinsObject).flat();
  console.log("dominantCoins", dominantCoins.length);

  let failedSymbols = [];

  if (coinType === "perp") {
    const [failedBinance, failedBybit] = await Promise.all([
      getDataFromRedis(dataKeys.failedBinancePerpSymbols),
      getDataFromRedis(dataKeys.failedBybitPerpSymbols),
    ]);
    failedSymbols = [...failedBinance, ...failedBybit];
  } else if (coinType === "spot") {
    const [failedBinance, failedBybit] = await Promise.all([
      getDataFromRedis(dataKeys.failedBinanceSpotSymbols),
      getDataFromRedis(dataKeys.failedBybitSpotSymbols),
    ]);
    failedSymbols = [...failedBinance, ...failedBybit];
  } else {
    throw new Error(
      `Invalid coinType: '${coinType}'. Only 'perp' or 'spot' allowed.`
    );
  }
  console.log("failedSymbols", failedSymbols.length);
  const sortedCoins = dominantCoins
    .filter((coin) => !failedSymbols.includes(coin.symbol))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return sortedCoins;
};
