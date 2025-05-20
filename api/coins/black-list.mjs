import { blackListData } from "../../functions/coins/black-list-data.mjs";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  try {
    const data = {
      perp: {
        binanceCount: blackListData.perp.binance.length,
        bybitCount: blackListData.perp.bybit.length,
        binance: blackListData.perp.binance.sort((a, b) => a.localeCompare(b)),
        bybit: blackListData.perp.bybit.sort((a, b) => a.localeCompare(b)),
      },
      spot: {
        binanceCount: blackListData.spot.binance.length,
        bybitCount: blackListData.spot.bybit.length,
        binance: blackListData.spot.binance.sort((a, b) => a.localeCompare(b)),
        bybit: blackListData.spot.bybit.sort((a, b) => a.localeCompare(b)),
      },
    };

    return new Response(JSON.stringify({ data }), {
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
