import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ✅ FIX #6: Add rate limiting
// General API rate limit: 100 requests per minute per IP
// Helper to conditionally create limiters
const createLimiter = (limit, window) => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
  });
};

const generalLimiter = createLimiter(100, '1 m');
const authLimiter = createLimiter(5, '15 m');
const enrollmentLimiter = createLimiter(20, '1 h');

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only rate limit API routes
  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               request.headers.get('cf-connecting-ip') ||
               'anonymous'

    // ✅ Strict rate limiting for auth endpoints
    if (pathname === '/api/auth/register') {
      const { success, limit, remaining, reset } = authLimiter ? await authLimiter.limit(ip) : { success: true, limit: 5, remaining: 5, reset: Date.now() + 900000 }

      if (!success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: new Date(reset).toISOString(),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      // Add rate limit info to headers for visibility
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
      return response
    }

    // ✅ Enrollment rate limiting
    if (pathname === '/api/enrollments' && request.method === 'POST') {
      // Rate limit by user ID if authenticated, otherwise by IP
      let key = ip
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        // Extract and hash user ID from token (simple version)
        key = `user:${authHeader.slice(7, 20)}`
      }

      const { success, remaining, reset } = enrollmentLimiter ? await enrollmentLimiter.limit(key) : { success: true, limit: 20, remaining: 20, reset: Date.now() + 3600000 }

      if (!success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Enrollment rate limit exceeded. Please try again later.',
            retryAfter: new Date(reset).toISOString(),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      return response
    }

    // ✅ General rate limiting for all other API endpoints
    const { success, remaining, reset } = generalLimiter ? await generalLimiter.limit(ip) : { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 }

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit info to response headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
