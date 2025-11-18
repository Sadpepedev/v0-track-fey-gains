# FEY Staking Tracker

A real-time dashboard for monitoring FEY token staking rewards and xFEY to FEY conversion rates on Base blockchain. Live at [trackfey.app](https://www.trackfey.app/)

## Features

- **Real-Time Exchange Rates**: Track the current xFEY to FEY conversion ratio updated every minute
- **Total Value Distributed**: Monitor total staking rewards and WETH buyback fuel with live USD values
- **Staking Statistics**: View percentage of total supply staked and projected variable APR (vAPR)
- **Price Data**: Live FEY token price, market cap, and 24h change via DexScreener API
- **DEX Volume**: Total trading volume and liquidity from The Graph subgraph
- **Embedded Analytics**: Dune Analytics charts for WETH buyback and FEY staking rewards
- **Premium Dark Theme**: Modern crypto dashboard aesthetic with lime green branding
- **Mobile Optimized**: Fully responsive design with touch-friendly interactions

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React Server Components
- **Database**: Supabase (PostgreSQL) with automated caching
- **Blockchain**: Base network via Alchemy and public RPC endpoints
- **Styling**: Tailwind CSS v4 with custom design system and glassmorphism effects
- **Charts**: Recharts for data visualization, Dune embeds for analytics
- **Hosting**: Vercel with hourly cron jobs for data collection
- **TypeScript**: Full type safety across the application

### Data Sources
- **Blockchain Data**: Base network RPC for on-chain conversion rates
- **Price Data**: DexScreener API for FEY token metrics and market data
- **DEX Analytics**: The Graph subgraph for volume, liquidity, and transaction counts
- **Staking Analytics**: Dune Analytics queries for buyback and reward tracking
- **WETH Price**: CoinGecko API for USD conversions
- **On-Chain Contracts**:
  - xFEY Token: `0x72f5565ab147105614ca4eb83ecf15f751fd8c50`
  - Launch Block: 37584651
  - Launch Date: November 1, 2025 at 12:57:29 AM UTC

### API Endpoints

All endpoints use Supabase caching to minimize external API calls and improve performance.

- `/api/fetch-rate` - Current xFEY:FEY conversion rate via `previewRedeem` (60s cache)
- `/api/gecko` - FEY price data from DexScreener (60s cache)
- `/api/gecko-weth` - WETH price from CoinGecko (5min cache)
- `/api/dune` - Total FEY staking rewards from Dune query (30min cache)
- `/api/dune-buyback` - WETH buyback data from Dune query (30s cache)
- `/api/staked-supply` - Percentage of supply staked via on-chain calculation (5min cache)
- `/api/thegraph-volume` - Total DEX volume and TVL from The Graph (30min cache)
- `/api/history` - Historical conversion rate data from database
- `/api/cron` - Hourly data collection job (Vercel Cron)
- `/api/collect-data` - Manual data collection for development/testing
- `/api/cron-dune-refresh` - Runs **every 8 hours** (midnight, 8am, 4pm UTC) to refresh staking rewards data

## Database Schema

**fey_rates** - Historical conversion rate tracking
\`\`\`sql
CREATE TABLE fey_rates (
  id BIGSERIAL PRIMARY KEY,
  conversion_rate NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  xfey_amount NUMERIC NOT NULL,
  fey_amount NUMERIC NOT NULL,
  gains_percent NUMERIC NOT NULL
);
CREATE INDEX idx_fey_rates_timestamp ON fey_rates(timestamp DESC);
\`\`\`

**api_cache** - API response caching with TTL
\`\`\`sql
CREATE TABLE api_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
\`\`\`

## Environment Variables

Required environment variables (automatically configured with integrations):

\`\`\`env
# Supabase (Database & Caching)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Dune Analytics
DUNE_API_KEY=

# The Graph (DEX Volume)
THEGRAPH_API_KEY=

# Alchemy (Optional - for faster RPC)
ALCHEMY_API_KEY=

# Vercel Cron Security (auto-generated in production)
# CRON_SECRET is automatically set by Vercel - do not add manually
\`\`\`

## Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd fey-tracker
   npm install
   \`\`\`

2. **Configure Integrations**
   - Connect Supabase integration in Vercel dashboard
   - Add Dune API key to environment variables
   - Add The Graph API key to environment variables
   - (Optional) Add Alchemy API key for improved RPC performance

3. **Run Database Migrations**
   - Execute scripts in `/scripts` folder in order:
     - `001_create_fey_rates_table.sql`
     - `002_create_cache_tables.sql`

4. **Deploy to Vercel**
   \`\`\`bash
   vercel --prod
   \`\`\`

5. **Configure Supabase for Production**
   - Go to Supabase → Authentication → URL Configuration
   - Add your production domain to Site URL
   - Add `https://yourdomain.com/**` to Redirect URLs

## Cron Jobs

One cron job runs automatically in production via Vercel Cron:

**Historical Data Collection** (`/api/cron`) - Runs **every hour** to collect conversion rate data points for historical tracking

Configuration in `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    }
  ]
}
\`\`\`

## Cache Strategy

Aggressive caching minimizes API costs and improves performance:

| Data Source | Cache Duration | Reason |
|------------|----------------|--------|
| Conversion Rate | 60 seconds | Frequent updates for main metric |
| FEY Price | 60 seconds | Real-time price tracking |
| WETH Price | 5 minutes | Less volatile asset |
| WETH Buyback | 30 seconds | Real-time buyback tracking |
| Staking Rewards | 30 minutes | Dune materialized views |
| Staked Supply | 5 minutes | On-chain calculation |
| DEX Volume | 30 minutes | The Graph subgraph data |

All cached data is stored in Supabase with automatic expiration via `expires_at` timestamp.

## Design System

### Color Palette
- **Accent**: Lime green (hue 130) for primary actions and highlights
- **Primary**: Purple-blue (hue 250) for secondary emphasis
- **Background**: Dark theme (oklch 0.12) with subtle gradients
- **Card**: Elevated dark (oklch 0.16) with glassmorphism

### Typography
- **Headings**: Black weight (900) with tight tracking
- **Data**: Bold to Black weights for emphasis
- **Body**: Medium weight (500) for readability

### Effects
- **Glassmorphism**: Backdrop blur on header and cards
- **Glow**: Subtle shadows on interactive elements
- **Gradients**: Used sparingly for text and backgrounds

## Mobile Optimization

- Responsive grid layouts (2 columns mobile, 4 columns desktop)
- Touch-friendly tap targets (minimum 44px)
- Optimized font sizes with smooth scaling
- Reduced padding on small screens
- Horizontal scrolling for wide content
- Optimized iframe heights for mobile viewports

## Credits

- **Dashboard Built By**: Feythful (Feythful.base.eth / 0x83a07D79E7c33cD8C8D03AE43028b067bE020668)
- **Token Price Data**: [DexScreener](https://dexscreener.com)
- **Analytics**: [Dune](https://dune.com) by wiz
- **DEX Data**: [The Graph](https://thegraph.com)
- **FEY Protocol**: Not affiliated with [Fey.money](https://fey.money)

## License

MIT
