'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Kata sandi minimal terdiri dari 8 karakter.');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        throw error;
      }

      // If Supabase project requires email confirmation
      if (data.user && !data.session) {
        setIsSuccess(true);
        return;
      }

      // If auto-authenticated, proceed straight to guided onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('User already registered')) {
          setErrorMessage('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk ke akun Anda.');
        } else if (err.message.includes('Password should be at least')) {
          setErrorMessage('Kata sandi minimal terdiri dari 8 karakter.');
        } else if (err.message.includes('fetch')) {
          setErrorMessage('Gagal menghubungi server Supabase. Pastikan koneksi internet Anda aktif.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Terjadi kesalahan pendaftaran akun. Silakan coba lagi.');
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
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google OAuth error:', err);
      setErrorMessage(
        'Gagal memulai pendaftaran Google. Pastikan Google Provider sudah diaktifkan di Supabase Dashboard.'
      );
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
            Mulai kelola keuangan pribadimu semudah mengirim pesan ke bot Telegram.
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-lg shadow-slate-900/5 border-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Daftar Akun Baru</CardTitle>
            <CardDescription>
              Buat akun dalam 30 detik untuk mulai mencatat keuanganmu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {isSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">Pendaftaran Berhasil!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Tautan konfirmasi telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam email Anda untuk mengaktifkan akun dan mulai menggunakan TataDana.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Buka Halaman Masuk
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  Daftar dengan Google
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                    atau isi formulir
                  </span>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    label="Nama Lengkap"
                    placeholder="Contoh: Ahmad Fasya"
                    leftIcon={<User className="w-4 h-4" />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

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

                  <Input
                    label="Nomor WhatsApp / HP"
                    type="tel"
                    placeholder="081234567890"
                    leftIcon={<Phone className="w-4 h-4" />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    helperText="Digunakan untuk verifikasi keamanan saat linking bot Telegram."
                    required
                  />

                  <Input
                    label="Kata Sandi"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Lanjutkan ke Onboarding
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>
              </>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-100 text-xs text-slate-500">
            Sudah memiliki akun TataDana?{' '}
            <Link href="/login" className="ml-1 font-bold text-orange-600 hover:text-orange-700">
              Masuk di sini
            </Link>
          </CardFooter>
        </Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Data Transaksi Anda Terenkripsi & Terlindungi RLS</span>
        </div>
      </div>
    </div>
  );
}
