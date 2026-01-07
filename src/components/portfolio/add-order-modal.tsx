"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Search } from "lucide-react";
import { createOrder } from "@/lib/actions/orders";
import PortfolioService, { type SearchResult } from "@/services/portfolio";
import { formatCurrency } from "@/lib/utils";
import { debounce } from "@/lib/utils";

type AssetType = "CRYPTO" | "STOCK";
type OrderType = "BUY" | "SELL";

interface AddOrderModalProps {
  portfolioId: string;
  onClose: () => void;
}

export function AddOrderModal({ portfolioId, onClose }: AddOrderModalProps) {
  const router = useRouter();
  const [assetType, setAssetType] = useState<AssetType>("CRYPTO");
  const [orderType, setOrderType] = useState<OrderType>("BUY");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);

  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [executedAt, setExecutedAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState("");

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load default popular assets
  const loadDefaultAssets = useCallback(async (type: "CRYPTO" | "STOCK") => {
    setIsLoadingDefaults(true);
    try {
      const results = await PortfolioService.getPopular(type);
      setSearchResults(results);
    } catch (err) {
      console.error("Failed to load default assets:", err);
      setSearchResults([]);
    } finally {
      setIsLoadingDefaults(false);
    }
  }, []);

  // Load defaults on mount and when type changes
  useEffect(() => {
    if (!selectedAsset && searchQuery.length === 0) {
      loadDefaultAssets(assetType);
    }
  }, [assetType, selectedAsset, searchQuery, loadDefaultAssets]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string, type: "CRYPTO" | "STOCK") => {
      if (query.length < 2) {
        await loadDefaultAssets(type);
        return;
      }

      setIsSearching(true);
      try {
        const results = await PortfolioService.search(query, type);
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [loadDefaultAssets]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, assetType);
  }, [searchQuery, assetType, debouncedSearch]);

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
          // Pre-fill price with current price if empty
          if (!price) {
            setPrice(prices[0].currentPrice.toString());
          }
        } else {
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
  }, [selectedAsset, price]);

  const handleSelectAsset = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleTypeChange = (type: "CRYPTO" | "STOCK") => {
    setAssetType(type);
    setSearchQuery("");
    setSelectedAsset(null);
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
      await createOrder({
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        type: selectedAsset.type,
        orderType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        portfolioId,
        executedAt: new Date(executedAt),
        notes: notes || undefined,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Order</h2>
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

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={orderType === "BUY" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setOrderType("BUY")}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={orderType === "SELL" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setOrderType("SELL")}
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Asset Type Filter */}
          <div className="space-y-2">
            <Label>Asset Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={assetType === "CRYPTO" ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleTypeChange("CRYPTO")}
              >
                Crypto
              </Button>
              <Button
                type="button"
                variant={assetType === "STOCK" ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleTypeChange("STOCK")}
              >
                Stock
              </Button>
            </div>
          </div>

          {/* Asset Search */}
          {!selectedAsset ? (
            <div className="space-y-2">
              <Label htmlFor="search">Search Asset</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-10"
                  placeholder={`Search ${assetType.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Search Results */}
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                {isLoadingDefaults ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading popular assets...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {searchResults.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelectAsset(asset)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                      >
                        {asset.image && (
                          <img
                            src={asset.image}
                            alt={asset.name}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedAsset.image && (
                    <img
                      src={selectedAsset.image}
                      alt={selectedAsset.name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedAsset.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAsset.name}
                    </p>
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

              {currentPrice && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Price:</span>
                    <span className="font-medium">
                      {formatCurrency(currentPrice)}
                    </span>
                  </div>
                  {priceChange24h !== null && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">24h Change:</span>
                      <span
                        className={
                          priceChange24h >= 0
                            ? "text-chart-green"
                            : "text-chart-red"
                        }
                      >
                        {priceChange24h >= 0 ? "+" : ""}
                        {priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Details */}
          {selectedAsset && (
            <>
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
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="any"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={currentPrice?.toString() || "0"}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executedAt">Execution Date</Label>
                <Input
                  id="executedAt"
                  type="datetime-local"
                  value={executedAt}
                  onChange={(e) => setExecutedAt(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this order..."
                  disabled={isLoading}
                />
              </div>

              {/* Summary */}
              {quantity && price && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">Order Summary</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>
                        {parseFloat(quantity).toFixed(8)} {selectedAsset.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span>{formatCurrency(parseFloat(price))}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Value:</span>
                      <span>
                        {formatCurrency(
                          parseFloat(quantity) * parseFloat(price)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedAsset}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

