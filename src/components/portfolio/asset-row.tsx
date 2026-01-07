"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onUpdate?: () => void;
}

export function AssetRow({ asset, liveData, isLoading, onUpdate }: AssetRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const quantity = Number(asset.quantity);
  const currentPrice = liveData?.currentPrice ?? 0;
  const currentValue = liveData?.currentValue ?? 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAsset(asset.id);
      router.refresh();
      onUpdate?.();
    } catch (error) {
      console.error("Failed to delete asset:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEditClose = () => {
    setIsEditing(false);
    router.refresh();
    onUpdate?.();
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-4 items-center px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
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
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditing && (
        <EditAssetModal 
          asset={asset} 
          onClose={handleEditClose}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {asset.symbol}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
