# FEY Staking Tracker

A real-time dashboard for monitoring FEY token staking rewards and xFEY to FEY conversion rates on Base blockchain.

## Features

- **Real-Time Exchange Rates**: Track the current xFEY to FEY conversion ratio updated every minute
- **Percentage Gains Over Time**: Historical chart showing conversion rate growth since launch (Nov 1, 2025)
- **Total Value Distributed**: Monitor total staking rewards and WETH buyback fuel
- **Staking Statistics**: View percentage of total supply staked and projected variable APR (vAPR)
- **Price Data**: Live FEY token price, market cap, liquidity, and 24h change via DexScreener
- **Embedded Analytics**: Dune Analytics charts for WETH buyback and FEY staking rewards

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Charts**: Recharts for data visualization
- **Hosting**: Vercel with hourly cron jobs

### Data Sources
- **Blockchain Data**: Base network via public RPC endpoints
- **Price Data**: DexScreener API for FEY token metrics
- **Analytics**: Dune Analytics for buyback and staking reward queries
- **On-Chain Contracts**:
  - xFEY Token: `0x72f5565ab147105614ca4eb83ecf15f751fd8c50`
  - Launch Block: 37584651

### API Endpoints
- `/api/fetch-rate` - Current xFEY:FEY conversion rate (60s cache)
- `/api/gecko` - FEY price data from DexScreener (60s cache)
- `/api/gecko-weth` - WETH price from CoinGecko (5min cache)
- `/api/dune` - Total FEY staking rewards from Dune (30min cache)
- `/api/dune-buyback` - WETH buyback data from Dune (30s cache)
- `/api/staked-supply` - Percentage of supply staked (5min cache)
- `/api/history` - Historical conversion rate data
- `/api/cron` - Hourly data collection job
- `/api/thegraph-volume` - Total DEX volume and TVL from The Graph (30min cache)

### Database Schema

**fey_rates** - Historical conversion rate tracking
\`\`\`sql
- id: bigint (primary key)
- conversion_rate: numeric
- timestamp: timestamptz
- xfey_amount: numeric
- fey_amount: numeric
- gains_percent: numeric
\`\`\`

**api_cache** - API response caching
\`\`\`sql
- id: bigint (primary key)
- cache_key: text (unique)
- data: jsonb
- expires_at: timestamptz
- created_at: timestamptz
\`\`\`

## Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Connect Supabase integration in Vercel dashboard
4. Add Dune API key to environment variables
5. Run database migrations from `/scripts` folder
6. Deploy to Vercel

## Cron Jobs

The `/api/cron` endpoint runs **every hour** to collect historical data points for the conversion rate chart. This is configured in `vercel.json`.

## Cache Strategy

- **Conversion Rate**: 60 seconds (frequent updates for main metric)
- **FEY Price**: 60 seconds (DexScreener data)
- **WETH Price**: 5 minutes (less volatile)
- **WETH Buyback**: 30 seconds (real-time buyback tracking)
- **Staking Rewards**: 30 minutes (slow-changing aggregate)
- **Staked Supply**: 5 minutes (on-chain calculation)
- **DEX Volume**: 30 minutes (The Graph subgraph data)

All cached data is stored in Supabase with automatic expiration.

## Credits

- **Dashboard Built By**: Feythful (Feythful.base.eth)
- **Token Price Data**: [DexScreener](https://dexscreener.com)
- **Analytics**: [Dune](https://dune.com) by wiz
- **FEY Protocol**: Not affiliated with Fey.money

## License

MIT
