// api/fetch-klines.mjs
import { validateRequestParams } from "../../functions/utility/validators/validate-request-params.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";
import { dataKeys } from "../../functions/utility/redis/data-keys.mjs";

import { normalizeOpenInterestData } from "../../functions/normalize/normalize-open-interest-data.mjs";

import { calculateExpirationTime } from "../../functions/utility/colors/calculations/calculate-expiration-time.mjs";
import { fetchDominantCoinsFromRedis } from "../../functions/coins/fetch-dominant-coins-from-redis.mjs";
import { handleFetchWithFailureTracking } from "../../functions/utility/handle-fetch-with-failure-tracking.mjs";

export const config = {
  runtime: "edge",
  regions: ["lhr1"],
};

// Main handler
export default async function handler(request) {
  try {
    const params = validateRequestParams(request.url);

    // 2. Если ошибка — возвращаем её
    if (params instanceof Response) {
      return params;
    }

    const { timeframe, limit, coinType, dominant } = params;

    const { binancePerpCoins, bybitPerpCoins } =
      await fetchDominantCoinsFromRedis(coinType, dominant);

    // const [binanceOi, bybitOi] = await Promise.all([
    //   handleFetchWithFailureTracking(
    //     fetchBinanceOi,
    //     binancePerpCoins,
    //     timeframe,
    //     limit,
    //     dataKeys.failedBinancePerpSymbols
    //   ),
    //   handleFetchWithFailureTracking(
    //     fetchBybitOi,
    //     bybitPerpCoins,
    //     timeframe,
    //     limit,
    //     dataKeys.failedBybitPerpSymbols
    //   ),
    // ]);

    const [binanceOi, bybitOi] = await Promise.all([
      fetchBinanceOi(binancePerpCoins, timeframe, limit),
      fetchBybitOi(bybitPerpCoins, timeframe, limit),
    ]);

    const expirationTime = calculateExpirationTime(
      binanceOi[0]?.data.at(-1).openTime,
      timeframe
    );

    const data = normalizeOpenInterestData([...binanceOi, ...bybitOi]);

    return new Response(JSON.stringify({ timeframe, expirationTime, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Data processing failed",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
