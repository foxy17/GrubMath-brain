import { Ratelimit } from "https://cdn.skypack.dev/@upstash/ratelimit@latest";
import { Redis } from "https://esm.sh/@upstash/redis@1.34.8";
import { Context, Next } from '@mastra/core/server/types';
import { getConnInfo } from '@hono/hono/deno';

const cache = new Map(); // must be outside of your serverless function handler

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(3, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
  ephemeralCache: cache,
  /**
   * Optional timeout for the ratelimit. This is useful if you want to avoid the ratelimit
   * from blocking the event loop. The default timeout is 1000ms.
   * If redis request timeout is reached, the ratelimit will allow the request to pass.
   */
  timeout: 1000,
});

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  const connInfo = getConnInfo(c);
  const ip = connInfo.remote.address;
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
  }
  await next();
};



