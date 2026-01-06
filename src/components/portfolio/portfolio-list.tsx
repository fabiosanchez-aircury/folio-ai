"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, Trash2, Edit, Plus, RefreshCw } from "lucide-react";
import { deletePortfolio } from "@/lib/actions/portfolio";
import { AddAssetModal } from "./add-asset-modal";
import { EditPortfolioModal } from "./edit-portfolio-modal";
import { AssetRow } from "./asset-row";
import { OrderList } from "./order-list";
import type { Asset, Portfolio } from "@prisma/client";
import api from "@/services/api";

type PortfolioWithAssets = Portfolio & { assets: Asset[] };

interface PortfolioWithValues {
  id: string;
  name: string;
  totalValue: number;
  assets: Array<{
    id: string;
    symbol: string;
    name: string | null;
    type: string;
    quantity: number;
    currentPrice: number;
    currentValue: number;
  }>;
}

interface PortfolioListProps {
  portfolios: PortfolioWithAssets[];
}

export function PortfolioList({ portfolios: initialPortfolios }: PortfolioListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialPortfolios.slice(0, 1).map((p) => p.id))
  );
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioWithAssets | null>(null);
  const [addingAssetTo, setAddingAssetTo] = useState<string | null>(null);

  const [portfoliosWithValues, setPortfoliosWithValues] = useState<PortfolioWithValues[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchValues = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ portfolios: PortfolioWithValues[] }>("/portfolio/values");
      setPortfoliosWithValues(response.data.portfolios);
    } catch (error) {
      console.error("Failed to fetch portfolio values:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValues();
    const interval = setInterval(fetchValues, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this portfolio?")) {
      await deletePortfolio(id);
    }
  };

  if (initialPortfolios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have any portfolios yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create your first portfolio to start tracking your investments
          </p>
        </CardContent>
      </Card>
    );
  }

  // Merge initial data with live values
  const displayPortfolios = initialPortfolios.map((portfolio) => {
    const liveData = portfoliosWithValues.find((p) => p.id === portfolio.id);
    return { portfolio, liveData };
  });

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchValues}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh prices
        </Button>
      </div>

      <div className="space-y-4">
        {displayPortfolios.map(({ portfolio, liveData }) => {
          const isExpanded = expandedIds.has(portfolio.id);

          // Use live data if available
          const totalValue = liveData?.totalValue ?? 0;

          return (
            <Card key={portfolio.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => toggleExpanded(portfolio.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      {portfolio.description && (
                        <p className="text-sm text-muted-foreground">
                          {portfolio.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {isLoading ? (
                          <span className="inline-block h-6 w-20 bg-muted animate-pulse rounded" />
                        ) : (
                          formatCurrency(totalValue)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {portfolio.assets.length} assets
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAddingAssetTo(portfolio.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPortfolio(portfolio)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(portfolio.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  {portfolio.assets.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No assets in this portfolio</p>
                      <Button
                        variant="link"
                        onClick={() => setAddingAssetTo(portfolio.id)}
                      >
                        Add your first asset
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground px-2 pb-2 border-b border-border">
                        <div>Symbol</div>
                        <div>Type</div>
                        <div className="text-right">Quantity</div>
                        <div className="text-right">Current</div>
                      </div>
                      {portfolio.assets.map((asset) => {
                        const liveAsset = liveData?.assets.find((a) => a.id === asset.id);
                        return (
                          <AssetRow
                            key={asset.id}
                            asset={asset}
                            liveData={liveAsset}
                            isLoading={isLoading}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}

              {/* Orders Section */}
              {isExpanded && (
                <div className="px-6 pb-6">
                  <OrderList portfolioId={portfolio.id} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {editingPortfolio && (
        <EditPortfolioModal
          portfolio={editingPortfolio}
          onClose={() => setEditingPortfolio(null)}
        />
      )}

      {addingAssetTo && (
        <AddAssetModal
          portfolioId={addingAssetTo}
          onClose={() => setAddingAssetTo(null)}
        />
      )}
    </>
  );
}
