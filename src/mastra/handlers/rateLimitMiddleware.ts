import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Context, Next } from '@mastra/core/server/types';
import process from 'node:process';

const cache = new Map(); // must be outside of your serverless function handler

/**
 * Get conninfo with Deno
 * @param c Context
 * @returns ConnInfo
 */
export const getConnInfo = (c: Context) => {
  const { remoteAddr } = c.env;
  return {
    remote: {
      address: remoteAddr.hostname,
      port: remoteAddr.port,
      transport: remoteAddr.transport,
    },
  };
};

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.fixedWindow(3, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit',
  ephemeralCache: cache,
  /**
   * Optional timeout for the ratelimit. This is useful if you want to avoid the ratelimit
   * from blocking the event loop. The default timeout is 1000ms.
   * If redis request timeout is reached, the ratelimit will allow the request to pass.
   */
  timeout: 1000,
});

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  // const connInfo = getConnInfo(c);
  console.log('connInfo', c.env);
  const ip = 'connInfo.remote.address';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return c.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      429,
    );
  }
  await next();
};
