import { Redis } from "@upstash/redis";

export const getDataFromRedis = async (dataKey) => {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const data = await redis.get(dataKey);
  return data || [];
};
