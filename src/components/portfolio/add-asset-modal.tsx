"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Search, TrendingUp, TrendingDown } from "lucide-react";
import { addAsset } from "@/lib/actions/portfolio";
import { PortfolioService } from "@/services";
import { formatCurrency } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: "CRYPTO" | "STOCK";
  image?: string;
}

interface AddAssetModalProps {
  portfolioId: string;
  onClose: () => void;
}

type InputMode = "quantity" | "value";

export function AddAssetModal({ portfolioId, onClose }: AddAssetModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);

  const [inputMode, setInputMode] = useState<InputMode>("quantity");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await PortfolioService.search(query);
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Fetch current price when asset is selected
  useEffect(() => {
    if (!selectedAsset) {
      setCurrentPrice(null);
      setPriceChange24h(null);
      return;
    }

    const fetchPrice = async () => {
      setIsFetchingPrice(true);
      try {
        const prices = await PortfolioService.getPrices(
          [selectedAsset.symbol],
          selectedAsset.type
        );
        if (prices.length > 0 && prices[0].currentPrice > 0) {
          setCurrentPrice(prices[0].currentPrice);
          setPriceChange24h(prices[0].priceChangePercent24h);
          // Pre-fill avg price with current price if empty
          if (!avgPrice) {
            setAvgPrice(prices[0].currentPrice.toString());
          }
        } else {
          // Price not available (coin may not have market data in CoinGecko)
          setCurrentPrice(null);
          setPriceChange24h(null);
        }
      } catch (err) {
        console.error("Price fetch error:", err);
        setCurrentPrice(null);
        setPriceChange24h(null);
      } finally {
        setIsFetchingPrice(false);
      }
    };

    fetchPrice();
  }, [selectedAsset]);

  // Calculate quantity from value or vice versa
  useEffect(() => {
    if (inputMode === "value" && totalValue && currentPrice && currentPrice > 0) {
      const calculatedQuantity = parseFloat(totalValue) / currentPrice;
      setQuantity(calculatedQuantity.toFixed(8));
    }
  }, [totalValue, currentPrice, inputMode]);

  const handleSelectAsset = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      setError("Please select an asset");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const finalQuantity = parseFloat(quantity);
      const finalAvgPrice = parseFloat(avgPrice) || currentPrice || 0;

      await addAsset({
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        type: selectedAsset.type,
        quantity: finalQuantity,
        avgPrice: finalAvgPrice,
        portfolioId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add asset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          {/* Search Section */}
          {!selectedAsset ? (
            <div className="space-y-2">
              <Label>Search Asset</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crypto or stocks..."
                  className="pl-9"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => handleSelectAsset(result)}
                    >
                      {result.image ? (
                        <img
                          src={result.image}
                          alt={result.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {result.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.symbol}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {result.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Asset Display */
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedAsset.image ? (
                    <img
                      src={selectedAsset.image}
                      alt={selectedAsset.name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {selectedAsset.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{selectedAsset.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {selectedAsset.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedAsset.name}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAsset(null)}
                >
                  Change
                </Button>
              </div>

              {/* Current Price */}
              {isFetchingPrice ? (
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Fetching price...</span>
                </div>
              ) : currentPrice !== null && currentPrice > 0 ? (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-lg font-semibold">{formatCurrency(currentPrice)}</span>
                  {priceChange24h !== null && (
                    <span
                      className={`flex items-center text-sm ${
                        priceChange24h >= 0 ? "text-chart-green" : "text-chart-red"
                      }`}
                    >
                      {priceChange24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {priceChange24h >= 0 ? "+" : ""}
                      {priceChange24h.toFixed(2)}%
                    </span>
                  )}
                </div>
              ) : !isFetchingPrice ? (
                <div className="mt-3 p-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p>Price data not available for this asset.</p>
                  <p className="text-xs mt-1">You can still add it manually by entering the average price.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Input Mode Toggle */}
          {selectedAsset && (
            <>
              <div className="space-y-2">
                <Label>Input Method</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={inputMode === "quantity" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setInputMode("quantity")}
                    disabled={isLoading}
                  >
                    By Quantity
                  </Button>
                  <Button
                    type="button"
                    variant={inputMode === "value" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setInputMode("value")}
                    disabled={isLoading || !currentPrice}
                  >
                    By Value
                  </Button>
                </div>
              </div>

              {inputMode === "quantity" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="any"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0.5"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgPrice">Avg Price (USD)</Label>
                    <Input
                      id="avgPrice"
                      type="number"
                      step="any"
                      min="0"
                      value={avgPrice}
                      onChange={(e) => setAvgPrice(e.target.value)}
                      placeholder={currentPrice?.toString() || "0"}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalValue">Total Value Invested (USD)</Label>
                    <Input
                      id="totalValue"
                      type="number"
                      step="any"
                      min="0"
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                      placeholder="1000"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {quantity && currentPrice && (
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      <p className="text-muted-foreground">
                        At current price of {formatCurrency(currentPrice)}, you will have:
                      </p>
                      <p className="font-semibold mt-1">
                        {parseFloat(quantity).toFixed(8)} {selectedAsset.symbol}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {quantity && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">Summary</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{parseFloat(quantity).toFixed(8)} {selectedAsset.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Price:</span>
                      <span>{formatCurrency(parseFloat(avgPrice) || currentPrice || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>
                        {formatCurrency(
                          parseFloat(quantity) * (parseFloat(avgPrice) || currentPrice || 0)
                        )}
                      </span>
                    </div>
                    {currentPrice && (
                      <div className="flex justify-between font-medium text-primary">
                        <span>Current Value:</span>
                        <span>{formatCurrency(parseFloat(quantity) * currentPrice)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !quantity}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Asset
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
