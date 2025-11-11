import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"
import { createClient } from "@/lib/supabase/server"

const CONTRACT_ADDRESS = "0x72f5565ab147105614ca4eb83ecf15f751fd8c50"
const BASE_RPC_URL = "https://mainnet.base.org"
const CACHE_KEY = "current_conversion_rate"
const CACHE_DURATION = 60 // 1 minute

export const dynamic = "force-dynamic"

async function fetchFromBlockchain() {
  const xFeyAmount = 1000000

  const functionSignature = "0x4cdad506" // previewRedeem(uint256)
  const paddedAmount = xFeyAmount.toString(16).padStart(64, "0")
  const data = functionSignature + paddedAmount

  const response = await fetch(BASE_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          to: CONTRACT_ADDRESS,
          data: data,
        },
        "latest",
      ],
      id: 1,
    }),
  })

  const result = await response.json()

  if (result.error) {
    throw new Error(`RPC Error: ${JSON.stringify(result.error)}`)
  }

  const hexValue = result.result
  const feyAmount = Number.parseInt(hexValue, 16)

  const conversionRate = feyAmount / xFeyAmount
  const totalGain = feyAmount - xFeyAmount
  const percentageGain = (totalGain / xFeyAmount) * 100

  return {
    xFeyAmount,
    feyAmount,
    conversionRate,
    totalGain,
    percentageGain,
    timestamp: Date.now(),
  }
}

export async function GET() {
  try {
    const cached = await getCachedData<any>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    console.log("[v0] Fetching fresh conversion rate from blockchain")
    const data = await fetchFromBlockchain()

    await setCachedData(CACHE_KEY, data, CACHE_DURATION)

    const supabase = createClient()
    const { error: dbError } = await supabase.from("fey_rates").insert({
      xfey_amount: data.xFeyAmount,
      fey_amount: data.feyAmount,
      conversion_rate: data.conversionRate,
      gains_percent: data.percentageGain,
    })

    if (dbError) {
      console.error("[v0] Error saving historical data:", dbError)
    } else {
      console.log("[v0] Saved historical data point to fey_rates table")
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching conversion rate:", error)
    return NextResponse.json({ error: "Failed to fetch conversion rate" }, { status: 500 })
  }
}
