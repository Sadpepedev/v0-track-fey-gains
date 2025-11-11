import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"

const CACHE_KEY = "gecko_weth_price"
const CACHE_DURATION = 300 // 5 minutes

export const dynamic = "force-dynamic"

async function fetchFromCoinGecko() {
  const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=weth&vs_currencies=usd")

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()
  const wethPriceUSD = data.weth?.usd || 0

  return {
    priceUSD: wethPriceUSD,
    lastUpdated: Date.now(),
  }
}

export async function GET() {
  try {
    const cached = await getCachedData<any>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    console.log("[v0] Fetching fresh WETH price from CoinGecko")
    const data = await fetchFromCoinGecko()

    await setCachedData(CACHE_KEY, data, CACHE_DURATION)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching WETH price:", error)
    return NextResponse.json({ error: "Failed to fetch WETH price" }, { status: 500 })
  }
}
