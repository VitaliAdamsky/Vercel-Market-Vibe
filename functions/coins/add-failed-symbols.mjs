import { Redis } from "@upstash/redis";

export const addFailedSymbols = async (dataKey, symbols) => {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const data = await redis.get(dataKey);
  const existingSymbols = data ? data : [];

  const uniqueSymbols = [...existingSymbols, ...symbols];
  await redis.set(dataKey, uniqueSymbols);
};
