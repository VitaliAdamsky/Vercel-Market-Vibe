import { dataKeys } from "../../functions/utility/redis/data-keys.mjs";
import { setDataInRedis } from "../../functions/utility/redis/set-data-in-redis.mjs";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  try {
    const [ok] = await Promise.all([
      setDataInRedis(dataKeys.failedBinancePerpSymbols, []),
      setDataInRedis(dataKeys.failedBybitPerpSymbols, []),
      setDataInRedis(dataKeys.failedBinanceSpotSymbols, []),
      setDataInRedis(dataKeys.failedBybitSpotSymbols, []),
    ]);
    console.log("ok", ok);
    return new Response(JSON.stringify({ result: ok }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
