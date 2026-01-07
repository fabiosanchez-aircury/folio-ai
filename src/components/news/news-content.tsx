"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { Search, ExternalLink, Newspaper, Loader2, Clock, Briefcase } from "lucide-react";
import api from "@/services/api";
import { updateDefaultNewsPortfolio } from "@/lib/actions/news";
import { useRouter } from "next/navigation";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  symbols: string[];
  category: string;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  assets: Array<{
    symbol: string;
    type: string;
  }>;
}

interface NewsContentProps {
  userSymbols: Array<{ symbol: string; type: string }>;
  portfolios: Portfolio[];
  defaultPortfolioId: string | null;
}

const timeFilters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const categories = [
  { label: "General", value: "general" },
  { label: "Forex", value: "forex" },
  { label: "Crypto", value: "crypto" },
  { label: "Merger", value: "merger" },
];

export function NewsContent({ userSymbols, portfolios, defaultPortfolioId }: NewsContentProps) {
  const router = useRouter();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [activeSymbolType, setActiveSymbolType] = useState<string | null>(null);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(defaultPortfolioId);
  const [timeFilter, setTimeFilter] = useState("week");
  const [category, setCategory] = useState("general");

  const fetchNews = async (symbol?: string, portfolioId?: string | null) => {
    setIsLoading(true);
    setError("");

    try {
      const params: Record<string, string> = {};

      if (portfolioId) {
        params.portfolioId = portfolioId;

        // Calculate date range based on time filter
        const now = new Date();
        let from: Date;

        switch (timeFilter) {
          case "today":
            from = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        params.from = from.toISOString().split("T")[0];
        params.to = new Date().toISOString().split("T")[0];
      } else if (symbol) {
        params.symbol = symbol;
        if (activeSymbolType) {
          params.symbolType = activeSymbolType;
        }

        // Calculate date range based on time filter
        const now = new Date();
        let from: Date;

        switch (timeFilter) {
          case "today":
            from = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        params.from = from.toISOString().split("T")[0];
        params.to = new Date().toISOString().split("T")[0];
      } else {
        params.category = category;
      }

      const response = await api.get<{ news?: NewsArticle[]; error?: string }>("/news", {
        params,
      });

      if (response.data.error) {
        setError(response.data.error);
        setNews([]);
      } else {
        setNews(response.data.news || []);
      }
    } catch {
      setError("Failed to fetch news");
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioSelect = async (portfolioId: string | null) => {
    setActivePortfolioId(portfolioId);
    setActiveSymbol(null);
    setActiveSymbolType(null);

    // Save as default preference
    if (portfolioId) {
      await updateDefaultNewsPortfolio(portfolioId);
    } else {
      await updateDefaultNewsPortfolio(null);
    }

    router.refresh();
    fetchNews(undefined, portfolioId);
  };

  useEffect(() => {
    if (activeSymbol) {
      fetchNews(activeSymbol, null);
    } else if (activePortfolioId) {
      fetchNews(undefined, activePortfolioId);
    } else {
      fetchNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol, activePortfolioId, timeFilter, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      const symbolUpper = searchSymbol.toUpperCase();
      // Try to find the symbol type from userSymbols
      const symbolData = userSymbols.find((s) => s.symbol === symbolUpper);
      setActiveSymbol(symbolUpper);
      setActiveSymbolType(symbolData?.type || null);
      setActivePortfolioId(null);
      setSearchSymbol("");
    }
  };

  const selectedPortfolio = portfolios.find((p) => p.id === activePortfolioId);
  const portfolioStockSymbols = selectedPortfolio
    ? selectedPortfolio.assets.filter((a) => a.type === "STOCK").map((a) => a.symbol)
    : [];

  return (
    <div className="space-y-6">
      {/* Portfolio Selector */}
      {portfolios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Portfolio News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activePortfolioId === null ? "default" : "outline"}
                size="sm"
                onClick={() => handlePortfolioSelect(null)}
              >
                All News
              </Button>
              {portfolios.map((portfolio) => {
                const stockCount = portfolio.assets.filter((a) => a.type === "STOCK").length;
                const cryptoCount = portfolio.assets.filter((a) => a.type === "CRYPTO").length;
                const totalCount = stockCount + cryptoCount;
                return (
                  <Button
                    key={portfolio.id}
                    variant={activePortfolioId === portfolio.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePortfolioSelect(portfolio.id)}
                  >
                    {portfolio.name}
                    {totalCount > 0 && (
                      <span className="ml-2 text-xs opacity-70">
                        ({stockCount > 0 ? `${stockCount}S` : ""}{stockCount > 0 && cryptoCount > 0 ? "/" : ""}{cryptoCount > 0 ? `${cryptoCount}C` : ""})
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            {selectedPortfolio && (
              <>
                {portfolioStockSymbols.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Stocks: {portfolioStockSymbols.join(", ")}
                  </p>
                )}
                {selectedPortfolio.assets.filter((a) => a.type === "CRYPTO").length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Crypto: {selectedPortfolio.assets.filter((a) => a.type === "CRYPTO").map((a) => a.symbol).join(", ")}
                  </p>
                )}
                {portfolioStockSymbols.length === 0 && selectedPortfolio.assets.filter((a) => a.type === "CRYPTO").length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    This portfolio has no assets. Add stocks or crypto to see related news.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="Search by symbol (AAPL, TSLA...)"
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Time Filters */}
          <div className="flex gap-1">
            {timeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Category Filters (only when not searching specific symbol or portfolio) */}
          {!activeSymbol && !activePortfolioId && (
            <div className="flex gap-1">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Symbols Quick Access */}
      {userSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-2">
            Your assets:
          </span>
          <Button
            variant={!activeSymbol ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setActiveSymbol(null);
              setActiveSymbolType(null);
            }}
          >
            All News
          </Button>
          {userSymbols.map((symbolData) => (
            <Button
              key={symbolData.symbol}
              variant={activeSymbol === symbolData.symbol ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setActiveSymbol(symbolData.symbol);
                setActiveSymbolType(symbolData.type);
                setActivePortfolioId(null);
              }}
            >
              {symbolData.symbol}
            </Button>
          ))}
        </div>
      )}

      {/* Active Filter Display */}
      {activeSymbol && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing news for:
          </span>
          <span className="font-semibold">{activeSymbol}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveSymbol(null);
              setActiveSymbolType(null);
              if (activePortfolioId) {
                fetchNews(undefined, activePortfolioId);
              } else {
                fetchNews();
              }
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {/* News Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure FINNHUB_API_KEY is configured in your environment.
            </p>
          </CardContent>
        </Card>
      ) : news.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No news found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term or time period
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article) => (
            <Card key={article.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              {article.imageUrl && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-2">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{article.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(article.publishedAt)}
                  </span>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

