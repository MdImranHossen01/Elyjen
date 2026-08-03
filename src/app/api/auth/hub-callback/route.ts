import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { encode } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const session = await auth();
  const url = new URL(req.url);
  let target = url.searchParams.get('target');
  
  // Strip 'www.' from target for consistency if present
  if (target && target.startsWith('www.')) {
    target = target.replace('www.', '');
  }

  console.log(`Hub Callback triggered. Target: ${target}, Session: ${!!session}`);

  if (!session || !session.user) {
    const loginUrl = target ? `/login?remote_tenant=${encodeURIComponent(target)}` : '/login';
    return NextResponse.redirect(new URL(loginUrl, req.url));
  }

  if (!target) {
    console.warn('Hub Callback: No target found, redirecting to hub dashboard');
    const isProd = process.env.NODE_ENV === 'production';
    const hubDashUrl = isProd 
      ? 'https://www.elyjen.shop/dashboard' 
      : new URL('/dashboard', req.url).toString();
    return NextResponse.redirect(hubDashUrl);
  }

  // Validate target to prevent Open Redirect attacks
  const hasProtocol = target.includes('://');
  const hasDotOrIsLocal = target.includes('.') || target.includes('localhost');
  const isAllowed = !hasProtocol && hasDotOrIsLocal;

  if (!isAllowed) {
    return NextResponse.redirect(new URL('/login?error=InvalidTarget', req.url));
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error('Hub Callback: NEXTAUTH_SECRET/AUTH_SECRET is not defined');
    return NextResponse.redirect(new URL('/login?error=ConfigurationError', req.url));
  }

  const isProd = process.env.NODE_ENV === 'production';
  const jwtSalt = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

  const token = await encode({
    token: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (session.user as any).role,
      exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration
    },
    secret,
    salt: jwtSalt,
  });

  const protocol = req.nextUrl.protocol;
  const bridgeUrl = `${protocol}//${target}/api/auth/bridge?token=${token}`;

  const response = NextResponse.redirect(bridgeUrl);
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

