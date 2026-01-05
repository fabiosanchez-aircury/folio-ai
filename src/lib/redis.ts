import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  PRICE: 60, // 1 minute
  NEWS: 60 * 15, // 15 minutes
  MARKET: 60 * 5, // 5 minutes
};

// Cache key generators
export const cacheKey = {
  price: (symbol: string) => `price:${symbol}`,
  news: (symbol: string) => `news:${symbol}`,
  market: () => "market:overview",
};

export default redis;

