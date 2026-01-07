<div align="center">
  <img src="public/images/folio-ai.png" alt="FolioAI Logo" width="120" />
  <h1>FolioAI</h1>
  <p><strong>A centralized portfolio tracker for cryptocurrencies and stocks with AI-powered insights.</strong></p>
</div>

## About

FolioAI helps you monitor all your investments in one place. Track your crypto and stock holdings, get personalized news affecting your assets, and receive AI-guided insights based on market trends and historical data.

> ⚠️ **Disclaimer**: AI insights are for informational purposes only and do not constitute financial advice.

## Features

- 📊 **Unified Portfolio** - Track crypto and stocks in a single dashboard
- 📰 **Personalized News** - Get news relevant to your holdings
- 🤖 **AI Assistant** - Chat with AI about your portfolio and market trends
- 📈 **Interactive Charts** - Visualize asset performance with TradingView charts
- 🔗 **Exchange Integration** - Connect to Binance and other platforms

## Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Frontend       | Next.js 14, React 19, TypeScript, TailwindCSS, shadcn/ui |
| Charts         | TradingView Lightweight Charts                           |
| Backend        | Next.js API Routes, Prisma ORM                           |
| Database       | PostgreSQL                                               |
| Cache          | Redis                                                    |
| AI             | Google Gemini (via Vercel AI SDK)                        |
| Auth           | NextAuth.js                                              |
| Infrastructure | Docker Compose                                           |

## Getting Started

```bash
# Clone and start
docker-compose up -d

# Run migrations and seed data
docker exec folio-ai-app yarn db:push
docker exec folio-ai-app yarn db:seed

# Access at http://localhost:3000
```

## Test Accounts

| Email           | Password    |
| --------------- | ----------- |
| crypto@test.com | password123 |
| stocks@test.com | password123 |
| demo@test.com   | password123 |

## Environment Variables

Create a `.env` file with:

```env
FINNHUB_API_KEY=your_key
FINNHUB_API_KEY=your_key
GOOGLE_GENERATIVE_AI_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id        # Optional: for Google OAuth
GOOGLE_CLIENT_SECRET=your_secret
```

## License

MIT
