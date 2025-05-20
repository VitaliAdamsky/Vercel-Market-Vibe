import { addFailedSymbols } from "../coins/add-failed-symbols.mjs";

export const handleFetchWithFailureTracking = async (
  fetchFn,
  coins,
  timeframe,
  limit,
  failedSymbolsDataKey
) => {
  const results = await fetchFn(coins, timeframe, limit);

  const failedSymbols = [];
  const succeeded = [];

  for (const result of results) {
    if (!result.data || result.data.length === 0) {
      failedSymbols.push(result.symbol);
    } else {
      succeeded.push(result);
    }
  }
  //Cache failed symbols
  if (failedSymbols.length > 0) {
    await addFailedSymbols(failedSymbolsDataKey, failedSymbols);
  }

  //console.log("succeeded", succeeded[0]);
  return succeeded;
};
