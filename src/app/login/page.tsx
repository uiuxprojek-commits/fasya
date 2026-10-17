'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_callback_failed') {
      setErrorMessage('Autentikasi gagal atau sesi login telah kedaluwarsa. Silakan coba masuk kembali.');
    } else if (errorParam === 'unauthorized_admin') {
      setErrorMessage('Akses ditolak: Anda tidak memiliki wewenang administrator.');
    } else if (errorParam === 'email_unverified' || errorParam === 'email_not_confirmed') {
      setErrorMessage('Email Anda belum diverifikasi. Silakan selesaikan proses verifikasi OTP.');
    }
  }, [searchParams, initialEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setErrorMessage('Email atau kata sandi tidak cocok. Silakan periksa kembali.');
        } else if (err.message.includes('Email not confirmed')) {
          setErrorMessage('Email Anda belum dikonfirmasi. Silakan periksa kotak masuk atau spam email Anda.');
        } else if (err.message.includes('fetch')) {
          setErrorMessage('Gagal menghubungi server Supabase. Pastikan koneksi internet Anda aktif.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Terjadi kesalahan saat masuk. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google OAuth error:', err);
      setErrorMessage('Gagal memulai login Google. Pastikan Google Provider sudah diaktifkan di Supabase Dashboard.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/25">
              T
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Tata<span className="text-orange-500">Dana</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            Catat keuangan semudah chat langsung dari Telegram kamu.
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg shadow-slate-900/5 border-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Masuk ke Akun Anda</CardTitle>
            <CardDescription>
              Akses dashboard keuangan dan riwayat transaksi real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Alamat Email"
                type="email"
                placeholder="nama@email.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    label="Kata Sandi"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Masuk Sekarang
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
                atau
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full text-xs font-bold"
              onClick={handleGoogleOAuth}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Masuk dengan Google
            </Button>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-100 text-xs text-slate-500">
            Belum punya akun?{' '}
            <Link href="/register" className="ml-1 font-bold text-orange-600 hover:text-orange-700">
              Daftar Gratis
            </Link>
          </CardFooter>
        </Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Keamanan Terenkripsi End-to-End & Standar Finansial</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center text-xs text-slate-400">Memuat...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
