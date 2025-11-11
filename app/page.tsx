"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { RateChart } from "@/components/rate-chart"
import { Percent, Clock } from "lucide-react"

interface RateData {
  xFeyAmount: number
  feyAmount: number
  conversionRate: number
  totalGain: number
  percentageGain: number
  timestamp: number
}

interface DuneData {
  totalFeyAwarded: number
  lastUpdated: number
}

interface GeckoData {
  priceUSD: number
  poolName: string
  marketCapUSD: number | null
  fdvUSD: number | null
  liquidityUSD: number | null
  priceChange24h: number | null
  lastUpdated: number
  volume24h: number | null
}

interface DuneBuybackData {
  totalWethBuyback: number
  lastUpdated: number
}

interface WethPriceData {
  priceUSD: number
  lastUpdated: number
}

interface StakedSupplyData {
  totalStaked: number
  totalSupply: number
  percentageStaked: number
  timestamp: number
}

const LAUNCH_DATE = new Date("2025-11-01T00:57:29Z").getTime()

export default function Home() {
  const [currentRate, setCurrentRate] = useState<RateData | null>(null)
  const [historicalData, setHistoricalData] = useState<RateData[]>([])
  const [duneData, setDuneData] = useState<DuneData | null>(null)
  const [duneBuybackData, setDuneBuybackData] = useState<DuneBuybackData | null>(null)
  const [geckoData, setGeckoData] = useState<GeckoData | null>(null)
  const [wethPrice, setWethPrice] = useState<WethPriceData | null>(null)
  const [stakedSupply, setStakedSupply] = useState<StakedSupplyData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentRate = async () => {
    try {
      console.log("[v0] Client fetching current rate at", new Date().toISOString())
      const response = await fetch("/api/fetch-rate")
      const data = await response.json()

      if (!data.error) {
        console.log("[v0] Received conversion rate:", data.feyAmount, "FEY for", data.xFeyAmount, "xFEY")
        setCurrentRate(data)
      }
    } catch (error) {
      console.error("Failed to fetch current rate:", error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history?limit=500")
      const data = await response.json()

      if (!data.error && Array.isArray(data)) {
        setHistoricalData(data)
        await fetchCurrentRate()
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDuneData = async () => {
    try {
      const response = await fetch("/api/dune")
      const data = await response.json()

      if (!data.error) {
        setDuneData(data)
      }
    } catch (error) {
      console.error("Failed to fetch Dune data:", error)
    }
  }

  const fetchDuneBuybackData = async () => {
    try {
      const response = await fetch("/api/dune-buyback")
      const data = await response.json()

      if (!data.error) {
        setDuneBuybackData(data)
      }
    } catch (error) {
      console.error("Failed to fetch Dune buyback data:", error)
    }
  }

  const fetchGeckoData = async () => {
    try {
      const response = await fetch("/api/gecko")
      const data = await response.json()

      if (!data.error) {
        setGeckoData(data)
      }
    } catch (error) {
      console.error("Failed to fetch Gecko data:", error)
    }
  }

  const fetchWethPrice = async () => {
    try {
      const response = await fetch("/api/gecko-weth")
      const data = await response.json()

      if (!data.error) {
        setWethPrice(data)
      }
    } catch (error) {
      console.error("Failed to fetch WETH price:", error)
    }
  }

  const fetchStakedSupply = async () => {
    try {
      const response = await fetch("/api/staked-supply")
      const data = await response.json()

      if (!data.error) {
        setStakedSupply(data)
      }
    } catch (error) {
      console.error("Failed to fetch staked supply:", error)
    }
  }

  useEffect(() => {
    fetchHistory()
    fetchDuneData()
    fetchDuneBuybackData()
    fetchGeckoData()
    fetchWethPrice()
    fetchStakedSupply()
    const currentRateInterval = setInterval(fetchCurrentRate, 60 * 1000) // 1 minute
    const historyInterval = setInterval(fetchHistory, 30 * 60 * 1000) // 30 minutes
    const duneInterval = setInterval(fetchDuneData, 60 * 60 * 1000) // 1 hour
    const duneBuybackInterval = setInterval(fetchDuneBuybackData, 60 * 60 * 1000) // 1 hour
    const geckoInterval = setInterval(fetchGeckoData, 60 * 1000) // 1 minute
    const wethPriceInterval = setInterval(fetchWethPrice, 5 * 60 * 1000) // 5 minutes
    const stakedSupplyInterval = setInterval(fetchStakedSupply, 5 * 60 * 1000) // 5 minutes
    return () => {
      clearInterval(currentRateInterval)
      clearInterval(historyInterval)
      clearInterval(duneInterval)
      clearInterval(duneBuybackInterval)
      clearInterval(geckoInterval)
      clearInterval(wethPriceInterval)
      clearInterval(stakedSupplyInterval)
    }
  }, [])

  const calculateTimeElapsed = () => {
    if (!currentRate) return "—"
    const elapsed = currentRate.timestamp - LAUNCH_DATE
    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24))
    const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h`
  }

  const calculateEstimatedAnnualRate = () => {
    if (!currentRate) return null
    const currentConversionRate = currentRate.conversionRate
    const initialConversionRate = 1 // Starting 1:1 ratio
    const daysElapsed = (currentRate.timestamp - LAUNCH_DATE) / (1000 * 60 * 60 * 24)

    if (daysElapsed === 0) return null

    const dailyRate = (currentConversionRate - initialConversionRate) / daysElapsed
    const annualRate = dailyRate * 365
    const annualPercentage = annualRate * 100 // Convert to percentage

    return annualPercentage
  }

  const calculateUSDValue = () => {
    if (!currentRate || !geckoData) return null
    const totalFeyAmount = currentRate.feyAmount
    const usdValue = totalFeyAmount * geckoData.priceUSD
    return usdValue
  }

  const calculateGainsUSDValue = () => {
    if (!currentRate || !geckoData) return null
    const gainsFey = currentRate.totalGain
    const gainsUSD = gainsFey * geckoData.priceUSD
    return gainsUSD
  }

  const calculateTotalAwardedUSD = () => {
    if (!duneData || !geckoData) return null
    return duneData.totalFeyAwarded * geckoData.priceUSD
  }

  const calculateCurrentFeyUSD = () => {
    if (!currentRate || !geckoData) return null
    return currentRate.feyAmount * geckoData.priceUSD
  }

  const calculateWethBuybackUSD = () => {
    if (!duneBuybackData || !wethPrice) return null
    return duneBuybackData.totalWethBuyback * wethPrice.priceUSD
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
            <h1
              className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl lg:text-6xl"
              style={{ fontSize: "clamp(2rem, 8vw, 4rem)" }}
            >
              FEY Dashboard
            </h1>
            <p className="text-center text-xs text-muted-foreground sm:text-sm lg:text-base">
              Real-time gains since Nov 1, 2025
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
              <p className="text-sm text-muted-foreground">Loading historical data...</p>
            </div>
          </div>
        ) : (
          <>
            {geckoData && stakedSupply && (
              <div className="mb-6 overflow-hidden rounded-2xl border-2 border-accent bg-gradient-to-br from-accent/5 via-background to-accent/10 p-5 shadow-2xl sm:mb-10 sm:rounded-3xl sm:p-8 lg:p-10">
                <div className="mb-6 text-center sm:mb-8">
                  <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-accent to-transparent sm:w-48" />
                </div>

                {/* Top Grid - Main Metrics */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                  {/* FEY Price */}
                  <div className="group relative overflow-hidden rounded-lg border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-background to-transparent p-3 transition-all hover:border-accent hover:shadow-[0_0_15px_rgba(34,197,94,0.25)] sm:p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:mb-3 sm:text-xs">
                      FEY PRICE
                    </p>
                    <p
                      className="mb-1 font-black text-accent sm:mb-2"
                      style={{ fontSize: "clamp(1.25rem, 4vw, 2rem)" }}
                    >
                      ${geckoData.priceUSD.toFixed(8)}
                    </p>
                    {geckoData.priceChange24h !== null &&
                      geckoData.priceChange24h !== undefined &&
                      typeof geckoData.priceChange24h === "number" && (
                        <div className="mt-2 flex flex-col gap-1 border-t border-accent/20 pt-2 sm:mt-3 sm:pt-3">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                            24H CHANGE
                          </p>
                          <p
                            className={`text-xl font-black sm:text-2xl ${
                              geckoData.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {geckoData.priceChange24h >= 0 ? "+" : ""}
                            {geckoData.priceChange24h.toFixed(2)}%
                          </p>
                        </div>
                      )}
                    {(geckoData.priceChange24h === null || geckoData.priceChange24h === undefined) && (
                      <div className="mt-2 border-t border-accent/20 pt-2 sm:mt-3 sm:pt-3">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                          24H CHANGE
                        </p>
                        <p className="text-xs font-bold text-muted-foreground sm:text-sm">N/A</p>
                      </div>
                    )}
                  </div>

                  {/* Market Cap */}
                  <div className="group relative overflow-hidden rounded-lg border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-background to-transparent p-3 transition-all hover:border-accent hover:shadow-[0_0_15px_rgba(34,197,94,0.25)] sm:p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:mb-3 sm:text-xs">
                      MARKET CAP
                    </p>
                    <p
                      className="mb-1 font-black text-accent sm:mb-2"
                      style={{ fontSize: "clamp(1.25rem, 4vw, 2rem)" }}
                    >
                      {geckoData.fdvUSD && typeof geckoData.fdvUSD === "number"
                        ? `$${(geckoData.fdvUSD / 1000000).toFixed(4)}M`
                        : geckoData.marketCapUSD && typeof geckoData.marketCapUSD === "number"
                          ? `$${(geckoData.marketCapUSD / 1000000).toFixed(4)}M`
                          : "N/A"}
                    </p>
                    <div className="mt-2 border-t border-accent/20 pt-2 sm:mt-3 sm:pt-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                        FDV
                      </p>
                      <p className="text-xs font-bold text-accent sm:text-sm">
                        {geckoData.fdvUSD && typeof geckoData.fdvUSD === "number"
                          ? `$${(geckoData.fdvUSD / 1000000).toFixed(5)}M`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Liquidity */}
                  <div className="group relative overflow-hidden rounded-lg border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-background to-transparent p-3 transition-all hover:border-accent hover:shadow-[0_0_15px_rgba(34,197,94,0.25)] sm:p-4 lg:p-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:mb-3 sm:text-xs">
                      LIQUIDITY*
                    </p>
                    <p
                      className="mb-1 font-black text-accent sm:mb-2"
                      style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)" }}
                    >
                      {geckoData.liquidityUSD && typeof geckoData.liquidityUSD === "number"
                        ? geckoData.liquidityUSD >= 1000000
                          ? `$${(geckoData.liquidityUSD / 1000000).toFixed(2)}M`
                          : `$${(geckoData.liquidityUSD / 1000).toFixed(1)}K`
                        : "N/A"}
                    </p>
                    <div className="mt-2 space-y-2 border-t border-accent/20 pt-2 sm:mt-3 sm:space-y-2.5 sm:pt-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                          24H VOLUME
                        </p>
                        <p className="text-xs font-bold text-accent sm:text-sm lg:text-base">
                          {geckoData.volume24h && typeof geckoData.volume24h === "number"
                            ? geckoData.volume24h >= 1000000
                              ? `$${(geckoData.volume24h / 1000000).toFixed(2)}M`
                              : `$${(geckoData.volume24h / 1000).toFixed(1)}K`
                            : "N/A"}
                        </p>
                      </div>
                      <p className="text-[8px] italic leading-tight text-muted-foreground/70 sm:text-[9px]">
                        *Data as reported by Dexscreener. Accuracy may vary.
                      </p>
                    </div>
                  </div>

                  {/* Staked % */}
                  <div className="group relative overflow-hidden rounded-lg border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-background to-transparent p-3 transition-all hover:border-accent hover:shadow-[0_0_15px_rgba(34,197,94,0.25)] sm:p-4 lg:p-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:mb-3 sm:text-xs">
                      STAKED %
                    </p>
                    <p
                      className="mb-1 font-black text-accent sm:mb-2"
                      style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)" }}
                    >
                      {stakedSupply.percentageStaked && typeof stakedSupply.percentageStaked === "number"
                        ? stakedSupply.percentageStaked.toFixed(2)
                        : "0.00"}
                      %
                    </p>
                    <div className="mt-2 border-t border-accent/20 pt-2 sm:mt-3 sm:pt-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                        TOTAL STAKED
                      </p>
                      <p className="text-xs font-bold text-accent sm:text-sm lg:text-base">
                        {stakedSupply.totalStaked && typeof stakedSupply.totalStaked === "number"
                          ? `${(stakedSupply.totalStaked / 1000000000).toFixed(1)}B FEY`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* 24H Trading Volume */}
                </div>

                {/* System Status */}
                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-accent/20 pt-4 sm:gap-3 sm:pt-5">
                  <div className="mx-2 hidden h-px flex-1 bg-gradient-to-r from-accent/20 via-accent/40 to-transparent sm:mx-3 sm:block" />
                  <p className="text-[9px] font-mono text-muted-foreground sm:text-[10px]">
                    TIMESTAMP: {new Date().toISOString().replace("T", " ").substring(0, 19)} UTC
                  </p>
                  <div className="mx-2 hidden h-px flex-1 bg-gradient-to-l from-accent/20 via-accent/40 to-transparent sm:mx-3 sm:block" />
                </div>
              </div>
            )}

            <div className="mb-6 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-accent/20 via-primary/15 to-accent/10 p-5 shadow-2xl sm:mb-10 sm:rounded-3xl sm:p-8 lg:p-10 border-background">
              <div className="relative">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

                <div className="relative text-center">
                  <h2 className="mb-2 text-[10px] font-black uppercase tracking-widest text-accent sm:mb-3 sm:text-sm">
                    🔥 Total Value Distributed 🔥
                  </h2>

                  <div className="mb-6 space-y-4 sm:mb-8 sm:space-y-6">
                    {/* FEY Rewards */}
                    {duneData && geckoData && calculateTotalAwardedUSD() && (
                      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 p-4 backdrop-blur-sm sm:rounded-2xl sm:p-6">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-xs lg:text-sm">
                          💰 Staking Rewards
                        </p>
                        <p
                          className="mb-0.5 bg-gradient-to-r from-accent to-primary bg-clip-text text-3xl font-black tracking-tight text-transparent sm:mb-1 sm:text-5xl lg:text-7xl"
                          style={{ fontSize: "clamp(1.75rem, 8vw, 4.5rem)" }}
                        >
                          {duneData.totalFeyAwarded.toLocaleString()}
                        </p>
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground sm:mb-2 sm:text-sm lg:text-base">
                          FEY Tokens
                        </p>
                        <p
                          className="text-xl font-black text-accent sm:text-2xl lg:text-4xl"
                          style={{ fontSize: "clamp(1.25rem, 5vw, 2.25rem)" }}
                        >
                          $
                          {calculateTotalAwardedUSD()?.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          USD
                        </p>
                      </div>
                    )}

                    {/* WETH Buybacks */}
                    {duneBuybackData && wethPrice && calculateWethBuybackUSD() && (
                      <div className="rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 p-4 backdrop-blur-sm sm:rounded-2xl sm:p-6">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-xs lg:text-sm">
                          🚀 Buyback Fuel
                        </p>
                        <p
                          className="mb-0.5 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-black tracking-tight text-transparent sm:mb-1 sm:text-5xl lg:text-7xl"
                          style={{ fontSize: "clamp(1.75rem, 8vw, 4.5rem)" }}
                        >
                          {duneBuybackData.totalWethBuyback.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground sm:mb-2 sm:text-sm lg:text-base">
                          WETH
                        </p>
                        <p
                          className="text-xl font-black text-primary sm:text-2xl lg:text-4xl"
                          style={{ fontSize: "clamp(1.25rem, 5vw, 2.25rem)" }}
                        >
                          $
                          {calculateWethBuybackUSD()?.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          USD
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-muted-foreground sm:text-xs lg:text-sm">
                    Since Nov 1, 2025
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:mb-8 sm:gap-6 lg:grid-cols-1">
              <Card className="group relative overflow-hidden border-accent/20 bg-gradient-to-br from-card via-card to-accent/5 p-4 shadow-lg transition-all hover:shadow-xl sm:p-6 lg:p-7">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/10 blur-3xl" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 sm:h-9 sm:w-9">
                      <Percent className="h-4 w-4 text-accent sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground sm:text-sm">Current Exchange Rate</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col justify-between gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-baseline sm:pb-4">
                      <div>
                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                          Percentage Gain
                        </p>
                        <p
                          className="bg-gradient-to-r from-accent to-primary bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl lg:text-5xl"
                          style={{ fontSize: "clamp(1.875rem, 7vw, 3rem)" }}
                        >
                          {currentRate ? `${currentRate.percentageGain.toFixed(4)}%` : "—"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                          from 1:1 baseline
                        </p>
                        <p className="mt-0.5 text-base font-bold text-primary sm:mt-1 sm:text-lg lg:text-xl">
                          {currentRate ? `+${currentRate.totalGain.toLocaleString()} FEY` : "—"}
                        </p>
                        {geckoData && calculateGainsUSDValue() && (
                          <p className="mt-0.5 text-[10px] font-semibold text-accent sm:mt-1 sm:text-xs">
                            ≈ $
                            {calculateGainsUSDValue()?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USD
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Projected vAPR */}
                    {calculateEstimatedAnnualRate() !== null && (
                      <div className="flex flex-col justify-between gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-baseline sm:pb-4">
                        <div>
                          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                            Projected vAPR
                          </p>
                          <p
                            className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl lg:text-4xl"
                            style={{ fontSize: "clamp(1.5rem, 6vw, 2.25rem)" }}
                          >
                            {calculateEstimatedAnnualRate()?.toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                            variable annual rate
                          </p>
                          <p className="mt-0.5 text-[9px] italic text-muted-foreground sm:mt-1 sm:text-[10px]">
                            Based on current conversion ratio
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col justify-between gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-baseline sm:pb-4">
                      <div>
                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                          Current FEY Value (1M tokens staked = )
                        </p>
                        <p
                          className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl"
                          style={{ fontSize: "clamp(1.25rem, 5vw, 1.875rem)" }}
                        >
                          {currentRate ? currentRate.feyAmount.toLocaleString() : "—"}
                        </p>
                        {geckoData && calculateCurrentFeyUSD() && (
                          <p className="mt-0.5 text-[10px] font-semibold text-accent sm:mt-1 sm:text-xs">
                            ≈ $
                            {calculateCurrentFeyUSD()?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USD
                          </p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                          for 1M xFEY
                        </p>
                        {currentRate && (
                          <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-[10px]">
                            Updated: {new Date(currentRate.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
                      <div>
                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                          Conversion Rate
                        </p>
                        <p className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl">
                          {currentRate ? currentRate.conversionRate.toFixed(6) : "—"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:mb-1 sm:text-[11px]">
                          FEY per xFEY
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>{calculateTimeElapsed()} elapsed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="mb-6 overflow-hidden border-2 border-accent shadow-2xl sm:mb-8">
              <div className="border-b border-border bg-gradient-to-r from-accent/5 to-primary/5 p-4 sm:p-5 lg:p-6">
                <h2 className="text-base font-bold text-foreground sm:text-lg lg:text-xl">Percentage Gain Over Time</h2>
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs lg:text-sm">
                  Growth trajectory from 1:1 baseline (1M xFEY = 1M FEY) since Nov 1, 2025
                </p>
              </div>
              <div className="p-4 sm:p-5 lg:p-6">
                {historicalData.length > 0 ? (
                  <RateChart data={historicalData} />
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                    <div className="max-w-md text-center">
                      <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-sm">
                        Historical Data Collecting
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The daily cron job will begin collecting data points at midnight UTC. Check back soon to see
                        your growth trajectory visualized over time.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="mb-6 overflow-hidden border-2 border-accent shadow-2xl sm:mb-8">
              <div className="border-b-2 border-accent/30 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 p-4 sm:p-6 lg:p-7">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                      <span className="text-xl sm:text-2xl">🔥</span>
                      <h2 className="text-lg font-black tracking-tight text-foreground sm:text-xl lg:text-2xl">
                        WETH Buyback Engine
                      </h2>
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground sm:text-xs lg:text-sm">
                      Real buying pressure fueling FEY growth
                    </p>
                  </div>
                  {duneBuybackData && wethPrice && (
                    <div className="rounded-xl border-2 border-accent/40 bg-gradient-to-br from-accent/20 to-primary/15 px-4 py-3 shadow-xl sm:rounded-2xl sm:px-6 sm:py-4">
                      <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground sm:mb-1 sm:text-[10px]">
                        💎 Total Spent
                      </p>
                      <p
                        className="mb-0.5 bg-gradient-to-r from-accent to-primary bg-clip-text text-2xl font-black tracking-tight text-transparent sm:mb-1 sm:text-3xl lg:text-4xl"
                        style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)" }}
                      >
                        {duneBuybackData.totalWethBuyback.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </p>
                      <p className="mb-1.5 text-xs font-bold text-primary sm:mb-2 sm:text-sm">WETH</p>
                      {calculateWethBuybackUSD() && (
                        <div className="rounded-lg bg-accent/10 px-2.5 py-0.5 sm:px-3 sm:py-1">
                          <p className="text-center text-xs font-black text-accent sm:text-sm lg:text-base">
                            $
                            {calculateWethBuybackUSD()?.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative h-[300px] w-full bg-gradient-to-br from-muted/30 to-muted/10 sm:h-[400px] lg:h-[500px]">
                <iframe
                  src="https://dune.com/embeds/5734648/9307253"
                  className="h-full w-full border-0"
                  title="WETH Buybacks Chart"
                />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-muted/30 to-muted/50 p-4 shadow-lg sm:p-5 lg:p-6">
              <h3 className="mb-2 text-sm font-bold text-foreground sm:mb-3 sm:text-base lg:text-lg">
                About This Tracker
              </h3>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground sm:space-y-2 sm:text-xs lg:text-sm">
                <p>
                  This tracker monitors the conversion rate between xFEY (staked FEY) and FEY tokens by calling the{" "}
                  <code className="rounded bg-background px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                    previewRedeem
                  </code>{" "}
                  function on the Base blockchain every hour.
                </p>
                <p>
                  <strong className="font-semibold text-foreground">Baseline:</strong> The 1:1 ratio was established on
                  Nov 1, 2025 at 12:57:29 AM UTC when the contract launched.
                </p>
                <p>
                  <strong className="font-semibold text-foreground">Base Amount:</strong> 1,000,000 xFEY tokens are used
                  as the reference amount for tracking percentage gains.
                </p>
                <p>
                  <strong className="font-semibold text-foreground">Contract:</strong>{" "}
                  <code className="rounded bg-background px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                    0x72f5565ab147105614ca4eb83ecf15f751fd8c50
                  </code>
                </p>
              </div>
            </Card>
          </>
        )}
      </main>

      <footer className="mt-8 border-t border-border bg-card/50 backdrop-blur-sm sm:mt-12">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="space-y-2 text-center text-[10px] leading-relaxed text-muted-foreground sm:space-y-3 sm:text-xs lg:text-sm">
            <p className="font-semibold">
              Disclaimer: This tracker is not affiliated with{" "}
              <a
                href="https://fey.money"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary transition-colors hover:text-accent hover:underline"
              >
                Fey.money
              </a>
            </p>
            <p>
              Token price data powered by{" "}
              <a
                href="https://dexscreener.com/base/0xe155c517c53f078f4b443c99436e42c1b80fd2fb1b3508f431c46b8365e4f3f0"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary transition-colors hover:text-accent hover:underline"
              >
                Dexscreener
              </a>
            </p>
            <p>
              Dashboard credit:{" "}
              <a
                href="https://dune.com/0xwiz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary transition-colors hover:text-accent hover:underline"
              >
                0x wiz on Dune
              </a>
            </p>
            <p>
              Built by{" "}
              <a
                href="https://sadpepe.me"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary transition-colors hover:text-accent hover:underline"
              >
                Sadpepe.me
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
