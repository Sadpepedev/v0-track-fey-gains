import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"

const CACHE_DURATION = 1800 // 30 minutes in seconds

export async function GET() {
  try {
    // Check cache first
    const cached = await getCachedData("thegraph_dex_volume")
    if (cached) {
      return NextResponse.json(cached)
    }

    // Query The Graph subgraph for pool data
    const response = await fetch(
      "https://gateway.thegraph.com/api/subgraphs/id/Gqm2b5J85n1bhCyDMpGbtbVn4935EvvdyHdHrx3dibyj",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.THEGRAPH_API_KEY}`,
        },
        body: JSON.stringify({
          query: `{
            pools(
              where: {
                id: "0xe155c517c53f078f4b443c99436e42c1b80fd2fb1b3508f431c46b8365e4f3f0"
              }
            ) {
              volumeUSD
              txCount
              totalValueLockedUSD
              token0 {
                symbol
              }
              token1 {
                symbol
              }
            }
          }`,
          operationName: "Subgraphs",
          variables: {},
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`The Graph API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    const pool = data.data?.pools?.[0]

    if (!pool) {
      throw new Error("Pool data not found")
    }

    const result = {
      volumeUSD: parseFloat(pool.volumeUSD),
      txCount: parseInt(pool.txCount),
      totalValueLockedUSD: parseFloat(pool.totalValueLockedUSD),
      token0Symbol: pool.token0.symbol,
      token1Symbol: pool.token1.symbol,
      lastUpdated: Date.now(),
    }

    // Cache the result
    await setCachedData("thegraph_dex_volume", result, CACHE_DURATION)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch The Graph volume data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch volume data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
