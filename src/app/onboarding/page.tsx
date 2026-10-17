'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  Laptop,
  CheckCircle2,
  Wallet,
  Target,
  Send,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  // Step 1: Persona & Financial Habit
  const [occupation, setOccupation] = React.useState<'karyawan' | 'mahasiswa' | 'freelancer' | 'lainnya'>('karyawan');
  const [monthlyIncome, setMonthlyIncome] = React.useState('7500000');
  const [goal, setGoal] = React.useState('Mengontrol pengeluaran bulanan agar bisa menabung lebih banyak');

  // Step 2: Wallet Setup
  const [walletName, setWalletName] = React.useState('BCA Utama');
  const [initialBalance, setInitialBalance] = React.useState('2500000');

  // Step 3: Categories & Budget
  const [suggestedCategories, setSuggestedCategories] = React.useState([
    { name: 'Makanan & Minuman', budget: 1500000, icon: '🍔' },
    { name: 'Transportasi', budget: 500000, icon: '🚗' },
    { name: 'Tagihan & Utilitas', budget: 600000, icon: '⚡' },
    { name: 'Belanja Harian', budget: 800000, icon: '🛒' },
    { name: 'Hiburan', budget: 400000, icon: '🎬' },
  ]);

  // Step 4: Finish & Link Telegram
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaBot';

  const handleFinish = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Progress Tracker Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Langkah {step} dari 4: Onboarding Finansial
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Personalisasi Akun TataDana Kamu
          </h2>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Profil & Pola Keuangan */}
        {step === 1 && (
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Profil & Pola Keuangan Kamu</CardTitle>
              <CardDescription>
                Bantu AI kami menyusun rekomendasi pos anggaran yang relevan untuk gaya hidupmu.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Aktivitas Utama Saat Ini
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'karyawan', label: 'Karyawan', icon: Briefcase },
                    { id: 'mahasiswa', label: 'Mahasiswa', icon: GraduationCap },
                    { id: 'freelancer', label: 'Freelancer', icon: Laptop },
                    { id: 'lainnya', label: 'Lainnya', icon: Sparkles },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = occupation === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOccupation(item.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/70 text-orange-700 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Input
                  label="Estimasi Pemasukan Bulanan (Rp)"
                  type="number"
                  placeholder="Contoh: 7000000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Tujuan Finansial Utama"
                  placeholder="Contoh: Menabung dana darurat, beli laptop baru"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="p-0 pt-6 flex justify-end">
              <Button variant="primary" onClick={() => setStep(2)}>
                Lanjut ke Dompet
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Dompet Awal */}
        {step === 2 && (
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Siapkan Dompet Pertama</CardTitle>
              <CardDescription>
                Tentukan rekening atau dompet utama tempat saldo awalmu tersimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <Input
                  label="Nama Dompet / Rekening"
                  placeholder="Contoh: BCA Utama, Mandiri, Dompet Tunai"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  leftIcon={<Wallet className="w-4 h-4" />}
                />
              </div>

              <div>
                <Input
                  label="Estimasi Saldo Saat Ini (Rp)"
                  type="number"
                  placeholder="Contoh: 2500000"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  helperText="Saldo ini akan dicatat sebagai saldo awal dompet utamamu."
                />
              </div>
            </CardContent>
            <CardFooter className="p-0 pt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Lanjut ke Rekomendasi Budget
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: AI Kategori & Budget */}
        {step === 3 && (
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <CardTitle>Rekomendasi Budget dari AI</CardTitle>
              </div>
              <CardDescription>
                Berdasarkan profil {occupation} dan estimasi pemasukan Rp {Number(monthlyIncome).toLocaleString('id-ID')}, berikut alokasi budget bulanan yang disarankan:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {suggestedCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-orange-600">
                    {formatRupiah(cat.budget)}
                  </span>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-0 pt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Button>
              <Button variant="primary" onClick={() => setStep(4)}>
                Lanjut ke Hubungkan Bot
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Hubungkan Telegram & Selesai */}
        {step === 4 && (
          <Card className="p-6">
            <CardHeader className="p-0 pb-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Send className="w-6 h-6" />
              </div>
              <CardTitle>Langkah Terakhir: Hubungkan Telegram</CardTitle>
              <CardDescription>
                Pencatatan keuangan di TataDana paling nyaman dilakukan langsung dari chat Telegram.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-950 space-y-2">
                <p className="font-bold">Cara menggunakan bot:</p>
                <p>1. Buka Telegram kamu dan cari <strong>@{botUsername}</strong></p>
                <p>2. Kirim pesan seperti: <code>beli bakso 15rb</code> atau <code>gajian 7.5jt</code></p>
                <p>3. Kamu juga bisa menghubungkan bot nanti kapan saja lewat menu Settings.</p>
              </div>
            </CardContent>
            <CardFooter className="p-0 pt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Button>
              <Button variant="primary" onClick={handleFinish}>
                Selesai & Masuk Dashboard
                <CheckCircle2 className="w-4 h-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
