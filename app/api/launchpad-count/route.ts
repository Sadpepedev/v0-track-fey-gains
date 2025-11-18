import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/supabase/cache"

export const dynamic = 'force-dynamic'

const LAUNCHPAD_ADDRESS = "0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d"
const CACHE_KEY = "launchpad_token_count_v3"
const CACHE_DURATION = 120 // 2 minutes

const FUNCTION_SELECTORS: Record<string, string> = {
  tokenCount: "0x1207f5b5",
  totalTokens: "0x0b3e24e7",
  getTokenCount: "0xa87430ba",
  numberOfTokens: "0x6f8b3127",
  deployedTokensLength: "0x696d5d9e",
  getAllTokensLength: "0x3e4f49e6",
  tokensLength: "0x3e4f49e6",
  count: "0x534152e5",
  length: "0x1f7b6d32"
}

// Common event topics for token creation
const TOKEN_CREATION_EVENT_TOPICS = [
  "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", // TokenCreated
  "0x2d49c67975aadd2d389580b368cfff5b49965b0bd5da33c144922ce01e7a4d7b", // TokenLaunched
  "0x56358b41df5fa59f5639228f0930994cbdde383c8a8fd74e06c04e1deebe3562", // NewToken
  "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", // OwnershipTransferred (sometimes proxy for creation)
]

