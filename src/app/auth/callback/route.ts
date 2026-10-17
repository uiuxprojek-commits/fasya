import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as any;
  const next = searchParams.get('next');

  const supabase = await createClient();

  let verified = false;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) verified = true;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) verified = true;
  }

  if (verified) {
    const targetUrl = next || '/register?step=3';
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${targetUrl}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${targetUrl}`);
    } else {
      return NextResponse.redirect(`${origin}${targetUrl}`);
    }
  }

  // If code exchange failed or no code provided, redirect to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
