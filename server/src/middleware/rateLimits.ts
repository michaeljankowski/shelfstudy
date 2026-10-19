import 'dotenv/config';
import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
if (process.env.NODE_ENV === 'production' && !redisUrl) {
  throw new Error('REDIS_URL is required in production so rate limits work across API replicas');
}

const redis = redisUrl ? createClient({ url: redisUrl }) : null;
if (redis) {
  redis.on('error', (error) => console.error('Rate-limit Redis error:', error));
  await redis.connect();
}

const makeStore = (prefix: string) => redis ? new RedisStore({
  prefix,
  sendCommand: (...args: string[]) => redis.sendCommand(args),
}) : undefined;
const keyGenerator = (req: Request) => req.userId ?? ipKeyGenerator(req.ip ?? 'unknown');
const common = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  keyGenerator,
  handler: (_req: unknown, res: any) => res.status(429).json({ error: 'Too many requests. Please try again shortly.' }),
};

export const apiRateLimit = rateLimit({ ...common, store: makeStore('shelfstudy:api:'), windowMs: 15 * 60_000, limit: 600 });
export const aiRateLimit = rateLimit({ ...common, store: makeStore('shelfstudy:ai:'), windowMs: 60_000, limit: 30 });
export const uploadRateLimit = rateLimit({ ...common, store: makeStore('shelfstudy:upload:'), windowMs: 15 * 60_000, limit: 60 });