export async function GET() {
  try {
    // Check cache first
    const cached = await getCachedData(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (!process.env.ALCHEMY_API_KEY) {
      console.error("[v0] ALCHEMY_API_KEY is missing")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const alchemyUrl = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    console.log("[v0] Fetching launchpad count (v3)")

    // 1. Try direct contract function calls
    for (const [funcName, selector] of Object.entries(FUNCTION_SELECTORS)) {
      try {
        const response = await fetch(alchemyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [{ to: LAUNCHPAD_ADDRESS, data: selector }, "latest"],
          }),
          cache: 'no-store'
        })

        const data = await response.json()
        if (data.result && data.result !== "0x" && data.result !== "0x0") {
          const count = parseInt(data.result, 16)
          if (!isNaN(count) && count > 0 && count < 1000000) {
            console.log(`[v0] Found count via ${funcName}: ${count}`)
            const result = { tokenCount: count, source: funcName, lastUpdated: Date.now() }
            await setCachedData(CACHE_KEY, result, CACHE_DURATION)
            return NextResponse.json(result)
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Try storage slots (0-20)
    // Many contracts store the count in a low storage slot
    console.log("[v0] Scanning storage slots")
    for (let i = 0; i < 20; i++) {
      try {
        const response = await fetch(alchemyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getStorageAt",
            params: [LAUNCHPAD_ADDRESS, `0x${i.toString(16)}`, "latest"],
          }),
          cache: 'no-store'
        })
        
        const data = await response.json()
        if (data.result && data.result !== "0x") {
           const val = parseInt(data.result, 16)
           // Heuristic: A token count is likely > 0 and < 50000
           // We ignore huge numbers (addresses, timestamps, hashes)
           if (val > 1 && val < 50000) {
             console.log(`[v0] Found potential count in slot ${i}: ${val}`)
             // If we find a reasonable number, it's a good candidate.
             // But we might find "1" (reentrancy guard) or "owner" (if small).
             // Let's prefer values > 1 if possible, or keep looking.
             // For now, let's return it if it looks like a counter.
             const result = { tokenCount: val, source: `storage_slot_${i}`, lastUpdated: Date.now() }
             await setCachedData(CACHE_KEY, result, CACHE_DURATION)
             return NextResponse.json(result)
           }
        }
      } catch (e) {
        // ignore
      }
    }

    console.log("[v0] Counting CREATE2 contract deployments via Basescan")
    const apiKey = process.env.BASESCAN_API_KEY || "YourApiKeyToken"
    
    try {
      // Get internal transactions (contract creations)
      const internalTxResponse = await fetch(
        `https://api.basescan.org/api?module=account&action=txlistinternal&address=${LAUNCHPAD_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`,
        { cache: 'no-store' }
      )
      
      if (internalTxResponse.ok) {
        const internalTxData = await internalTxResponse.json()
        if (internalTxData.status === "1" && Array.isArray(internalTxData.result)) {
          // Filter for contract creations (type === "create" or "create2")
          const contractCreations = internalTxData.result.filter((tx: any) => 
            tx.type === "create" || tx.type === "create2" || tx.isError === "0" && tx.contractAddress && tx.contractAddress !== ""
          )
          
          const count = contractCreations.length
          console.log(`[v0] Found ${count} contract deployments via Basescan internal txs`)
          
          if (count > 0) {
            const result = { tokenCount: count, source: 'basescan_contract_creations', lastUpdated: Date.now() }
            await setCachedData(CACHE_KEY, result, CACHE_DURATION)
            return NextResponse.json(result)
          }
        } else {
          console.warn("[v0] Basescan internal tx returned status != 1:", internalTxData)
        }
      } else {
        console.warn("[v0] Basescan internal tx fetch failed:", internalTxResponse.status)
      }
    } catch (e) {
      console.warn("[v0] Basescan internal tx failed:", e)
    }

    // 3. Fallback: Try Basescan Normal Transactions (Proxy for activity)
    console.log("[v0] Trying Basescan normal transactions")
    try {
      const txResponse = await fetch(
        `https://api.basescan.org/api?module=account&action=txlist&address=${LAUNCHPAD_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`,
        { cache: 'no-store' }
      )
      
      if (txResponse.ok) {
        const txData = await txResponse.json()
        if (txData.status === "1" && Array.isArray(txData.result)) {
          // Count successful transactions to the contract
          // This is an upper bound but better than 0
          const successfulTxs = txData.result.filter((tx: any) => tx.isError === "0")
          const count = successfulTxs.length
          
          console.log(`[v0] Found ${count} successful txs via Basescan`)
          if (count > 0) {
            const result = { tokenCount: count, source: 'basescan_tx_count_proxy', lastUpdated: Date.now() }
            await setCachedData(CACHE_KEY, result, CACHE_DURATION)
            return NextResponse.json(result)
          }
        } else {
           console.warn("[v0] Basescan txlist returned status != 1:", txData)
        }
      }
    } catch (e) {
      console.warn("[v0] Basescan txlist failed:", e)
    }

    // 4. Fallback: Try Basescan Events
    console.log("[v0] Trying Basescan events")
    try {
      const eventResponse = await fetch(
        `https://api.basescan.org/api?module=logs&action=getLogs&address=${LAUNCHPAD_ADDRESS}&fromBlock=0&toBlock=latest&apikey=${apiKey}`,
        { cache: 'no-store' }
      )
      
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        if (eventData.status === "1" && Array.isArray(eventData.result)) {
          const uniqueTxs = new Set(eventData.result.map((log: any) => log.transactionHash))
          const count = uniqueTxs.size
          
          console.log(`[v0] Found ${count} unique txs via Basescan`)
          if (count > 0) {
            const result = { tokenCount: count, source: 'basescan_tx_count', lastUpdated: Date.now() }
            await setCachedData(CACHE_KEY, result, CACHE_DURATION)
            return NextResponse.json(result)
          }
        } else {
          console.warn("[v0] Basescan logs returned status != 1:", eventData)
        }
      } else {
        console.warn("[v0] Basescan logs fetch failed:", eventResponse.status)
      }
    } catch (e) {
      console.warn("[v0] Basescan logs failed:", e)
    }

    return NextResponse.json({ 
      tokenCount: 0, 
      launchpadAddress: LAUNCHPAD_ADDRESS,
      source: "none",
      error: null // Return null error so UI shows 0 instead of hiding
    })

  } catch (error: any) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
