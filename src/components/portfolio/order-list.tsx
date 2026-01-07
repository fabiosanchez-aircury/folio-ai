"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { deleteOrder, getOrders } from "@/lib/actions/orders";
import { AddOrderModal } from "./add-order-modal";
import type { Order } from "@prisma/client";

interface OrderListProps {
  portfolioId: string;
}

export function OrderList({ portfolioId }: OrderListProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingOrder, setIsAddingOrder] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders(portfolioId);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [portfolioId]);

  const handleDelete = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(orderId);
        router.refresh();
        await fetchOrders();
      } catch (error) {
        console.error("Failed to delete order:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-muted-foreground text-center py-6">Loading orders...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Orders</h3>
            <p className="text-sm text-muted-foreground">
              Track your buy and sell orders
            </p>
          </div>
          <Button onClick={() => setIsAddingOrder(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </div>
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border border-border rounded-lg">
              <p>No orders yet</p>
              <Button
                variant="link"
                onClick={() => setIsAddingOrder(true)}
                className="mt-2"
              >
                Create your first order
              </Button>
            </div>
          ) : (
            <div className="space-y-2 border border-border rounded-lg p-2">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground px-2 pb-2 border-b border-border">
                <div>Date</div>
                <div>Symbol</div>
                <div>Type</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Price</div>
                <div className="text-right">Total</div>
              </div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-6 gap-4 items-center px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm">
                    {new Date(order.executedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <p className="font-medium">{order.symbol}</p>
                    {order.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {order.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${order.orderType === "BUY"
                          ? "bg-chart-green/20 text-chart-green"
                          : "bg-chart-red/20 text-chart-red"
                        }`}
                    >
                      {order.orderType}
                    </span>
                  </div>
                  <div className="text-right font-mono text-sm">
                    {formatNumber(Number(order.quantity), 4)}
                  </div>
                  <div className="text-right font-mono text-sm">
                    {formatCurrency(Number(order.price))}
                  </div>
                  <div className="text-right font-mono text-sm font-medium">
                    {formatCurrency(
                      Number(order.quantity) * Number(order.price)
                    )}
                  </div>
                  {order.notes && (
                    <div className="col-span-6 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">{order.notes}</p>
                    </div>
                  )}
                  <div className="col-span-6 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(order.id)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAddingOrder && (
        <AddOrderModal
          portfolioId={portfolioId}
          onClose={() => {
            setIsAddingOrder(false);
            router.refresh();
            fetchOrders();
          }}
        />
      )}
    </>
  );
}

