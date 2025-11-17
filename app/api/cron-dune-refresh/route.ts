import { NextResponse } from "next/server"
import { setCachedData } from "@/lib/supabase/cache"

const CACHE_KEY = "dune_fey_awarded_v4"
const CACHE_DURATION = 1800 // 30 minutes

export async function GET() {
  try {
    const apiKey = process.env.DUNE_API_KEY

    if (!apiKey) {
      throw new Error("DUNE_API_KEY not configured")
    }

    const response = await fetch("https://api.dune.com/api/v1/query/6177560/results?limit=1000", {
      headers: {
        "X-Dune-API-Key": apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Dune API error: ${response.status}`)
    }

    const data = await response.json()

    let totalFeyAwarded = 0

    if (data.result?.rows && data.result.rows.length > 0) {
      totalFeyAwarded = Number.parseFloat(data.result.rows[0]?.total_fey || "0")
    }

    const freshData = {
      totalFeyAwarded: Math.round(totalFeyAwarded),
      lastUpdated: Date.now(),
    }

    await setCachedData(CACHE_KEY, freshData, CACHE_DURATION)

    return NextResponse.json({
      success: true,
      totalFeyAwarded: freshData.totalFeyAwarded,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error refreshing Dune data:", error)
    return NextResponse.json({ error: "Failed to refresh Dune data" }, { status: 500 })
  }
}
