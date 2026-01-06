"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Trash2, Edit } from "lucide-react";
import { deleteAsset } from "@/lib/actions/portfolio";
import { EditAssetModal } from "./edit-asset-modal";
import type { Asset } from "@prisma/client";

interface LiveAssetData {
  id: string;
  symbol: string;
  name: string | null;
  type: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
}

interface AssetRowProps {
  asset: Asset;
  liveData?: LiveAssetData;
  isLoading?: boolean;
}

export function AssetRow({ asset, liveData, isLoading }: AssetRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  const quantity = Number(asset.quantity);
  const currentPrice = liveData?.currentPrice ?? 0;
  const currentValue = liveData?.currentValue ?? 0;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this asset?")) {
      await deleteAsset(asset.id);
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4 items-center px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div>
          <p className="font-medium">{asset.symbol}</p>
          {asset.name && (
            <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
          )}
        </div>
        <div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${asset.type === "CRYPTO"
                ? "bg-chart-orange/20 text-chart-orange"
                : "bg-chart-blue/20 text-chart-blue"
              }`}
          >
            {asset.type}
          </span>
        </div>
        <div className="text-right font-mono text-sm">{formatNumber(quantity, 4)}</div>
        <div className="text-right font-mono text-sm">
          {isLoading ? (
            <span className="inline-block h-4 w-16 bg-muted animate-pulse rounded" />
          ) : currentPrice > 0 ? (
            formatCurrency(currentPrice)
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </div>

      {isEditing && (
        <EditAssetModal asset={asset} onClose={() => setIsEditing(false)} />
      )}
    </>
  );
}
