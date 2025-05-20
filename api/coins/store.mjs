import { dataKeys } from "../../functions/utility/redis/data-keys.mjs";
import { setDataInRedis } from "../../functions/utility/redis/set-data-in-redis.mjs";
import { fetchCoinsFromDb } from "../../functions/coins/fetch-coins-from-db.mjs";
import { getDataFromRedis } from "../../functions/utility/redis/get-data-from-redis.mjs";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  try {
    const coins = await fetchCoinsFromDb();

    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    await setDataInRedis(dataKeys.coins, coins);

    const storedData = await getDataFromRedis(dataKeys.coins);

    return new Response(JSON.stringify({ coins: storedData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
