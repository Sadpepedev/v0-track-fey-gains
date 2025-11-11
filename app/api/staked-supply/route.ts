import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"

export const dynamic = "force-dynamic"
export const revalidate = 300 // 5 minutes

const CONTRACT_ADDRESS = "0x72f5565ab147105614ca4eb83ecf15f751fd8c50"
const BASE_RPC_URL = "https://mainnet.base.org"
const TOTAL_SUPPLY = 100_000_000_000 // 100 billion tokens

// Function signature for totalAssets()
const TOTAL_ASSETS_SELECTOR = "0x01e1d114"

export async function GET() {
  try {
    const cached = await getCachedData("staked_supply_v2", 300) // 5 minute cache
    if (cached) {
      console.log("[v0] Staked supply cache hit")
      return NextResponse.json(cached)
    }

    console.log("[v0] Fetching staked supply from blockchain...")

    // Call totalAssets() on the xFEY contract to get FEY locked in vault
    const response = await fetch(BASE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: CONTRACT_ADDRESS,
            data: TOTAL_ASSETS_SELECTOR,
          },
          "latest",
        ],
        id: 1,
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("RPC error:", data.error)
      return NextResponse.json({ error: "Failed to fetch staked supply" }, { status: 500 })
    }

    // Convert hex result to decimal and adjust for 18 decimals
    const totalStakedWei = BigInt(data.result)
    const totalStakedTokens = Number(totalStakedWei) / 1e18
    const percentageStaked = (totalStakedTokens / TOTAL_SUPPLY) * 100

    console.log("[v0] Total staked:", totalStakedTokens, "tokens")
    console.log("[v0] Percentage staked:", percentageStaked.toFixed(2), "%")

    const result = {
      totalStaked: totalStakedTokens,
      totalSupply: TOTAL_SUPPLY,
      percentageStaked,
      timestamp: Date.now(),
    }

    await setCachedData("staked_supply_v2", result, 300)

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Error fetching staked supply:", error)
    return NextResponse.json({ error: "Failed to fetch staked supply" }, { status: 500 })
  }
}
