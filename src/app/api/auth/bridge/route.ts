import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=MissingToken', req.url));
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error('Bridge: Missing AUTH_SECRET/NEXTAUTH_SECRET');
    return NextResponse.redirect(new URL('/login?error=ConfigurationError', req.url));
  }

  const isProd = process.env.NODE_ENV === 'production';
  // Auth.js v5 uses the cookie name itself as the JWT salt
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const jwtSalt = cookieName;

  try {
    console.log('Bridge: Decoding token...');
    // Use the hub's salt (always 'authjs.session-token' on hub in prod = '__Secure-authjs.session-token')
    // Hub encoded the token with its own salt, so we must decode with the same.
    // Hub is always elyjen.shop (production), so its cookie name is __Secure-authjs.session-token
    const hubSalt = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const decoded = await decode({
      token,
      secret,
      salt: hubSalt,
    });

    if (!decoded) {
      console.error('Bridge: Token decoding failed (possibly wrong secret or salt)');
      return NextResponse.redirect(new URL('/login?error=TokenInvalid', req.url));
    }

    const now = Math.floor(Date.now() / 1000);
    const isExpired = typeof decoded.exp !== 'number' || decoded.exp < now;

    if (isExpired) {
      console.error('Bridge: Token expired');
      return NextResponse.redirect(new URL('/login?error=TokenExpired', req.url));
    }

    // Re-encode the token for a long-term session (30 days)
    const { encode } = await import('next-auth/jwt');
    // Re-encode with THIS tenant's salt (cookie name) so Auth.js on elyjen.shop can read it
    const sessionToken = await encode({
      token: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        image: decoded.image,
        role: (decoded as any).role,
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      secret,
      salt: jwtSalt, // Must match the cookie name on THIS tenant domain
    });

    // Connect to DB to sync user for this tenant
    const { getTenantDomain } = await import('@/lib/tenant');
    const domain = await getTenantDomain();

    console.log(`Bridge: Syncing user for domain: ${domain}`);

    try {
      const connectToDatabase = (await import('@/lib/db')).default;
      const User = (await import('@/models/User')).default;

      await connectToDatabase();

      if (decoded.email) {
        const userRole = decoded.email === 'imranshuvo101@gmail.com' ? 'super_admin' : ((decoded as any).role || 'user');
        
        await User.findOneAndUpdate(
          { email: decoded.email, domain },
          {
            $set: {
              name: decoded.name || 'Unknown',
              image: (decoded as any).picture || (decoded as any).image || '',
              role: userRole,
            },
            $setOnInsert: {
              email: decoded.email,
              domain,
            }
          },
          { upsert: true, new: true }
        );
        console.log(`Bridge: User synced as ${userRole} successfully`);
      }
    } catch (dbError) {
      console.error('Bridge: Database/User sync error:', dbError instanceof Error ? dbError.message : dbError);
    }

    // Redirect to the tenant's homepage, NOT the hub
    // IMPORTANT: Cookie MUST be set on the response object directly,
    // not via cookieStore.set() — that doesn't carry over to NextResponse.redirect()
    const tenantOrigin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const response = NextResponse.redirect(`${tenantOrigin}/`);
    
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.headers.set('Referrer-Policy', 'no-referrer');
    console.log(`Bridge: Cookie set on response. Redirecting to ${tenantOrigin}/`);
    return response;
  } catch (error) {
    console.error('Bridge Fatal Error:', error instanceof Error ? error.message : 'Auth bridge failed');
    return NextResponse.redirect(new URL('/login?error=BridgeFailed', req.url));
  }
}

