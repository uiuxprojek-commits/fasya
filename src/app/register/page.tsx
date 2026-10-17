'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
} from 'lucide-react';

const REG_STORAGE_KEY = 'tatadana_reg_state_v1';
const COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

interface SavedRegState {
  step: 1 | 2 | 3;
  email: string;
  sentAt: number;
  fullName?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  // Wizard Steps: 1 = Email, 2 = Verify OTP, 3 = Create Password
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // States & Feedback
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [emailAlreadyExists, setEmailAlreadyExists] = React.useState(false);

  // Cooldown & Resend limit
  const [cooldown, setCooldown] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [otpLength, setOtpLength] = React.useState<6 | 8>(8);

  // 1. Restore state from sessionStorage or URL query on mount
  React.useEffect(() => {
    // Check if user came from email link with ?step=3
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('step') === '3') {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setEmail(session.user.email || '');
            setStep(3);
            setSuccessMessage('Email berhasil dikonfirmasi! Silakan buat kata sandi akun Anda.');
            return;
          }
        });
      }
    }

    try {
      const saved = sessionStorage.getItem(REG_STORAGE_KEY);
      if (!saved) return;
      const parsed: SavedRegState = JSON.parse(saved);

      if (parsed.email) {
        setEmail(parsed.email);
        if (parsed.fullName) setFullName(parsed.fullName);

        if (parsed.step === 2) {
          setStep(2);
          const elapsed = Math.floor((Date.now() - parsed.sentAt) / 1000);
          const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
          setCooldown(remaining);
        } else if (parsed.step === 3) {
          // Verify user actually has an active session before keeping at step 3
          const supabase = createClient();
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              setStep(3);
            } else {
              // Session expired, start fresh
              sessionStorage.removeItem(REG_STORAGE_KEY);
              setStep(1);
            }
          });
        }
      }
    } catch {
      sessionStorage.removeItem(REG_STORAGE_KEY);
    }
  }, []);

  // 2. Cooldown timer countdown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Helper to save state
  const saveState = (nextStep: 1 | 2 | 3, targetEmail: string, sentTime?: number) => {
    try {
      const stateObj: SavedRegState = {
        step: nextStep,
        email: targetEmail,
        sentAt: sentTime || Date.now(),
        fullName,
      };
      sessionStorage.setItem(REG_STORAGE_KEY, JSON.stringify(stateObj));
    } catch {
      // Storage unavailable
    }
  };

  // ==========================================
  // STEP 1: SUBMIT EMAIL & SEND OTP
  // ==========================================
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setEmailAlreadyExists(false);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Cek apakah email sudah terdaftar
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const checkData = await checkRes.json();
      if (checkData.exists) {
        setEmailAlreadyExists(true);
        setErrorMessage('Alamat email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.');
        setIsLoading(false);
        return;
      }

      // 2. Kirim OTP 6 digit resmi dari Supabase Auth
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        if (otpError.message.includes('rate limit')) {
          throw new Error('Terlalu banyak permintaan OTP. Silakan tunggu beberapa saat lagi.');
        } else if (otpError.message.includes('fetch')) {
          throw new Error('Gagal menghubungi server. Pastikan koneksi internet Anda aktif.');
        } else {
          throw new Error(otpError.message);
        }
      }

      // 3. Transisi ke Step 2
      const now = Date.now();
      saveState(2, cleanEmail, now);
      setCooldown(COOLDOWN_SECONDS);
      setAttempts(0);
      setOtpCode('');
      setStep(2);
      setSuccessMessage(`Kode verifikasi 6 digit telah dikirim ke ${cleanEmail}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengirim kode OTP. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 2: RESEND OTP
  // ==========================================
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      const now = Date.now();
      saveState(2, cleanEmail, now);
      setCooldown(COOLDOWN_SECONDS);
      setAttempts(0);
      setSuccessMessage('Kode verifikasi baru berhasil dikirim ke email Anda.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal mengirim ulang kode OTP. Coba lagi nanti.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 2: VERIFY OTP
  // ==========================================
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    setErrorMessage('');
    setSuccessMessage('');

    if (code.length !== 6 && code.length !== 8) {
      setErrorMessage(`Harap masukkan ${otpLength} digit kode OTP secara lengkap.`);
      return;
    }

    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      setErrorMessage(
        'Batas percobaan salah telah tercapai. Silakan klik "Kirim Ulang Kode OTP" untuk meminta kode baru.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = createClient();

      // Verifikasi token 6 digit ke Supabase Auth
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'email',
      });

      // Fallback: Jika Supabase menandai token sebagai jenis 'signup', verifikasi ulang dengan type 'signup'
      if (error) {
        const signupAttempt = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code,
          type: 'signup',
        });
        if (!signupAttempt.error && (signupAttempt.data?.session || signupAttempt.data?.user)) {
          data = signupAttempt.data;
          error = null;
        }
      }

      if (error) {
        setAttempts((prev) => prev + 1);
        if (
          error.message.includes('Token has expired') ||
          error.message.includes('invalid') ||
          error.message.includes('expired')
        ) {
          throw new Error('Kode verifikasi tidak valid atau telah kedaluwarsa. Silakan periksa kembali.');
        } else {
          throw new Error(error.message);
        }
      }

      if (!data.session && !data.user) {
        throw new Error('Verifikasi gagal. Sesi autentikasi tidak diterima dari Supabase.');
      }

      // Verifikasi sukses! Email berstatus confirmed.
      saveState(3, cleanEmail);
      setStep(3);
      setSuccessMessage('Email berhasil diverifikasi! Silakan buat kata sandi akun Anda.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Kode OTP tidak cocok.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 3: CREATE & CONFIRM PASSWORD
  // ==========================================
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Kata sandi baru minimal harus terdiri dari 8 karakter.');
      return;
    }

    // Must contain letters and digits
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Kata sandi harus mengandung kombinasi huruf dan angka.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const cleanFullName = fullName.trim() || email.split('@')[0];

      // Update password & metadata di Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password,
        data: {
          full_name: cleanFullName,
        },
      });

      if (error) {
        throw error;
      }

      // Update nama lengkap di tabel profiles
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: cleanFullName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.user.id);
      }

      // Bersihkan state registrasi
      sessionStorage.removeItem(REG_STORAGE_KEY);

      // Pendaftaran selesai, arahkan ke onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal menetapkan kata sandi. Pastikan sesi verifikasi Anda masih aktif.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step Reset / Change Email
  const handleChangeEmail = () => {
    sessionStorage.removeItem(REG_STORAGE_KEY);
    setOtpCode('');
    setErrorMessage('');
    setSuccessMessage('');
    setCooldown(0);
    setAttempts(0);
    setStep(1);
  };

  // Google OAuth Shortcut
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
      setErrorMessage('Gagal memulai pendaftaran dengan Google. Pastikan koneksi aktif.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Tata<span className="text-orange-500">Dana</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            Platform keuangan modern terintegrasi bot Telegram dan AI.
          </p>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span className={step >= 1 ? 'text-orange-600 flex items-center gap-1' : ''}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 1 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                1
              </span>
              Email
            </span>

            <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-orange-500' : 'bg-slate-100'}`} />

            <span className={step >= 2 ? 'text-orange-600 flex items-center gap-1' : ''}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                2
              </span>
              Verifikasi OTP
            </span>

            <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-orange-500' : 'bg-slate-100'}`} />

            <span className={step >= 3 ? 'text-orange-600 flex items-center gap-1' : ''}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 3 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                3
              </span>
              Password
            </span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg shadow-slate-900/5 border-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {step === 1 && 'Daftar Akun Baru'}
              {step === 2 && 'Verifikasi Email'}
              {step === 3 && 'Buat Kata Sandi'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Langkah 1 dari 3: Masukkan alamat email aktif Anda.'}
              {step === 2 && 'Langkah 2 dari 3: Masukkan 6 digit kode OTP resmi dari email Anda.'}
              {step === 3 && 'Langkah 3 dari 3: Buat kata sandi aman untuk masuk ke akun Anda.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold leading-relaxed">{errorMessage}</p>
                  {emailAlreadyExists && (
                    <Link
                      href={`/login?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                    >
                      Buka Halaman Masuk Sekarang →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* ==================================================== */}
            {/* STEP 1: INPUT EMAIL ONLY                             */}
            {/* ==================================================== */}
            {step === 1 && (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <Input
                  label="Alamat Email"
                  type="email"
                  placeholder="nama@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  helperText="Kode verifikasi 6 digit akan dikirimkan ke email ini."
                  required
                  autoFocus
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full min-h-[44px] font-bold"
                  isLoading={isLoading}
                >
                  Lanjutkan
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                {/* Google Sign Up Alternative */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
                    atau
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs font-bold min-h-[42px]"
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
                  Daftar dengan Google
                </Button>
              </form>
            )}

            {/* ==================================================== */}
            {/* STEP 2: VERIFY 6-DIGIT OTP                           */}
            {/* ==================================================== */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs text-orange-950 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Kode {otpLength} digit telah dikirim ke: <strong className="font-bold">{email}</strong>.
                    Berlaku selama 10 menit.
                  </div>
                </div>

                {/* Length Selector Toggle */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500 font-medium">Kotak kode OTP:</span>
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpLength(6);
                        setOtpCode('');
                      }}
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                        otpLength === 6
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      6 Digit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpLength(8);
                        setOtpCode('');
                      }}
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                        otpLength === 8
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      8 Digit
                    </button>
                  </div>
                </div>

                {/* OTP input with paste & keyboard nav */}
                <div className="py-2">
                  <OtpInput
                    length={otpLength}
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onComplete={(code) => handleVerifyOtp(code)}
                    onAutoDetectLength={(detected) => setOtpLength(detected)}
                    disabled={isLoading}
                    hasError={Boolean(errorMessage)}
                    autoFocus
                  />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  className="w-full min-h-[44px] font-bold"
                  isLoading={isLoading}
                  onClick={() => handleVerifyOtp()}
                  disabled={(otpCode.length !== 6 && otpCode.length !== 8) || isLoading}
                >
                  Verifikasi & Lanjutkan
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                {/* Resend Cooldown & Change Email */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || isLoading}
                    className={`font-semibold flex items-center gap-1.5 transition-colors ${
                      cooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-orange-600 hover:text-orange-700 font-bold'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim Ulang Kode OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    disabled={isLoading}
                    className="text-slate-500 hover:text-slate-800 font-medium underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Ubah Email
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* STEP 3: CREATE & CONFIRM PASSWORD                    */}
            {/* ==================================================== */}
            {step === 3 && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Email <strong className="font-bold">{email}</strong> telah diverifikasi.
                  </span>
                </div>

                <Input
                  label="Nama Lengkap"
                  placeholder="Contoh: Ahmad Fasya"
                  leftIcon={<User className="w-4 h-4" />}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  helperText="Akan ditampilkan pada profil dan laporan keuangan Anda."
                  required
                />

                <div className="relative">
                  <Input
                    label="Kata Sandi Baru"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter (huruf & angka)"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Konfirmasi Kata Sandi"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi baru"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600"
                    aria-label="Tampilkan konfirmasi kata sandi"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Validation checklist */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-emerald-600 font-bold' : ''}`}>
                    <span>{password.length >= 8 ? '✓' : '•'}</span> Minimal 8 karakter
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[a-zA-Z]/.test(password) && /[0-9]/.test(password) ? 'text-emerald-600 font-bold' : ''}`}>
                    <span>{/[a-zA-Z]/.test(password) && /[0-9]/.test(password) ? '✓' : '•'}</span> Kombinasi huruf dan angka
                  </div>
                  <div className={`flex items-center gap-1.5 ${password && confirmPassword && password === confirmPassword ? 'text-emerald-600 font-bold' : ''}`}>
                    <span>{password && confirmPassword && password === confirmPassword ? '✓' : '•'}</span> Konfirmasi kata sandi cocok
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full min-h-[44px] font-bold"
                  isLoading={isLoading}
                >
                  Selesaikan Pendaftaran
                  <Sparkles className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
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
          <span>Verifikasi Email Terenkripsi Standar Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
