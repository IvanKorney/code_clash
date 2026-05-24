import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type MemEntry = { count: number; resetAt: number };
const memStore = new Map<string, MemEntry>();

const inMemoryLimit = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
};

type Window = `${number} ms` | `${number} s` | `${number} m`;

const msToWindow = (ms: number): Window => {
  if (ms % 60_000 === 0) return `${ms / 60_000} m`;
  if (ms % 1_000 === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
};

const redisLimiters = new Map<string, Ratelimit>();

const getRedisLimiter = (limit: number, windowMs: number): Ratelimit => {
  const cacheKey = `${limit}:${windowMs}`;
  if (!redisLimiters.has(cacheKey)) {
    redisLimiters.set(
      cacheKey,
      new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.fixedWindow(limit, msToWindow(windowMs)),
        prefix: "cc:rl",
      }),
    );
  }
  return redisLimiters.get(cacheKey)!;
};

export const rateLimit = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> => {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return inMemoryLimit(key, limit, windowMs);
  }
  const { success } = await getRedisLimiter(limit, windowMs).limit(key);
  return success;
};
