"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Trash2, Edit } from "lucide-react";
import { deleteAsset } from "@/lib/actions/portfolio";
import { EditAssetModal } from "./edit-asset-modal";
import type { Asset } from "@prisma/client";

interface AssetRowProps {
  asset: Asset;
}

export function AssetRow({ asset }: AssetRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  const quantity = Number(asset.quantity);
  const avgPrice = Number(asset.avgPrice);
  const value = quantity * avgPrice;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this asset?")) {
      await deleteAsset(asset.id);
    }
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-4 items-center px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div>
          <p className="font-medium">{asset.symbol}</p>
          {asset.name && (
            <p className="text-xs text-muted-foreground">{asset.name}</p>
          )}
        </div>
        <div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              asset.type === "CRYPTO"
                ? "bg-chart-orange/20 text-chart-orange"
                : "bg-chart-blue/20 text-chart-blue"
            }`}
          >
            {asset.type}
          </span>
        </div>
        <div className="text-right font-mono">{formatNumber(quantity, 4)}</div>
        <div className="text-right font-mono">{formatCurrency(avgPrice)}</div>
        <div className="text-right font-semibold">{formatCurrency(value)}</div>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditing && (
        <EditAssetModal asset={asset} onClose={() => setIsEditing(false)} />
      )}
    </>
  );
}

