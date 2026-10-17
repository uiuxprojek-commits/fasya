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
        },
      });

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('dummy')) {
          router.push('/onboarding');
          return;
        }
        throw error;
      }

      // Proceed straight to guided onboarding
      router.push('/onboarding');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Terjadi kesalahan pendaftaran akun.'
      );
    } finally {
      setIsLoading(false);
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
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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
