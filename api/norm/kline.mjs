import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";

import { normalizeKlineData } from "../../functions/normalize/normalize-kline-data.mjs";
import { calculateExpirationTime } from "../../functions/utility/calculations/calculate-expiration-time.mjs";
import { validateRequestParams } from "../../functions/utility/validators/validate-request-params.mjs";
import { fetchDominantCoinsFromRedis } from "../../functions/coins/fetch-dominant-coins-from-redis.mjs";

import { dataKeys } from "../../functions/utility/redis/data-keys.mjs";
import { handleFetchWithFailureTracking } from "../../functions/utility/handle-fetch-with-failure-tracking.mjs";
import { calculatePerpChanges } from "../../functions/utility/calculations/calculate-perp-changes.mjs";

export const config = {
  runtime: "edge",
  regions: ["cdg1"],
};

export default async function handler(request) {
  try {
    const params = validateRequestParams(request.url);

    if (params instanceof Response) {
      return params;
    }

    const { timeframe, dominant, limit, coinType } = params;
    console.log("params", params);

    const { binancePerpCoins, bybitPerpCoins } =
      await fetchDominantCoinsFromRedis(coinType, dominant);

    console.log(dataKeys);
    const [binancePerps, bybitPerps] = await Promise.all([
      handleFetchWithFailureTracking(
        fetchBinancePerpKlines,
        binancePerpCoins,
        timeframe,
        limit,
        dataKeys.failedBinancePerpSymbols
      ),
      handleFetchWithFailureTracking(
        fetchBybitPerpKlines,
        bybitPerpCoins,
        timeframe,
        limit,
        dataKeys.failedBybitPerpSymbols
      ),
    ]);

    console.log("Binance Perps", binancePerps.length);
    console.log("Bybit Perps", bybitPerps.length);

    const expirationTime = calculateExpirationTime(
      binancePerps?.[0]?.data?.[binancePerps[0].data.length - 1]?.openTime,
      timeframe
    );

    console.log(
      "OpenTime",
      binancePerps?.[0]?.data?.[binancePerps[0].data.length - 1]?.openTime
    );
    console.log("Expiration time", expirationTime);

    let data = calculatePerpChanges([...binancePerps, ...bybitPerps]);

    console.log("Merged data", data.length);
    //data = normalizeKlineData(data);

    return new Response(
      JSON.stringify({
        timeframe,
        expirationTime,
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
