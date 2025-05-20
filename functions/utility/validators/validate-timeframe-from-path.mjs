export function validateTimeframeFromPath(url) {
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

  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split("/").filter(Boolean); // Remove empty segments

  const timeframe = pathSegments[pathSegments.length - 1]; // Assume it's the last part

  if (!SUPPORTED_TIMEFRAMES.includes(timeframe)) {
    return new Response(
      JSON.stringify({
        error: "Invalid timeframe",
        supported: SUPPORTED_TIMEFRAMES,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return timeframe;
}
