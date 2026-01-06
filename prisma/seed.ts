import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.asset.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Cleaned existing data");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create users
  const cryptoUser = await prisma.user.create({
    data: {
      email: "crypto@test.com",
      name: "Crypto Trader",
      password: hashedPassword,
    },
  });

  const stocksUser = await prisma.user.create({
    data: {
      email: "stocks@test.com",
      name: "Stock Investor",
      password: hashedPassword,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@test.com",
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log("✅ Users created");

  // Create portfolios
  await prisma.portfolio.create({
    data: {
      name: "Crypto Holdings",
      description: "Long-term crypto investments",
      userId: cryptoUser.id,
      assets: {
        create: [
          {
            symbol: "BTC",
            name: "Bitcoin",
            type: "CRYPTO",
            quantity: 1.5,
          } as any,
          {
            symbol: "ETH",
            name: "Ethereum",
            type: "CRYPTO",
            quantity: 10,
          } as any,
          {
            symbol: "SOL",
            name: "Solana",
            type: "CRYPTO",
            quantity: 50,
          } as any,
          {
            symbol: "LINK",
            name: "Chainlink",
            type: "CRYPTO",
            quantity: 200,
          } as any,
        ],
      },
    },
  });

  await prisma.portfolio.create({
    data: {
      name: "Tech Stocks",
      description: "Technology sector investments",
      userId: stocksUser.id,
      assets: {
        create: [
          {
            symbol: "AAPL",
            name: "Apple Inc.",
            type: "STOCK",
            quantity: 50,
          } as any,
          {
            symbol: "MSFT",
            name: "Microsoft",
            type: "STOCK",
            quantity: 30,
          } as any,
          {
            symbol: "GOOGL",
            name: "Alphabet",
            type: "STOCK",
            quantity: 20,
          } as any,
          {
            symbol: "NVDA",
            name: "NVIDIA",
            type: "STOCK",
            quantity: 15,
          } as any,
          { symbol: "TSLA", name: "Tesla", type: "STOCK", quantity: 25 } as any,
        ],
      },
    },
  });

  await prisma.portfolio.create({
    data: {
      name: "Dividend Portfolio",
      description: "Stable dividend stocks",
      userId: stocksUser.id,
      assets: {
        create: [
          {
            symbol: "JNJ",
            name: "Johnson & Johnson",
            type: "STOCK",
            quantity: 40,
          } as any,
          {
            symbol: "KO",
            name: "Coca-Cola",
            type: "STOCK",
            quantity: 100,
          } as any,
        ],
      },
    },
  });

  await prisma.portfolio.create({
    data: {
      name: "My Portfolio",
      description: "Mixed crypto and stocks",
      userId: demoUser.id,
      assets: {
        create: [
          {
            symbol: "BTC",
            name: "Bitcoin",
            type: "CRYPTO",
            quantity: 0.5,
          } as any,
          {
            symbol: "ETH",
            name: "Ethereum",
            type: "CRYPTO",
            quantity: 5,
          } as any,
          {
            symbol: "AAPL",
            name: "Apple Inc.",
            type: "STOCK",
            quantity: 20,
          } as any,
          {
            symbol: "AMZN",
            name: "Amazon",
            type: "STOCK",
            quantity: 10,
          } as any,
        ],
      },
    },
  });

  await prisma.portfolio.create({
    data: {
      name: "Altcoins",
      description: "High risk altcoin bets",
      userId: demoUser.id,
      assets: {
        create: [
          {
            symbol: "DOGE",
            name: "Dogecoin",
            type: "CRYPTO",
            quantity: 10000,
          } as any,
          {
            symbol: "ADA",
            name: "Cardano",
            type: "CRYPTO",
            quantity: 2000,
          } as any,
          {
            symbol: "DOT",
            name: "Polkadot",
            type: "CRYPTO",
            quantity: 150,
          } as any,
        ],
      },
    },
  });

  console.log("✅ Portfolios created");

  console.log("\n📋 Test Accounts (password: password123):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("• crypto@test.com  - Crypto portfolio");
  console.log("• stocks@test.com  - Stock portfolios");
  console.log("• demo@test.com    - Mixed portfolio");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🎉 Done!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
