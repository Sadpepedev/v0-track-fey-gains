import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"

const CACHE_KEY = "dune_weth_buyback"
const CACHE_DURATION = 1800 // 30 minutes

export const dynamic = "force-dynamic"

async function fetchFromDune() {
  const apiKey = process.env.DUNE_API_KEY

  if (!apiKey) {
    throw new Error("DUNE_API_KEY not configured")
  }

  // Query ID 5734648 for WETH buybacks
  const response = await fetch("https://api.dune.com/api/v1/query/5734648/results?limit=1000", {
    headers: {
      "X-Dune-API-Key": apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Dune API error: ${response.status}`)
  }

  const data = await response.json()

  let totalWethBuyback = 0

  if (data.result?.rows && data.result.rows.length > 0) {
    totalWethBuyback = data.result.rows
      .filter((row: any) => row.series === "weth_spent_buybacks")
      .reduce((sum: number, row: any) => {
        return sum + Number.parseFloat(row.value || "0")
      }, 0)
  }

  return {
    totalWethBuyback: totalWethBuyback,
    lastUpdated: Date.now(),
  }
}

export async function GET() {
  try {
    const cached = await getCachedData<any>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    console.log("[v0] Fetching fresh WETH buyback data from Dune")
    const data = await fetchFromDune()

    await setCachedData(CACHE_KEY, data, CACHE_DURATION)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching Dune buyback data:", error)
    return NextResponse.json({ error: "Failed to fetch Dune buyback data" }, { status: 500 })
  }
}
