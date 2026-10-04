import { createRateLimitStore } from './rateLimitStore';

/** One shared limiter store for every HTTP route in this server process. */
export const runtimeRateLimitStore = createRateLimitStore();
