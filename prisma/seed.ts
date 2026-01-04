import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users
  const password = await hash("password123", 12);

  // User 1: Crypto focused investor
  const user1 = await prisma.user.upsert({
    where: { email: "crypto@test.com" },
    update: {},
    create: {
      id: "user-crypto-001",
      email: "crypto@test.com",
      name: "Crypto Trader",
      emailVerified: true,
      accounts: {
        create: {
          id: "account-crypto-001",
          accountId: "crypto@test.com",
          providerId: "credential",
          password,
        },
      },
    },
  });

  // User 2: Stock focused investor
  const user2 = await prisma.user.upsert({
    where: { email: "stocks@test.com" },
    update: {},
    create: {
      id: "user-stocks-001",
      email: "stocks@test.com",
      name: "Stock Investor",
      emailVerified: true,
      accounts: {
        create: {
          id: "account-stocks-001",
          accountId: "stocks@test.com",
          providerId: "credential",
          password,
        },
      },
    },
  });

  // User 3: Mixed portfolio
  const user3 = await prisma.user.upsert({
    where: { email: "demo@test.com" },
    update: {},
    create: {
      id: "user-demo-001",
      email: "demo@test.com",
      name: "Demo User",
      emailVerified: true,
      accounts: {
        create: {
          id: "account-demo-001",
          accountId: "demo@test.com",
          providerId: "credential",
          password,
        },
      },
    },
  });

  console.log("✅ Users created");

  // Create portfolios and assets for User 1 (Crypto)
  const cryptoPortfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio-crypto-001" },
    update: {},
    create: {
      id: "portfolio-crypto-001",
      name: "Crypto Holdings",
      description: "Long-term crypto investments",
      userId: user1.id,
      assets: {
        create: [
          {
            symbol: "BTC",
            name: "Bitcoin",
            type: "CRYPTO",
            quantity: 1.5,
            avgPrice: 42000,
          },
          {
            symbol: "ETH",
            name: "Ethereum",
            type: "CRYPTO",
            quantity: 10,
            avgPrice: 2200,
          },
          {
            symbol: "SOL",
            name: "Solana",
            type: "CRYPTO",
            quantity: 50,
            avgPrice: 95,
          },
          {
            symbol: "LINK",
            name: "Chainlink",
            type: "CRYPTO",
            quantity: 200,
            avgPrice: 14,
          },
        ],
      },
    },
  });

  // Create portfolios and assets for User 2 (Stocks)
  const stocksPortfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio-stocks-001" },
    update: {},
    create: {
      id: "portfolio-stocks-001",
      name: "Tech Stocks",
      description: "Technology sector investments",
      userId: user2.id,
      assets: {
        create: [
          {
            symbol: "AAPL",
            name: "Apple Inc.",
            type: "STOCK",
            quantity: 50,
            avgPrice: 175,
          },
          {
            symbol: "MSFT",
            name: "Microsoft Corporation",
            type: "STOCK",
            quantity: 30,
            avgPrice: 380,
          },
          {
            symbol: "GOOGL",
            name: "Alphabet Inc.",
            type: "STOCK",
            quantity: 20,
            avgPrice: 140,
          },
          {
            symbol: "NVDA",
            name: "NVIDIA Corporation",
            type: "STOCK",
            quantity: 15,
            avgPrice: 480,
          },
          {
            symbol: "TSLA",
            name: "Tesla Inc.",
            type: "STOCK",
            quantity: 25,
            avgPrice: 245,
          },
        ],
      },
    },
  });

  const dividendPortfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio-dividend-001" },
    update: {},
    create: {
      id: "portfolio-dividend-001",
      name: "Dividend Portfolio",
      description: "Stable dividend stocks",
      userId: user2.id,
      assets: {
        create: [
          {
            symbol: "JNJ",
            name: "Johnson & Johnson",
            type: "STOCK",
            quantity: 40,
            avgPrice: 155,
          },
          {
            symbol: "KO",
            name: "Coca-Cola Company",
            type: "STOCK",
            quantity: 100,
            avgPrice: 58,
          },
        ],
      },
    },
  });

  // Create portfolios and assets for User 3 (Mixed - Demo)
  const mixedPortfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio-mixed-001" },
    update: {},
    create: {
      id: "portfolio-mixed-001",
      name: "My Portfolio",
      description: "Mixed crypto and stocks",
      userId: user3.id,
      assets: {
        create: [
          {
            symbol: "BTC",
            name: "Bitcoin",
            type: "CRYPTO",
            quantity: 0.5,
            avgPrice: 45000,
          },
          {
            symbol: "ETH",
            name: "Ethereum",
            type: "CRYPTO",
            quantity: 5,
            avgPrice: 2400,
          },
          {
            symbol: "AAPL",
            name: "Apple Inc.",
            type: "STOCK",
            quantity: 20,
            avgPrice: 180,
          },
          {
            symbol: "AMZN",
            name: "Amazon.com Inc.",
            type: "STOCK",
            quantity: 10,
            avgPrice: 175,
          },
        ],
      },
    },
  });

  const altcoinPortfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio-altcoin-001" },
    update: {},
    create: {
      id: "portfolio-altcoin-001",
      name: "Altcoins",
      description: "High risk altcoin bets",
      userId: user3.id,
      assets: {
        create: [
          {
            symbol: "DOGE",
            name: "Dogecoin",
            type: "CRYPTO",
            quantity: 10000,
            avgPrice: 0.08,
          },
          {
            symbol: "ADA",
            name: "Cardano",
            type: "CRYPTO",
            quantity: 2000,
            avgPrice: 0.45,
          },
          {
            symbol: "DOT",
            name: "Polkadot",
            type: "CRYPTO",
            quantity: 150,
            avgPrice: 6.5,
          },
        ],
      },
    },
  });

  console.log("✅ Portfolios and assets created");

  console.log("\n📋 Test Accounts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Email: crypto@test.com    | Password: password123 | Crypto focused");
  console.log("Email: stocks@test.com    | Password: password123 | Stocks focused");
  console.log("Email: demo@test.com      | Password: password123 | Mixed portfolio");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

