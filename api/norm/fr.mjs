// api/fetch-klines.mjs
import { validateRequestParams } from "../../functions/utility/validators/validate-request-params.mjs";

import { fetchBinanceFr } from "../../functions/binance/fetch-binance-fr.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { normalizeFundingRateData } from "../../functions/normalize/normalize-funding-rate-data.mjs";
import { calculateExpirationTime } from "../../functions/utility/calculations/calculate-expiration-time.mjs";
import { fetchDominantCoinsFromRedis } from "../../functions/coins/fetch-dominant-coins-from-redis.mjs";
import { exchanges } from "../../functions/coins/exchanges.mjs";
import { dataKeys } from "../../functions/utility/redis/data-keys.mjs";
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

    const { coinType, dominant, limit } = params;

    const { binancePerpCoins, bybitPerpCoins } =
      await fetchDominantCoinsFromRedis(coinType, dominant);

    const [bybitFr, binanceFr] = await Promise.all([
      handleFetchWithFailureTracking(
        fetchBybitFr,
        bybitPerpCoins,
        limit,
        dataKeys.failedBybitPerpSymbols
      ),
      handleFetchWithFailureTracking(
        fetchBinanceFr,
        binancePerpCoins,
        limit,
        dataKeys.failedBinancePerpSymbols
      ),
    ]);

    const expirationTime = calculateExpirationTime(
      bybitFr[0]?.data.at(-1).openTime,
      "2h"
    );

    const data = normalizeFundingRateData([...bybitFr, ...binanceFr]);

    return new Response(
      JSON.stringify({ timeframe: "2h", expirationTime, data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60, stale-while-revalidate=30",
        },
      }
    );
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
