import { ipAddress, next } from '@vercel/edge';
import { NextResponse } from '@vercel/edge';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// rate limiter: 1 request per 15 minutes per IP
const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(1, '15 m'),
});

// apply the middleware to send-email endpoint
const config = {
    matcher: '/api/send-email',
};

async function middleware(request: Request) {
    try {
        // get the user's IP address
        const ip = ipAddress(request) || '127.0.0.1';

        // apply the rate limit per IP
        const { success, limit, remaining, reset } = await ratelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. You can send 1 email per 15 minutes.',
                    limit,
                    remaining,
                    reset,
                },
                { status: 429 }
            );
        }

        return next();
    } catch (err) {
        console.error('Rate limiting middleware error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}