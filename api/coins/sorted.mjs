import { validateRequestParams } from "../../functions/utility/validators/validate-request-params.mjs";
import { fetchSortedCoinsFromRedis } from "../../functions/coins/fetch-sorted-coins-from-redis.mjs";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

// THIS SCRIPT BRINGS DATA FROM REDIS AND RETURNS IT TO THE CLIENT

export default async function handler(request) {
  try {
    const params = validateRequestParams(request.url);

    // 1. Validate and return early if there's an error
    if (params instanceof Response) {
      return params;
    }

    const { coinType, dominant } = params;
    console.log("coinType", coinType);
    console.log("dominant", dominant);
    const coins = await fetchSortedCoinsFromRedis(coinType, dominant);

    return new Response(JSON.stringify({ coins }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
