"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveApiKey, deleteApiKey, syncBinancePortfolio } from "@/lib/actions/binance";
import { Loader2, Link2, Link2Off, RefreshCw, Check } from "lucide-react";

interface BinanceConnectProps {
  isConnected: boolean;
  lastSync?: Date | null;
}

export function BinanceConnect({ isConnected, lastSync }: BinanceConnectProps) {
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await saveApiKey({
        platform: "BINANCE",
        apiKey,
        apiSecret,
      });
      setSuccess("Connected successfully!");
      setShowForm(false);
      setApiKey("");
      setApiSecret("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Binance?")) return;

    setIsLoading(true);
    try {
      await deleteApiKey("BINANCE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError("");
    setSuccess("");

    try {
      const result = await syncBinancePortfolio();
      setSuccess(`Synced ${result.assetsCount} assets successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isConnected && !showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-chart-green">
          <Check className="h-5 w-5" />
          <span className="font-medium">Connected</span>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-chart-green bg-chart-green/10 border border-chart-green/20 rounded-lg">
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Now
          </Button>
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Update Keys
          </Button>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="text-destructive hover:text-destructive"
          >
            <Link2Off className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm && !isConnected ? (
        <Button onClick={() => setShowForm(true)}>
          <Link2 className="h-4 w-4 mr-2" />
          Connect Binance
        </Button>
      ) : (
        <form onSubmit={handleConnect} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-4 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-2">How to get your API keys:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Log in to your Binance account</li>
              <li>Go to API Management</li>
              <li>Create a new API key (read-only)</li>
              <li>Copy your API Key and Secret</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Binance API key"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your Binance API secret"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isConnected ? "Update" : "Connect"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setApiKey("");
                setApiSecret("");
                setError("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

