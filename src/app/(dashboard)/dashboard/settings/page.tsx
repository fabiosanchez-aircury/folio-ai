import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BinanceConnect } from "@/components/settings/binance-connect";
import { formatDateTime } from "@/lib/utils";

async function getApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      platform: true,
      lastSync: true,
      createdAt: true,
    },
  });
}

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) return null;

  const apiKeys = await getApiKeys(session.user.id);
  const binanceKey = apiKeys.find((k) => k.platform === "BINANCE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and connected platforms
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{session.user.name || "Not set"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Binance Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 126 126" fill="none">
              <path
                d="M63 0L77.3 14.3L41 50.6L26.7 36.3L63 0Z"
                fill="#F3BA2F"
              />
              <path
                d="M85.3 22.3L99.6 36.6L63.3 72.9L49 58.6L85.3 22.3Z"
                fill="#F3BA2F"
              />
              <path
                d="M107.6 44.6L121.9 58.9L85.6 95.2L71.3 80.9L107.6 44.6Z"
                fill="#F3BA2F"
              />
              <path
                d="M41 72.9L55.3 87.2L19 123.5L4.7 109.2L41 72.9Z"
                fill="#F3BA2F"
              />
              <path
                d="M63 50.6L77.3 64.9L63 79.2L48.7 64.9L63 50.6Z"
                fill="#F3BA2F"
              />
            </svg>
            Binance
          </CardTitle>
          <CardDescription>
            Connect your Binance account to automatically sync your crypto holdings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BinanceConnect
            isConnected={!!binanceKey}
            lastSync={binanceKey?.lastSync}
          />
          {binanceKey && (
            <p className="text-sm text-muted-foreground mt-4">
              Connected since {formatDateTime(binanceKey.createdAt)}
              {binanceKey.lastSync && (
                <> • Last synced {formatDateTime(binanceKey.lastSync)}</>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* API Keys Info */}
      <Card>
        <CardHeader>
          <CardTitle>API Security</CardTitle>
          <CardDescription>
            Information about your connected platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Security Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Only use read-only API keys</li>
              <li>• Never share your API secrets</li>
              <li>• Enable IP restrictions on your exchange</li>
              <li>• Regularly rotate your API keys</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

