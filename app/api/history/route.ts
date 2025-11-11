import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "100")

    const supabase = createClient()

    // Fetch historical data ordered by timestamp
    const { data, error } = await supabase
      .from("fey_rates")
      .select("*")
      .order("timestamp", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching history:", error)
      return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
    }

    // Transform to match frontend format
    const formattedData = data.map((row) => ({
      xFeyAmount: row.xfey_amount,
      feyAmount: row.fey_amount,
      conversionRate: Number(row.conversion_rate),
      totalGain: row.fey_amount - row.xfey_amount,
      percentageGain: Number(row.gains_percent),
      timestamp: new Date(row.timestamp).getTime(),
    }))

    return NextResponse.json(formattedData, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Error in history endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}
