import { auth } from "@/lib/auth";
import { getUserSymbols, getUserPortfolios, getUserDefaultNewsPortfolio } from "@/lib/queries";
import { NewsContent } from "@/components/news/news-content";

export default async function NewsPage() {
  const session = await auth();

  if (!session?.user) return null;

  const [userSymbols, portfolios, defaultPortfolio] = await Promise.all([
    getUserSymbols(session.user.id),
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
        userSymbols={userSymbols}
        portfolios={portfolios}
        defaultPortfolioId={defaultPortfolio?.id || null}
      />
    </div>
  );
}
