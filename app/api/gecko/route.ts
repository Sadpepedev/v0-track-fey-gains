import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"

const CACHE_KEY = "dexscreener_fey_price_v1"
const CACHE_DURATION = 60 // 1 minute cache

export const dynamic = "force-dynamic"

const DEXSCREENER_API_URL =
  "https://api.dexscreener.com/latest/dex/pairs/base/0xe155c517c53f078f4b443c99436e42c1b80fd2fb1b3508f431c46b8365e4f3f0"

interface DexScreenerResponse {
  pairs: Array<{
    chainId: string
    dexId: string
    pairAddress: string
    baseToken: {
      address: string
      name: string
      symbol: string
    }
    quoteToken: {
      address: string
      name: string
      symbol: string
    }
    priceUsd: string
    priceNative: string
    txns: {
      h24: {
        buys: number
        sells: number
      }
    }
    volume: {
      h24: number
    }
    priceChange: {
      h24: number
    }
    liquidity: {
      usd: number
      base: number
      quote: number
    }
    fdv: number
    marketCap: number
  }>
}

async function fetchFromDexScreener() {
  const response = await fetch(DEXSCREENER_API_URL)

  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`)
  }

  const data: DexScreenerResponse = await response.json()

  console.log("[v0] DexScreener FULL response:", JSON.stringify(data, null, 2))

  if (!data.pairs || data.pairs.length === 0) {
    throw new Error("No pair data found from DexScreener")
  }

  const pair = data.pairs[0]

  const priceUSD = Number.parseFloat(pair.priceUsd)
  const marketCapUSD = pair.marketCap || pair.fdv || null
  const fdvUSD = pair.fdv || null
  const liquidityUSD = pair.liquidity?.usd || null
  const priceChange24h = pair.priceChange?.h24 || null
  const volume24h = pair.volume?.h24 || null

  console.log("[v0] Parsed DexScreener Data:")
  console.log("  - Price USD:", priceUSD)
  console.log("  - Market Cap:", marketCapUSD)
  console.log("  - FDV:", fdvUSD)
  console.log("  - Liquidity:", liquidityUSD)
  console.log("  - 24h Price Change:", priceChange24h)
  console.log("  - 24h Volume:", volume24h)

  return {
    priceUSD,
    poolName: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
    marketCapUSD,
    fdvUSD,
    liquidityUSD,
    priceChange24h,
    volume24h,
    lastUpdated: Date.now(),
  }
}

export async function GET() {
  try {
    const cached = await getCachedData<any>(CACHE_KEY)
    if (cached) {
      console.log("[v0] Returning cached DexScreener data")
      return NextResponse.json(cached)
    }

    console.log("[v0] Fetching fresh FEY price from DexScreener")
    const data = await fetchFromDexScreener()

    await setCachedData(CACHE_KEY, data, CACHE_DURATION)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching DexScreener data:", error)
    return NextResponse.json({ error: "Failed to fetch price data" }, { status: 500 })
  }
}
