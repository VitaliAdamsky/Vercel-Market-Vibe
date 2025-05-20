import { getDataFromRedis } from "../utility/redis/get-data-from-redis.mjs";
import { dataKeys } from "../utility/redis/data-keys.mjs";
import { blackListData } from "./black-list-data.mjs";

export const fetchDominantCoinsFromRedis = async (coinType, dominant) => {
  const coins = await getDataFromRedis(dataKeys.coins);

  const isBinance = (coin) => coin.exchanges?.includes("Binance");
  const isBybit = (coin) => coin.exchanges?.includes("Bybit");

  let binanceCoins, bybitCoins;

  if (dominant === "Binance") {
    binanceCoins = coins.filter(isBinance);
    bybitCoins = coins.filter((c) => isBybit(c) && !isBinance(c));
  } else if (dominant === "Bybit") {
    bybitCoins = coins.filter(isBybit);
    binanceCoins = coins.filter((c) => isBinance(c) && !isBybit(c));
  } else {
    throw new Error("Invalid dominant exchange specified");
  }

  if (coinType === "perp") {
    console.log("dataKey By Check", dataKeys.failedBybitPerpSymbols);
    const failedBinancePerpSymbols = blackListData.perp.binance;
    const failedBybitPerpSymbols = blackListData.perp.bybit;

    const binancePerpCoins = binanceCoins
      .filter((c) => !failedBinancePerpSymbols.includes(c.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    const bybitPerpCoins = bybitCoins
      .filter((c) => !failedBybitPerpSymbols.includes(c.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    return {
      binancePerpCoins,
      bybitPerpCoins,
    };
  } else if (coinType === "spot") {
    const failedBinanceSpotSymbols = blackListData.spot.binance;
    const failedBybitSpotSymbols = blackListData.spot.bybit;

    const binanceSpotCoins = binanceCoins
      .filter((c) => !failedBinanceSpotSymbols.includes(c.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    const bybitSpotCoins = bybitCoins
      .filter((c) => !failedBybitSpotSymbols.includes(c.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    return {
      binanceSpotCoins,
      bybitSpotCoins,
    };
  } else {
    throw new Error("Invalid coin type specified");
  }
};
