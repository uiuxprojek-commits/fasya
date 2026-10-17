'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

const RESET_STORAGE_KEY = 'tatadana_reset_state_v1';
const COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

interface SavedResetState {
  step: 1 | 2 | 3;
  email: string;
  sentAt: number;
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard Steps: 1 = Email, 2 = Verify OTP Recovery, 3 = New Password, 4 = Success
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [email, setEmail] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // States & Feedback
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Cooldown & Resend limit
  const [cooldown, setCooldown] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [otpLength, setOtpLength] = React.useState<6 | 8>(8);

  // 1. Restore state from sessionStorage on mount (Handles page refresh safely)
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RESET_STORAGE_KEY);
      if (!saved) return;
      const parsed: SavedResetState = JSON.parse(saved);

      if (parsed.email) {
        setEmail(parsed.email);

        if (parsed.step === 2) {
          setStep(2);
          const elapsed = Math.floor((Date.now() - parsed.sentAt) / 1000);
          const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
          setCooldown(remaining);
        } else if (parsed.step === 3) {
          // Verify user has active recovery session before keeping at step 3
          const supabase = createClient();
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              setStep(3);
            } else {
              sessionStorage.removeItem(RESET_STORAGE_KEY);
              setStep(1);
            }
          });
        }
      }
    } catch {
      sessionStorage.removeItem(RESET_STORAGE_KEY);
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

  const saveState = (nextStep: 1 | 2 | 3, targetEmail: string, sentTime?: number) => {
    try {
      const stateObj: SavedResetState = {
        step: nextStep,
        email: targetEmail,
        sentAt: sentTime || Date.now(),
      };
      sessionStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(stateObj));
    } catch {
      // Storage unavailable
    }
  };

  // ==========================================
  // STEP 1: SEND RECOVERY OTP
  // ==========================================
  const handleSendRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Kirim OTP recovery resmi dari Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Terlalu banyak permintaan pemulihan. Silakan tunggu beberapa saat.');
        } else if (error.message.includes('fetch')) {
          throw new Error('Gagal menghubungi server. Pastikan koneksi internet Anda aktif.');
        } else {
          throw new Error(error.message);
        }
      }

      const now = Date.now();
      saveState(2, cleanEmail, now);
      setCooldown(COOLDOWN_SECONDS);
      setAttempts(0);
      setOtpCode('');
      setStep(2);
      setSuccessMessage(`Kode pemulihan 6 digit telah dikirim ke ${cleanEmail}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal mengirim kode pemulihan. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 2: RESEND RECOVERY OTP
  // ==========================================
  const handleResendRecoveryOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) throw error;

      const now = Date.now();
      saveState(2, cleanEmail, now);
      setCooldown(COOLDOWN_SECONDS);
      setAttempts(0);
      setSuccessMessage('Kode pemulihan baru berhasil dikirim ke email Anda.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal mengirim ulang kode pemulihan. Coba lagi nanti.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 2: VERIFY RECOVERY OTP
  // ==========================================
  const handleVerifyRecoveryOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    setErrorMessage('');
    setSuccessMessage('');

    if (code.length !== 6 && code.length !== 8) {
      setErrorMessage(`Harap masukkan ${otpLength} digit kode pemulihan secara lengkap.`);
      return;
    }

    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      setErrorMessage(
        'Batas percobaan salah telah tercapai. Silakan klik "Kirim Ulang Kode" untuk meminta kode baru.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = createClient();

      // Verifikasi token pemulihan khusus type: 'recovery'
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'recovery', // STRICTLY recovery type
      });

      if (error) {
        setAttempts((prev) => prev + 1);
        if (
          error.message.includes('Token has expired') ||
          error.message.includes('invalid') ||
          error.message.includes('expired')
        ) {
          throw new Error('Kode pemulihan tidak valid atau telah kedaluwarsa. Silakan periksa kembali.');
        } else {
          throw new Error(error.message);
        }
      }

      if (!data.session && !data.user) {
        throw new Error('Sesi pemulihan tidak diterima. Silakan ulangi langkah pemulihan.');
      }

      // Verifikasi sukses! Pengguna memiliki sesi pemulihan aktif
      saveState(3, cleanEmail);
      setStep(3);
      setSuccessMessage('Kode pemulihan valid. Silakan buat kata sandi baru Anda.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Kode pemulihan salah.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 3: UPDATE PASSWORD
  // ==========================================
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Kata sandi baru minimal harus terdiri dari 8 karakter.');
      return;
    }

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

      // Simpan kata sandi baru ke Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      // Hapus state pemulihan
      sessionStorage.removeItem(RESET_STORAGE_KEY);
      setStep(4); // Success state
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui kata sandi. Pastikan sesi pemulihan Anda belum kedaluwarsa.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    sessionStorage.removeItem(RESET_STORAGE_KEY);
    setOtpCode('');
    setErrorMessage('');
    setSuccessMessage('');
    setCooldown(0);
    setAttempts(0);
    setStep(1);
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
            Pemulihan kata sandi akun aman dengan verifikasi OTP.
          </p>
        </div>

        {/* Stepper Wizard Indicator (Steps 1-3) */}
        {step !== 4 && (
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
                Sandi Baru
              </span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <Card className="shadow-lg shadow-slate-900/5 border-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {step === 1 && 'Lupa Kata Sandi'}
              {step === 2 && 'Verifikasi Kode Pemulihan'}
              {step === 3 && 'Atur Ulang Kata Sandi'}
              {step === 4 && 'Kata Sandi Diperbarui!'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Langkah 1 dari 3: Masukkan email akun Anda untuk menerima kode OTP.'}
              {step === 2 && 'Langkah 2 dari 3: Masukkan 6 digit kode pemulihan yang dikirim ke email.'}
              {step === 3 && 'Langkah 3 dari 3: Buat kata sandi baru untuk mengamankan akun Anda.'}
              {step === 4 && 'Akun Anda siap digunakan kembali dengan kata sandi baru.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && step !== 4 && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* ==================================================== */}
            {/* STEP 1: INPUT EMAIL                                  */}
            {/* ==================================================== */}
            {step === 1 && (
              <form onSubmit={handleSendRecoveryOtp} className="space-y-4">
                <Input
                  label="Alamat Email Akun"
                  type="email"
                  placeholder="nama@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  helperText="Kami akan mengirimkan 6 digit kode OTP pemulihan ke email ini."
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
                  Kirim Kode Pemulihan
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}

            {/* ==================================================== */}
            {/* STEP 2: VERIFY RECOVERY OTP                          */}
            {/* ==================================================== */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs text-orange-950 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Kode {otpLength} digit pemulihan dikirim ke: <strong className="font-bold">{email}</strong>.
                    Berlaku selama 10 menit.
                  </div>
                </div>

                {/* Length Selector Toggle */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500 font-medium">Kotak kode verifikasi:</span>
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
                    onComplete={(code) => handleVerifyRecoveryOtp(code)}
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
                  onClick={() => handleVerifyRecoveryOtp()}
                  disabled={(otpCode.length !== 6 && otpCode.length !== 8) || isLoading}
                >
                  Verifikasi Kode Pemulihan
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                {/* Resend Cooldown & Change Email */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleResendRecoveryOtp}
                    disabled={cooldown > 0 || isLoading}
                    className={`font-semibold flex items-center gap-1.5 transition-colors ${
                      cooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-orange-600 hover:text-orange-700 font-bold'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim Ulang Kode'}
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
            {/* STEP 3: NEW PASSWORD                                 */}
            {/* ==================================================== */}
            {step === 3 && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Kode terverifikasi untuk <strong className="font-bold">{email}</strong>.
                  </span>
                </div>

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
                    autoFocus
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
                    label="Konfirmasi Kata Sandi Baru"
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
                  Simpan Kata Sandi Baru
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}

            {/* ==================================================== */}
            {/* STEP 4: SUCCESS CONFIRMATION                         */}
            {/* ==================================================== */}
            {step === 4 && (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Kata Sandi Berhasil Diperbarui
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Kata sandi baru Anda telah aktif. Silakan masuk kembali ke dashboard TataDana.
                  </p>
                </div>
                <Link
                  href={`/login?email=${encodeURIComponent(email)}`}
                  className="block w-full pt-2"
                >
                  <Button variant="primary" className="w-full min-h-[44px] font-bold">
                    Masuk ke Akun Sekarang
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>

          {step !== 4 && (
            <CardFooter className="justify-center border-t border-slate-100 text-xs text-slate-500">
              <Link href="/login" className="flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Masuk
              </Link>
            </CardFooter>
          )}
        </Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Autentikasi Pemulihan Terenkripsi Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
