import { Redis } from "@upstash/redis";

export const setDataInRedis = async (dataKey, data) => {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
  await redis.set(dataKey, data);
};
