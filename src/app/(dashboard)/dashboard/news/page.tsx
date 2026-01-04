import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewsContent } from "@/components/news/news-content";

async function getUserSymbols(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: {
        select: { symbol: true, type: true },
      },
    },
  });

  const symbols = new Set<string>();
  portfolios.forEach((p) => {
    p.assets.forEach((a) => {
      // Only add stock symbols for news (crypto news handled differently)
      if (a.type === "STOCK") {
        symbols.add(a.symbol);
      }
    });
  });

  return Array.from(symbols);
}

export default async function NewsPage() {
  const session = await auth();

  if (!session?.user) return null;

  const userSymbols = await getUserSymbols(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">News</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with the latest market news and insights
        </p>
      </div>

      <NewsContent userSymbols={userSymbols} />
    </div>
  );
}

