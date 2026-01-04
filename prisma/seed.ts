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
          { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", quantity: 1.5, avgPrice: 42000 },
          { symbol: "ETH", name: "Ethereum", type: "CRYPTO", quantity: 10, avgPrice: 2200 },
          { symbol: "SOL", name: "Solana", type: "CRYPTO", quantity: 50, avgPrice: 95 },
          { symbol: "LINK", name: "Chainlink", type: "CRYPTO", quantity: 200, avgPrice: 14 },
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
          { symbol: "AAPL", name: "Apple Inc.", type: "STOCK", quantity: 50, avgPrice: 175 },
          { symbol: "MSFT", name: "Microsoft", type: "STOCK", quantity: 30, avgPrice: 380 },
          { symbol: "GOOGL", name: "Alphabet", type: "STOCK", quantity: 20, avgPrice: 140 },
          { symbol: "NVDA", name: "NVIDIA", type: "STOCK", quantity: 15, avgPrice: 480 },
          { symbol: "TSLA", name: "Tesla", type: "STOCK", quantity: 25, avgPrice: 245 },
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
          { symbol: "JNJ", name: "Johnson & Johnson", type: "STOCK", quantity: 40, avgPrice: 155 },
          { symbol: "KO", name: "Coca-Cola", type: "STOCK", quantity: 100, avgPrice: 58 },
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
          { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", quantity: 0.5, avgPrice: 45000 },
          { symbol: "ETH", name: "Ethereum", type: "CRYPTO", quantity: 5, avgPrice: 2400 },
          { symbol: "AAPL", name: "Apple Inc.", type: "STOCK", quantity: 20, avgPrice: 180 },
          { symbol: "AMZN", name: "Amazon", type: "STOCK", quantity: 10, avgPrice: 175 },
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
          { symbol: "DOGE", name: "Dogecoin", type: "CRYPTO", quantity: 10000, avgPrice: 0.08 },
          { symbol: "ADA", name: "Cardano", type: "CRYPTO", quantity: 2000, avgPrice: 0.45 },
          { symbol: "DOT", name: "Polkadot", type: "CRYPTO", quantity: 150, avgPrice: 6.5 },
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
