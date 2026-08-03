import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=MissingToken', req.url));
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL('/login?error=ConfigurationError', req.url));
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

  try {
    const decoded = await decode({
      token,
      secret,
      salt: 'authjs.session-token', // Must match the salt used in hub-callback encode
    });

    const now = Math.floor(Date.now() / 1000);
    const isExpired = !decoded || typeof decoded.exp !== 'number' || decoded.exp < now;

    if (isExpired) {
       return NextResponse.redirect(new URL('/login?error=TokenExpired', req.url));
    }

    // Connect to DB to sync user for this tenant
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const domain = headersList.get('host') || 'unknown';

    const connectToDatabase = (await import('@/lib/db')).default;
    const User = (await import('@/models/User')).default;

    await connectToDatabase();

    if (decoded.email) {
      await User.findOneAndUpdate(
        { email: decoded.email, domain },
        {
          $setOnInsert: {
            name: decoded.name || 'Unknown',
            email: decoded.email,
            image: (decoded as any).picture || (decoded as any).image || '',
            role: (decoded as any).role || 'user',
            domain,
          }
        },
        { upsert: true }
      );
    }

    const cookieStore = await cookies();
    
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, 
    });

    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    console.error('Bridge Error:', error instanceof Error ? error.message : 'Auth bridge failed');
    return NextResponse.redirect(new URL('/login?error=BridgeFailed', req.url));
  }
}

