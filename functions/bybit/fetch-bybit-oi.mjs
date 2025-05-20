import { getBybitOiInterval } from "./get-bybit-oi-interval.mjs";
import { bybitOiUrl } from "./bybit-oi-url.mjs";

export const fetchBybitOi = async (coins, timeframe, limit) => {
  const bybitInterval = getBybitOiInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bybitOiUrl(coin.symbol, bybitInterval, limit);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        return { success: false, symbol: coin.symbol };
      }

      const json = await response.json();
      const list = json?.result?.list;
      if (!Array.isArray(list)) {
        console.error(`Invalid response for ${coin.symbol}:`, json);
        return { success: false, symbol: coin.symbol };
      }

      // sort + map
      const mapped = list
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
        .map((entry, idx, arr) => {
          const curr = Number(entry.openInterest);
          let change = null;

          if (idx > 0) {
            const prev = Number(arr[idx - 1].openInterest);
            change =
              prev !== 0
                ? Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(2))
                : curr !== 0
                ? 100
                : 0;
          }

          return {
            symbol: coin.symbol,
            openTime: Number(entry.timestamp),
            openInterest: Number(curr.toFixed(2)),
            openInterestChange: change,
          };
        });

      // drop first & last if desired
      const cleaned = mapped.slice(1, -1);

      return {
        symbol: coin.symbol,
        exchanges: coin.exchanges || [],
        imageUrl: coin.imageUrl || "",
        category: coin.category || "",
        data: cleaned,
      };
    } catch (err) {
      console.error(`Error processing ${coin.symbol}:`, err);
      return { success: false, symbol: coin.symbol };
    }
  });

  return Promise.all(promises);
};

/**
 * Partition an array of { success, data?, symbol? } into
 *   - successes: the full payloads
 *   - failedSymbols: just the symbols that failed
 */
