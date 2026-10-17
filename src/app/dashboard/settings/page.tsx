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
  Unlink,
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah, formatDateWIB } from '@/lib/utils';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = React.useState<
    'profile' | 'telegram' | 'reminders' | 'categories' | 'subscription'
  >(initialTab as any);

  // Profile Form
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [currency, setCurrency] = React.useState('IDR');
  const [profileSaved, setProfileSaved] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Categories State
  const [categories, setCategories] = React.useState<any[]>([]);
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatType, setNewCatType] = React.useState<'expense' | 'income'>('expense');
  const [isAddingCat, setIsAddingCat] = React.useState(false);

  // Telegram Linking State
  const [linkCode, setLinkCode] = React.useState('');
  const [codeExpiresAt, setCodeExpiresAt] = React.useState('');
  const [directBotUrl, setDirectBotUrl] = React.useState('');
  const [isGeneratingCode, setIsGeneratingCode] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = React.useState(false);
  const [telegramAccount, setTelegramAccount] = React.useState<{
    telegram_user_id: number;
    telegram_username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    linked_at: string;
    notifications_enabled: boolean;
  } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isTogglingNotifications, setIsTogglingNotifications] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  // Reminder State
  const [morningReminder, setMorningReminder] = React.useState(true);
  const [morningTime, setMorningTime] = React.useState('08:00');
  const [eveningReminder, setEveningReminder] = React.useState(true);
  const [eveningTime, setEveningTime] = React.useState('20:00');
  const [reminderSaved, setReminderSaved] = React.useState(false);

  // Subscription State
  const [planCode, setPlanCode] = React.useState<'starter' | 'pro'>('starter');
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaApp2026Bot';

  const loadProfileAndCategories = React.useCallback(async () => {
    try {
      const [profileRes, catRes, tgRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/categories'),
        fetch('/api/telegram/status'),
      ]);
      const profileData = await profileRes.json();
      const catData = await catRes.json();
      const tgData = await tgRes.json();

      if (profileData.profile) {
        setFullName(profileData.profile.full_name || '');
        setEmail(profileData.profile.email || '');
        setCurrency(profileData.profile.currency || 'IDR');
      }
      if (profileData.subscription?.planCode) {
        setPlanCode(profileData.subscription.planCode);
      }
      setCategories(catData.categories || []);

      if (tgData) {
        setIsTelegramConnected(Boolean(tgData.connected));
        setTelegramAccount(tgData.account || null);
        if (tgData.account) {
          setNotificationsEnabled(tgData.account.notifications_enabled !== false);
        }
      }
    } catch (err) {
      console.error('Error loading settings data:', err);
    }
  }, []);

  React.useEffect(() => {
    loadProfileAndCategories();

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('payment') === 'finish' || searchParams.get('simulated_payment') === 'success') {
        setActiveTab('subscription');
        alert('🎉 Terima kasih! Pembayaran Anda sedang diproses dan diverifikasi.');
      }
    }
  }, [loadProfileAndCategories]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil');
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          type: newCatType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat kategori');
      setNewCatName('');
      loadProfileAndCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membuat kategori');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleGenerateLinkCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/telegram/link-code', { method: 'POST' });
      const data = await res.json();
      if (data.code) {
        setLinkCode(data.code);
        setCodeExpiresAt(data.expiresAt);
        setDirectBotUrl(data.directUrl || `https://t.me/${botUsername}?start=${data.code}`);
      }
    } catch (err) {
      console.error('Failed to generate link code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleToggleNotifications = async () => {
    setIsTogglingNotifications(true);
    try {
      const nextState = !notificationsEnabled;
      const res = await fetch('/api/telegram/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah notifikasi');
      setNotificationsEnabled(nextState);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah preferensi notifikasi');
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin memutuskan integrasi Telegram? Bot tidak akan dapat mengirim notifikasi atau menerima input transaksi hingga Anda menghubungkannya kembali.'
      )
    ) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/telegram/disconnect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memutuskan Telegram');
      setIsTelegramConnected(false);
      setTelegramAccount(null);
      setLinkCode('');
      setDirectBotUrl('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memutuskan integrasi Telegram');
    } finally {
      setIsDisconnecting(false);
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

      if (!res.ok || data.error) {
        alert(data.error || 'Gagal memproses pembayaran ke Midtrans.');
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.instructions) {
        alert(
          `Silakan transfer ke ${data.instructions.bankName} No. Rekening: ${data.instructions.accountNumber} an ${data.instructions.accountHolder} sebesar ${formatRupiah(data.instructions.nominal)}.`
        );
      } else {
        alert('Tautan pembayaran tidak diterima dari server.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(`Gagal memproses pembayaran: ${err?.message || 'Koneksi error'}`);
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
                onClick={handleSaveProfile}
                isLoading={isSavingProfile}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-sky-500" />
                      Integrasi Telegram Bot (TataDana Assistant)
                    </CardTitle>
                    <CardDescription>
                      Pantau saldo, cek limit anggaran, dan catat pengeluaran semudah mengirim pesan di Telegram.
                    </CardDescription>
                  </div>
                  <Badge variant={isTelegramConnected ? 'success' : 'warning'} className="self-start sm:self-auto">
                    {isTelegramConnected ? (
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> TERHUBUNG
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> BELUM TERHUBUNG
                      </span>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Official Bot Info Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/90 to-indigo-50/70 border border-sky-100 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-sky-950 space-y-1">
                    <p className="font-bold text-sm">
                      Bot Resmi: <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="text-sky-600 underline font-black">@{botUsername}</a>
                    </p>
                    <p className="text-sky-800 leading-relaxed">
                      Akun TataDana Anda dilindungi oleh sistem token verifikasi sekali pakai berdurasi 10 menit. Nomor telepon Anda tidak akan pernah terekspos ke publik.
                    </p>
                  </div>
                </div>

                {/* State: CONNECTED */}
                {isTelegramConnected && telegramAccount ? (
                  <div className="space-y-6">
                    {/* Account Details Box */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Rincian Akun Terhubung
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Username Telegram:</span>
                          <span className="font-bold text-slate-800 text-sm">
                            {telegramAccount.telegram_username ? `@${telegramAccount.telegram_username}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">ID Pengguna Telegram:</span>
                          <span className="font-bold text-slate-800 text-sm font-mono">
                            {telegramAccount.telegram_user_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Nama Telegram:</span>
                          <span className="font-bold text-slate-800">
                            {telegramAccount.first_name || '-'} {telegramAccount.last_name || ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Terhubung Sejak:</span>
                          <span className="font-bold text-slate-800">
                            {formatDateWIB(telegramAccount.linked_at, 'full')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notification Settings Toggle */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-500" />
                          <h4 className="text-xs font-bold text-slate-900">Notifikasi Transaksi Real-time</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            notificationsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {notificationsEnabled ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Kirim notifikasi otomatis ke bot Telegram setiap kali ada transaksi baru yang dicatat di web TataDana.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={notificationsEnabled}
                          onChange={handleToggleNotifications}
                          disabled={isTogglingNotifications}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    {/* Supported Commands Info */}
                    <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-2">
                      <h4 className="text-xs font-bold text-orange-950">
                        💡 Perintah Bot yang Tersedia:
                      </h4>
                      <p className="text-xs text-orange-800">
                        Coba ketik <code className="font-bold font-mono">/saldo</code>, <code className="font-bold font-mono">/transaksi</code>, <code className="font-bold font-mono">/anggaran</code>, atau <code className="font-bold font-mono">/laporan</code> langsung di chat bot Anda.
                      </p>
                    </div>

                    {/* Disconnect Action */}
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectTelegram}
                        isLoading={isDisconnecting}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Unlink className="w-3.5 h-3.5 mr-1.5" />
                        Putuskan Koneksi Telegram
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* State: NOT CONNECTED */
                  <div className="space-y-5">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Cara Menghubungkan Akun:
                      </h4>
                      <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                        <li>
                          Klik tombol <strong>&apos;Generate Kode Tautan&apos;</strong> di bawah ini untuk membuat kode verifikasi unik berdurasi 10 menit.
                        </li>
                        <li>
                          Buka bot Telegram{' '}
                          <a
                            href={`https://t.me/${botUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 font-bold underline inline-flex items-center gap-0.5"
                          >
                            @{botUsername} <ExternalLink className="w-3 h-3" />
                          </a>{' '}
                          lalu kirim perintah verifikasi dengan kode Anda.
                        </li>
                        <li>
                          Akun Anda akan langsung terhubung secara otomatis dan siap digunakan!
                        </li>
                      </ol>

                      {/* Code Generator & Action Card */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kode Tautan Sekali Pakai (Berlaku 10 Menit):
                          </span>
                          <div className="text-3xl font-black text-slate-900 font-mono tracking-widest mt-1">
                            {linkCode || '------'}
                          </div>
                          {codeExpiresAt && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-orange-500" /> Kedaluwarsa pada:{' '}
                              {new Date(codeExpiresAt).toLocaleTimeString('id-ID')} WIB
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {linkCode && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(`/start ${linkCode}`)}
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 mr-1" />
                                )}
                                Salin /start {linkCode}
                              </Button>

                              <a
                                href={directBotUrl || `https://t.me/${botUsername}?start=${linkCode}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                Buka Bot Otomatis
                              </a>
                            </>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isGeneratingCode}
                            onClick={handleGenerateLinkCode}
                          >
                            {linkCode ? 'Buat Kode Baru' : 'Hubungkan Telegram'}
                          </Button>
                        </div>
                      </div>

                      {linkCode && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kode Siap Digunakan!
                          </p>
                          <p>
                            Buka Telegram dan kirim pesan: <code className="font-bold font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">/start {linkCode}</code> atau klik tombol <strong>Buka Bot Otomatis</strong> di atas.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
            <CardContent className="space-y-6">
              {/* Form Tambah Kategori Baru */}
              <form onSubmit={handleCreateCategory} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Kategori Baru</label>
                  <input
                    type="text"
                    placeholder="Contoh: Belanja Online, Donasi"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="w-full sm:w-40 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jenis Kategori</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
                <Button type="submit" size="sm" variant="primary" isLoading={isAddingCat} className="w-full sm:w-auto">
                  + Tambah Kategori
                </Button>
              </form>

              {/* Grid Kategori Tersimpan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 col-span-3 text-center">Memuat kategori...</p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🏷️</span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{cat.name}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold capitalize">
                            {cat.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                            {cat.is_system ? ' • Sistem' : ' • Kustom'}
                          </span>
                        </div>
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color || '#F97316' }} />
                    </div>
                  ))
                )}
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
                  {planCode === 'pro' ? (
                    <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 text-emerald-800 text-center font-bold text-xs border border-emerald-200">
                      ✓ Paket Pro Anda Sedang Aktif
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
