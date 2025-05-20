import { dataKeys } from "../redis/data-keys.mjs";
import { exchanges } from "../../coins/exchanges.mjs";

export function validateRequestParams(url) {
  const SUPPORTED_TIMEFRAMES = [
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "4h",
    "6h",
    "8h",
    "12h",
    "D",
  ];
  const DEFAULT_TIMEFRAME = "4h";
  const DEFAULT_LIMIT = 53;
  const DEFAULT_COIN_TYPE = dataKeys.perp;
  const DEFAULT_DOMINANT = exchanges.Binance;

  const urlObj = new URL(url);

  const timeframe = urlObj.searchParams.get("timeframe") || DEFAULT_TIMEFRAME;
  const limit = parseInt(urlObj.searchParams.get("limit")) || DEFAULT_LIMIT;

  let coinType = urlObj.searchParams.get("coinType");
  let dominant = urlObj.searchParams.get("dominant");

  const jsonError = (message, details) =>
    new Response(JSON.stringify({ error: message, ...details }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  // ✅ Validate timeframe
  if (!SUPPORTED_TIMEFRAMES.includes(timeframe)) {
    return jsonError("Invalid 'timeframe'", {
      supported: SUPPORTED_TIMEFRAMES,
    });
  }

  // ✅ Validate limit
  if (isNaN(limit) || limit < 1 || limit > 1000) {
    return jsonError("Invalid 'limit'", {
      range: "1–1000",
    });
  }

  // ✅ Validate coinType (only if provided)
  const validCoinTypes = Object.values(dataKeys);
  if (coinType) {
    if (!validCoinTypes.includes(coinType)) {
      return jsonError("Invalid 'coinType'", {
        supported: validCoinTypes,
      });
    }
  } else {
    coinType = DEFAULT_COIN_TYPE;
  }

  // ✅ Validate dominant (only if provided)
  const validExchanges = Object.values(exchanges);
  if (dominant) {
    if (!validExchanges.includes(dominant)) {
      return jsonError("Invalid 'dominant'", {
        supported: validExchanges,
      });
    }
  } else {
    dominant = DEFAULT_DOMINANT;
  }

  // ✅ All valid
  return {
    timeframe,
    limit,
    coinType,
    dominant,
  };
}
