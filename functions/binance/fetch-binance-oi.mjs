import { getBinanceKlineInterval } from "./get-binance-kline-interval.mjs";
import { binanceOiUrl } from "./binance-oi-url.mjs";

export const fetchBinanceOi = async (coins, timeframe, limit) => {
  const binanceInterval = getBinanceKlineInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      // --- headers setup (same as before) ---
      const headers = new Headers();
      headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
      headers.set("Accept", "*/*");
      headers.set("Accept-Language", "en-US,en;q=0.9");
      headers.set("Origin", "https://www.binance.com");
      headers.set("Referer", "https://www.binance.com/");

      // --- fetch & validate ---
      const url = binanceOiUrl(coin.symbol, binanceInterval, limit);
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.error(`Error fetching ${coin.symbol}:`, await response.text());
        return { success: false, symbol: coin.symbol };
      }

      const raw = await response.json();
      if (!Array.isArray(raw)) {
        console.error(`Invalid response structure for ${coin.symbol}:`, raw);
        return { success: false, symbol: coin.symbol };
      }

      // --- sort by timestamp ---
      const sorted = raw.sort(
        (a, b) => Number(a.timestamp) - Number(b.timestamp)
      );

      // --- compute the per‐entry payload ---
      const mapped = sorted.map((entry, idx, arr) => {
        const curr = Number(entry.sumOpenInterestValue);
        let oiChange = null;

        if (idx > 0) {
          const prev = Number(arr[idx - 1].sumOpenInterestValue);
          oiChange =
            prev !== 0
              ? Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(2))
              : curr !== 0
              ? 100
              : 0;
        }

        return {
          openTime: Number(entry.timestamp),
          symbol: coin.symbol,
          openInterest: Number(curr.toFixed(2)),
          openInterestChange: oiChange,
        };
      });

      // drop the first & last if you want exactly like fetchKline
      const cleaned = mapped.slice(1, -1);

      // --- success payload ---
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
