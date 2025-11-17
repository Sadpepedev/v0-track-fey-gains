"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { RateChart } from "@/components/rate-chart"
import { Percent, Clock } from 'lucide-react'
import { DataCollector } from "@/components/data-collector"

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

interface TheGraphVolumeData {
  volumeUSD: number
  txCount: number
  totalValueLockedUSD: number
  token0Symbol: string
  token1Symbol: string
  lastUpdated: number
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
  const [thegraphVolume, setThegraphVolume] = useState<TheGraphVolumeData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentRate = async () => {
    try {
      const response = await fetch("/api/fetch-rate")
      const data = await response.json()

      if (!data.error) {
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

  const fetchTheGraphVolume = async () => {
    try {
      const response = await fetch("/api/thegraph-volume")
      const data = await response.json()

      if (!data.error) {
        setThegraphVolume(data)
      }
    } catch (error) {
      console.error("Failed to fetch The Graph volume data:", error)
    }
  }

  useEffect(() => {
    fetchHistory()
    fetchDuneData()
    fetchDuneBuybackData()
    fetchGeckoData()
    fetchWethPrice()
    fetchStakedSupply()
    fetchTheGraphVolume()
    const currentRateInterval = setInterval(fetchCurrentRate, 60 * 1000) // 1 minute
    const historyInterval = setInterval(fetchHistory, 30 * 60 * 1000) // 30 minutes
    const duneInterval = setInterval(fetchDuneData, 60 * 60 * 1000) // 1 hour
    const duneBuybackInterval = setInterval(fetchDuneBuybackData, 60 * 60 * 1000) // 1 hour
    const geckoInterval = setInterval(fetchGeckoData, 60 * 1000) // 1 minute
    const wethPriceInterval = setInterval(fetchWethPrice, 5 * 60 * 1000) // 5 minutes
    const stakedSupplyInterval = setInterval(fetchStakedSupply, 5 * 60 * 1000) // 5 minutes
    const thegraphInterval = setInterval(fetchTheGraphVolume, 30 * 60 * 1000) // 30 minutes
    return () => {
      clearInterval(currentRateInterval)
      clearInterval(historyInterval)
      clearInterval(duneInterval)
      clearInterval(duneBuybackInterval)
      clearInterval(geckoInterval)
      clearInterval(wethPriceInterval)
      clearInterval(stakedSupplyInterval)
      clearInterval(thegraphInterval)
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center justify-between flex-row">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg glow-accent-sm bg-ring text-primary">
                <span className="text-xl sm:text-2xl font-black text-accent-foreground">F</span>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-primary">
                  FEY Dashboard
                </h1>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Real-time staking analytics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent glow-accent" />
              <p className="text-sm font-medium text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {geckoData && stakedSupply && (
              <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* FEY Price */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-lg transition-all hover:border-accent/50 hover:glow-accent-sm">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/5 blur-3xl" />
                  <div className="relative">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground">FEY Price</p>
                    <p className="mb-1 text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-primary">
                      ${geckoData.priceUSD.toFixed(8)}
                    </p>
                    {geckoData.priceChange24h !== null && typeof geckoData.priceChange24h === "number" && (
                      <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-2 rounded-lg bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5">
                        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">24h</span>
                        <span
                          className={`text-xs sm:text-sm font-black ${
                            geckoData.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {geckoData.priceChange24h >= 0 ? "+" : ""}
                          {geckoData.priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Cap */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-lg transition-all hover:border-primary/50 hover:glow-primary">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-3xl" />
                  <div className="relative">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground">Market Cap</p>
                    <p className="mb-1 text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-primary">
                      {geckoData.fdvUSD && typeof geckoData.fdvUSD === "number"
                        ? `$${(geckoData.fdvUSD / 1000000).toFixed(3)}M`
                        : "N/A"}
                    </p>
                    
                  </div>
                </div>

                {/* Total Volume */}
                {thegraphVolume && (
                  <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-lg transition-all hover:border-accent/50 hover:glow-accent-sm">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/5 blur-3xl" />
                    <div className="relative">
                      <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground">Total Volume</p>
                      <p className="mb-1 text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-primary">
                        ${(thegraphVolume.volumeUSD / 1000000).toFixed(2)}M
                      </p>
                      <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1 rounded-lg bg-muted/50 px-2 sm:px-3 py-1.5 sm:py-2">
                        <p className="text-[10px] sm:text-xs font-semibold text-card-foreground">
                          TVL: ${(thegraphVolume.totalValueLockedUSD / 1000).toFixed(1)}K
                        </p>
                        <p className="text-[10px] sm:text-xs font-semibold text-foreground">
                          {thegraphVolume.txCount.toLocaleString()} txns
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staked % */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-lg transition-all hover:border-primary/50 hover:glow-primary">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-3xl" />
                  <div className="relative">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground">Staked</p>
                    <p className="mb-1 text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-primary">
                      {stakedSupply.percentageStaked && typeof stakedSupply.percentageStaked === "number"
                        ? stakedSupply.percentageStaked.toFixed(2)
                        : "0.00"}
                      %
                    </p>
                    <div className="mt-2 sm:mt-3 rounded-lg bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5">
                      <p className="text-[10px] sm:text-xs font-semibold text-foreground">
                        {stakedSupply.totalStaked && typeof stakedSupply.totalStaked === "number"
                          ? `${(stakedSupply.totalStaked / 1000000000).toFixed(2)}B FEY`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-primary/5 p-5 sm:p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-6 sm:mb-8 text-center">
                <h2 className="mb-2 bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent">
                  Total Value Distributed
                </h2>
                <div className="mx-auto h-px w-32 sm:w-48 bg-gradient-to-r from-transparent via-accent to-transparent" />
              </div>

              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {/* FEY Rewards */}
                {duneData && geckoData && calculateTotalAwardedUSD() && (
                  <div className="group relative overflow-hidden rounded-2xl border bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-accent hover:glow-accent-sm border-primary-foreground">
                    <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-accent/10 blur-3xl" />
                    <div className="relative text-center">
                      <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-accent bg-primary">Staking Rewards</p>
                      <p className="mb-2 text-4xl sm:text-5xl font-black tracking-tight border-primary text-primary">
                        {duneData.totalFeyAwarded.toLocaleString()}
                      </p>
                      <p className="mb-4 text-sm sm:text-base font-semibold text-foreground">FEY Tokens</p>
                      <div className="rounded-xl bg-accent/10 px-4 py-3">
                        <p className="text-2xl sm:text-3xl font-black text-primary bg-card">
                          $
                          {calculateTotalAwardedUSD()?.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          USD
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* WETH Buybacks */}
                {duneBuybackData && wethPrice && calculateWethBuybackUSD() && (
                  <div className="group relative overflow-hidden rounded-2xl border bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-primary hover:glow-primary border-primary-foreground">
                    <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative text-center">
                      <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-card bg-primary">Weth used for buybacks</p>
                      <p className="mb-2 text-4xl sm:text-5xl font-black tracking-tight text-primary">
                        {duneBuybackData.totalWethBuyback.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </p>
                      <p className="mb-4 text-sm sm:text-base font-semibold text-foreground">WETH</p>
                      <div className="rounded-xl px-4 py-3 bg-card">
                        <p className="text-2xl sm:text-3xl font-black text-primary bg-card">
                          $
                          {calculateWethBuybackUSD()?.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          USD
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs font-medium text-muted-foreground">Since Nov 1, 2025</p>
            </div>

            <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-2xl">
              <div className="border-b border-border bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">Current Exchange Rate</h3>
                <p className="mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground">xFEY to FEY conversion metrics</p>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Percentage Gain */}
                  <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-6">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Percentage Gain
                    </p>
                    <p className="mb-1 bg-gradient-to-r from-accent to-primary bg-clip-text text-4xl sm:text-5xl font-black text-primary">
                      {currentRate ? `${currentRate.percentageGain.toFixed(4)}%` : "—"}
                    </p>
                  </div>

                  {/* Projected vAPR */}
                  {calculateEstimatedAnnualRate() !== null && (
                    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6 border-card text-secondary-foreground">
                      <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Projected vAPR
                      </p>
                      <p className="mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl sm:text-5xl font-black text-primary">
                        {calculateEstimatedAnnualRate()?.toFixed(2)}%
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-foreground">Variable annual rate</p>
                    </div>
                  )}

                  {/* Current FEY Value */}
                  <div className="rounded-2xl border border-border bg-muted/30 p-6">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Current Value (1M xFEY)
                    </p>
                    <p className="mb-1 text-4xl sm:text-5xl font-black text-primary">
                      {currentRate ? currentRate.feyAmount.toLocaleString() : "—"}
                    </p>
                    {geckoData && calculateCurrentFeyUSD() && (
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        ≈ $
                        {calculateCurrentFeyUSD()?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USD
                      </p>
                    )}
                  </div>

                  {/* Conversion Rate */}
                  <div className="rounded-2xl border border-border bg-muted/30 p-6">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Conversion Rate
                    </p>
                    <p className="mb-1 text-3xl sm:text-4xl font-black text-foreground">
                      {currentRate ? currentRate.conversionRate.toFixed(6) : "—"}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">FEY per xFEY</p>
                  </div>

                  {/* Time Elapsed */}
                  <div className="rounded-2xl border border-border bg-muted/30 p-6 md:col-span-2 lg:col-span-2">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Time Elapsed
                    </p>
                    <p className="mb-1 text-3xl sm:text-4xl font-black text-foreground">{calculateTimeElapsed()}</p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Since launch (Nov 1, 2025)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-2xl">
              <div className="border-b border-border bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">WETH Buybacks</h3>
                    <p className="mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground">Continuous buying pressure</p>
                  </div>
                  {duneBuybackData && wethPrice && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 sm:px-4 py-2">
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground">Total Spent</p>
                      <p className="text-sm sm:text-lg font-black text-card-foreground">
                        {duneBuybackData.totalWethBuyback.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        WETH
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative h-[300px] sm:h-[400px] w-full bg-muted/10">
                <iframe src="https://dune.com/embeds/6193023/9884738" className="h-full w-full border-0" />
              </div>
            </div>

            <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-2xl">
              <div className="border-b border-border bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-4 sm:p-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">FEY Staking Rewards</h3>
                  <p className="mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground">
                    Total FEY distributed to stakers
                  </p>
                </div>
              </div>
              <div className="relative h-[300px] sm:h-[400px] w-full bg-muted/10">
                <iframe src="https://dune.com/embeds/6192852/9884506" className="h-full w-full border-0" />
              </div>
            </div>

            <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl border border-border/50 bg-muted/30 p-4 sm:p-6 shadow-lg">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-black text-foreground">About This Tracker</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                <p>
                  This tracker monitors the conversion rate between xFEY (staked FEY) and FEY tokens by calling the{" "}
                  <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs sm:text-sm font-semibold text-foreground">
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
                  <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs sm:text-sm font-semibold text-primary">
                    0x72f5565ab147105614ca4eb83ecf15f751fd8c50
                  </code>
                </p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border border-border/50 bg-muted/30 p-3 sm:p-4 text-center">
              <p className="mb-2 sm:mb-3 text-[10px] sm:text-xs italic text-primary">Your spare FEY can go a long way</p>
              <div className="mx-auto max-w-md space-y-1.5 sm:space-y-2">
                <div className="rounded-lg bg-card px-2 sm:px-3 py-1.5 sm:py-2">
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase text-muted-foreground">BNS</p>
                  <p className="text-xs sm:text-sm font-bold text-destructive">Feythful.base.eth</p>
                </div>
                <div className="rounded-lg bg-card px-2 sm:px-3 py-1.5 sm:py-2">
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase text-muted-foreground">Address</p>
                  <p className="break-all font-mono text-[10px] sm:text-xs font-semibold text-destructive">
                    0x83a07D79E7c33cD8C8D03AE43028b067bE020668
                  </p>
                </div>
              </div>
              <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-muted-foreground">Thank you for supporting community tools! 🙏</p>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="space-y-1.5 sm:space-y-2 text-center text-[10px] sm:text-xs text-muted-foreground">
            <p>
              Disclaimer: This tracker is not affiliated with{" "}
              <a href="https://fey.money" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-primary">
                Fey.money
              </a>
            </p>
            <p>
              Token price data powered by{" "}
              <a
                href="https://dexscreener.com/base/0xe155c517c53f078f4b443c99436e42c1b80fd2fb1b3508f431c46b8365e4f3f0"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline text-primary"
              >
                Dexscreener
              </a>
            </p>
            <p>
              Dashboard credit:{" "}
              <a href="https://dune.com/0xwiz" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-primary">
                0x wiz on Dune
              </a>
            </p>
            <p>
              Built by{" "}
              <a href="https://sadpepe.me" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-primary">
                Sadpepe.me
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
