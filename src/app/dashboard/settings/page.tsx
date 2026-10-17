'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Send,
  Bell,
  Tag,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = React.useState<
    'profile' | 'telegram' | 'reminders' | 'categories' | 'subscription'
  >(initialTab as any);

  // Profile Form
  const [fullName, setFullName] = React.useState('Ahmad Fasya');
  const [email, setEmail] = React.useState('fasya@tatadana.id');
  const [currency, setCurrency] = React.useState('IDR');
  const [profileSaved, setProfileSaved] = React.useState(false);

  // Telegram Linking State
  const [linkCode, setLinkCode] = React.useState('');
  const [codeExpiresAt, setCodeExpiresAt] = React.useState('');
  const [isGeneratingCode, setIsGeneratingCode] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = React.useState(false);

  // Reminder State
  const [morningReminder, setMorningReminder] = React.useState(true);
  const [morningTime, setMorningTime] = React.useState('08:00');
  const [eveningReminder, setEveningReminder] = React.useState(true);
  const [eveningTime, setEveningTime] = React.useState('20:00');
  const [reminderSaved, setReminderSaved] = React.useState(false);

  // Subscription State
  const [planCode, setPlanCode] = React.useState<'starter' | 'pro'>('starter');
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaBot';

  const handleGenerateLinkCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/telegram/link-code', { method: 'POST' });
      const data = await res.json();
      if (data.code) {
        setLinkCode(data.code);
        setCodeExpiresAt(data.expiresAt);
      }
    } catch (err) {
      console.error('Failed to generate link code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpgradePro = async (paymentType: 'midtrans' | 'manual_transfer') => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode: 'pro', paymentType }),
      });
      const data = await res.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.instructions) {
        alert(
          `Silakan transfer ke ${data.instructions.bankName} No. Rekening: ${data.instructions.accountNumber} an ${data.instructions.accountHolder} sebesar ${formatRupiah(data.instructions.nominal)}.`
        );
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Gagal memproses pembayaran');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <DashboardHeader
        title="Pengaturan & Akun"
        subtitle="Kelola profil, integrasi bot Telegram, pengingat harian, dan paket langganan."
      />

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            Profil Pengguna
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'telegram'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            Telegram Bot
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            Pengingat (Reminders)
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            Kategori
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Paket & Pembayaran
          </button>
        </div>

        {/* Tab 1: Profil */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profil Pengguna</CardTitle>
              <CardDescription>
                Informasi identitas akun dan format mata uang bawaan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <Input
                label="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Alamat Email"
                value={email}
                disabled
                helperText="Email terikat dengan autentikasi akun Anda."
              />
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Mata Uang Default
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  <option value="IDR">IDR — Rupiah Indonesia (Rp)</option>
                </select>
              </div>

              {profileSaved && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profil berhasil diperbarui.
                </p>
              )}

              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 3000);
                }}
              >
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Telegram Bot Integration */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hubungkan Telegram Bot</CardTitle>
                    <CardDescription>
                      Catat transaksi semudah chat langsung ke akun bot TataDana.
                    </CardDescription>
                  </div>
                  <Badge variant={isTelegramConnected ? 'success' : 'warning'}>
                    {isTelegramConnected ? 'TERHUBUNG' : 'BELUM TERHUBUNG'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
                  <Send className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-950 space-y-1">
                    <p className="font-bold">Nama Bot Resmi: @{botUsername}</p>
                    <p className="text-sky-800">
                      Seluruh transaksi dipetakan ke akun ini secara aman melalui kode verifikasi sekali pakai. Nomor HP Anda tidak akan terekspos.
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Langkah Menghubungkan:
                  </h4>
                  <ol className="list-decimal list-inside space-y-3 text-xs text-slate-700 font-medium">
                    <li>
                      Buka aplikasi Telegram dan cari bot{' '}
                      <a
                        href={`https://t.me/${botUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 font-bold underline inline-flex items-center gap-0.5"
                      >
                        @{botUsername} <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Klik tombol di bawah untuk membuat kode tautan sekali pakai Anda:</li>
                  </ol>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Kode Tautan Anda (Berlaku 15 Menit):
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono tracking-widest mt-0.5">
                        {linkCode || '------'}
                      </div>
                      {codeExpiresAt && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Kedaluwarsa pada:{' '}
                          {new Date(codeExpiresAt).toLocaleTimeString('id-ID')} WIB
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {linkCode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`/link ${linkCode}`)}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 mr-1" />
                          )}
                          Salin Perintah
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isGeneratingCode}
                        onClick={handleGenerateLinkCode}
                      >
                        {linkCode ? 'Buat Kode Baru' : 'Generate Kode Tautan'}
                      </Button>
                    </div>
                  </div>

                  {linkCode && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                      💡 Kirim pesan berikut ke bot Telegram: <code className="font-bold font-mono">/link {linkCode}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Reminders */}
        {activeTab === 'reminders' && (
          <Card>
            <CardHeader>
              <CardTitle>Pengingat Harian Keuangan (Reminders)</CardTitle>
              <CardDescription>
                Maksimal dua pengingat otomatis per hari yang dikirimkan langsung ke Telegram kamu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Morning Reminder */}
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pengingat Pagi</h4>
                  <p className="text-xs text-slate-500">
                    Mengingatkan Anda untuk mencatat sarapan, kopi, atau ongkos perjalanan.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Jam Kirim:</span>
                    <input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      disabled={!morningReminder}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
                    />
                    <span className="text-xs text-slate-400 font-semibold">WIB</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={morningReminder}
                  onChange={(e) => setMorningReminder(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              {/* Evening Reminder */}
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pengingat Malam (Evaluasi Harian)</h4>
                  <p className="text-xs text-slate-500">
                    Mengevaluasi seluruh transaksi belanja sebelum Anda beristirahat.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Jam Kirim:</span>
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      disabled={!eveningReminder}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
                    />
                    <span className="text-xs text-slate-400 font-semibold">WIB</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={eveningReminder}
                  onChange={(e) => setEveningReminder(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              {reminderSaved && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Pengaturan pengingat berhasil disimpan.
                </p>
              )}

              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setReminderSaved(true);
                  setTimeout(() => setReminderSaved(false), 3000);
                }}
              >
                Simpan Jadwal Pengingat
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Categories */}
        {activeTab === 'categories' && (
          <Card>
            <CardHeader>
              <CardTitle>Kelola Kategori Keuangan</CardTitle>
              <CardDescription>
                Daftar pos kategori pengeluaran dan pemasukan dengan ikon dan warna pilihan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'Makanan & Minuman', icon: '🍔', color: '#F97316', type: 'Pengeluaran' },
                  { name: 'Transportasi', icon: '🚗', color: '#3B82F6', type: 'Pengeluaran' },
                  { name: 'Tagihan & Utilitas', icon: '⚡', color: '#EF4444', type: 'Pengeluaran' },
                  { name: 'Belanja Harian', icon: '🛒', color: '#8B5CF6', type: 'Pengeluaran' },
                  { name: 'Kesehatan & Obat', icon: '💊', color: '#10B981', type: 'Pengeluaran' },
                  { name: 'Gaji Pokok', icon: '💼', color: '#10B981', type: 'Pemasukan' },
                  { name: 'Freelance & Side Job', icon: '💻', color: '#06B6D4', type: 'Pemasukan' },
                ].map((cat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{cat.icon}</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{cat.name}</h5>
                        <span className="text-[10px] text-slate-400 font-semibold">{cat.type}</span>
                      </div>
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 5: Subscription & Payments */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Starter Plan Card */}
              <Card className="p-6 border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Paket Starter</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cocok untuk pengguna pemula yang ingin mencatat keuangan ringan.
                    </p>
                  </div>
                  <Badge variant="secondary">Aktif</Badge>
                </div>

                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-900">Rp 49.000</span>
                  <span className="text-xs text-slate-500 font-semibold"> / bulan</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Pencatatan transaksi via teks Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Maksimal 50 transaksi per bulan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Maksimal 3 dompet aktif
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Maksimal 5 kategori budget
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center">✕</span>
                    Tanpa foto struk AI
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center">✕</span>
                    Tanpa ekspor PDF & XLSX
                  </li>
                </ul>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block">
                    Status Paket Saat Ini
                  </span>
                </div>
              </Card>

              {/* Pro Plan Card */}
              <Card className="p-6 border-orange-300 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 relative shadow-md">
                <div className="absolute -top-3 right-6">
                  <Badge variant="pro">LIFETIME DEAL</Badge>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-extrabold text-orange-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-500" /> Paket Pro Sekali Bayar
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Bayar satu kali, nikmati seluruh fitur fintech selamanya.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-3xl font-black text-orange-600">Rp 99.000</span>
                  <span className="text-xs text-orange-900/70 font-bold"> / sekali bayar</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-800 font-semibold">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    Transaksi tak terbatas (Unlimited)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    Dompet & Kategori unlimited
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    Pindai struk belanja otomatis via AI Vision OCR
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    Ekspor laporan resmi PDF dan XLSX tak terbatas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    AI Financial Advisor & pengingat custom
                  </li>
                </ul>

                <div className="mt-6 pt-4 border-t border-orange-100 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    isLoading={isUpgrading}
                    onClick={() => handleUpgradePro('midtrans')}
                    className="w-full"
                  >
                    Upgrade via Midtrans (QRIS / VA / CC)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpgradePro('manual_transfer')}
                    className="w-full text-xs"
                  >
                    Transfer Bank Manual (BCA)
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-xs text-slate-400">Memuat pengaturan...</div>}>
      <SettingsContent />
    </React.Suspense>
  );
}
