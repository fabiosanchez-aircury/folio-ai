"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { Search, ExternalLink, Newspaper, Loader2, Clock } from "lucide-react";
import api from "@/services/api";

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

interface NewsContentProps {
  userSymbols: string[];
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

export function NewsContent({ userSymbols }: NewsContentProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("week");
  const [category, setCategory] = useState("general");

  const fetchNews = async (symbol?: string) => {
    setIsLoading(true);
    setError("");

    try {
      const params: Record<string, string> = {};
      if (symbol) {
        params.symbol = symbol;

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

  useEffect(() => {
    if (activeSymbol) {
      fetchNews(activeSymbol);
    } else {
      fetchNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol, timeFilter, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      setActiveSymbol(searchSymbol.toUpperCase());
      setSearchSymbol("");
    }
  };

  return (
    <div className="space-y-6">
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

          {/* Category Filters (only when not searching specific symbol) */}
          {!activeSymbol && (
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
            onClick={() => setActiveSymbol(null)}
          >
            All News
          </Button>
          {userSymbols.map((symbol) => (
            <Button
              key={symbol}
              variant={activeSymbol === symbol ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveSymbol(symbol)}
            >
              {symbol}
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
            onClick={() => setActiveSymbol(null)}
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

