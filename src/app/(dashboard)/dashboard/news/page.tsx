import { auth } from "@/lib/auth";
import { getUserSymbolsWithType, getUserPortfolios, getUserDefaultNewsPortfolio } from "@/lib/queries";
import { NewsContent } from "@/components/news/news-content";

export default async function NewsPage() {
  const session = await auth();

  if (!session?.user) return null;

  const [userSymbolsWithType, portfolios, defaultPortfolio] = await Promise.all([
    getUserSymbolsWithType(session.user.id),
    getUserPortfolios(session.user.id),
    getUserDefaultNewsPortfolio(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">News</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with the latest market news and insights
        </p>
      </div>

      <NewsContent
        userSymbols={userSymbolsWithType}
        portfolios={portfolios}
        defaultPortfolioId={defaultPortfolio?.id || null}
      />
    </div>
  );
}
