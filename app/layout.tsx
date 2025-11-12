import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FEY Staking Tracker | Monitor xFEY to FEY Conversion Rates",
  description:
    "Track your FEY token staking rewards and conversion rates in real-time. Monitor percentage gains from the 1:1 baseline and view total rewards distributed to stakers.",
  keywords: ["FEY", "xFEY", "staking", "crypto", "rewards", "Base", "blockchain", "DeFi"],
  openGraph: {
    title: "FEY Staking Tracker",
    description: "Track FEY staking rewards and conversion rates in real-time",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FEY Staking Tracker",
    description: "Track FEY staking rewards and conversion rates in real-time",
  },
  icons: {
    icon: [
      { url: "/fey-logo.png?v=3", sizes: "any" },
      { url: "/fey-logo.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/fey-logo.png?v=3", sizes: "16x16", type: "image/png" },
    ],
    apple: "/fey-logo.png?v=3",
    shortcut: "/fey-logo.png?v=3",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
