# Panduan Setup & Deployment Produksi TataDana SaaS

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan deployment platform **TataDana** ke lingkungan produksi (Vercel & Supabase).

---

## 1. Persiapan Supabase Database & Auth

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Salin **Project URL** dan **Anon Key** dari menu `Project Settings -> API`.
3. Salin **Service Role Key** (hanya digunakan di server, jangan pernah diekspos ke klien).

### Menjalankan Database Migrations & Seeds
Jalankan file SQL migrasi yang telah disediakan di folder repository:
1. Buka menu **SQL Editor** di dashboard Supabase Anda.
2. Buka berkas `supabase/migrations/20260101000000_tatadana_core_schema.sql`, salin seluruh isinya, dan klik **Run**.
   - Ini akan membuat seluruh 20 tabel, indeks performa, RLS policies, serta fungsi finansial atomik (`transfer_wallet_balance`, `record_transaction_atomic`, `delete_transaction_atomic`).
3. Buka berkas `supabase/seed.sql`, salin isinya, dan klik **Run** untuk memasukkan paket Starter & Pro, kategori default Indonesia, dan registri AI provider.

### Konfigurasi Storage Bucket
1. Buka menu **Storage** di Supabase.
2. Buat bucket baru bernama `tatadana-receipts` dengan status **Private**.

---

## 2. Pengaturan Kredensial Environment Variables

Pada dashboard hosting (misal: **Vercel Project Settings -> Environment Variables**), tambahkan variabel berikut:

| Nama Variabel | Deskripsi | Contoh Nilai |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi web | `https://tatadana.id` |
| `APP_BASE_URL` | URL dasar aplikasi server-side | `https://tatadana.id` |
| `WEBHOOK_BASE_URL` | URL webhook untuk Telegram & Midtrans | `https://tatadana.id` |
| `NEXT_PUBLIC_SUPABASE_URL` | Endpoint REST Supabase | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public publishable anon key Supabase | `eyJhbGciOi...` |
| `SUPABASE_URL` | Endpoint server-side Supabase | `https://xyzproject.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service-role key Supabase | `eyJhbGciOi...` |
| `SUPABASE_STORAGE_BUCKET` | Nama bucket storage struk | `tatadana-receipts` |
| `ENCRYPTION_KEY` | Master key AES-256-GCM (64 karakter hex) | `openssl rand -hex 32` |
| `CRON_SECRET` | Kunci otentikasi scheduler reminder | `random_string_minimal_32_karakter` |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram dari @BotFather | `1234567890:ABCdef...` |
| `TELEGRAM_BOT_SECRET_TOKEN` | Secret token verifikasi header webhook | `random_webhook_secret_token` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username bot Telegram tanpa '@' | `TataDanaBot` |
| `GEMINI_API_KEY` | API Key Google Gemini 1.5 Flash | `AIzaSy...` |
| `OPENAI_API_KEY` | API Key OpenAI (GPT-4o mini & Whisper) | `sk-...` |
| `DEEPSEEK_API_KEY` | API Key DeepSeek Chat V3 | `sk-...` |
| `MIDTRANS_SERVER_KEY` | Server Key dari portal Midtrans | `Mid-server-...` atau `SB-Mid-server-...` |
| `MIDTRANS_CLIENT_KEY` | Client Key dari portal Midtrans | `Mid-client-...` atau `SB-Mid-client-...` |
| `MIDTRANS_IS_PRODUCTION` | Mode produksi Midtrans (`true` / `false`) | `false` (sandbox) atau `true` |

---

## 3. Konfigurasi Telegram Bot & Pemasangan Webhook

1. Buka Telegram dan chat dengan [@BotFather](https://t.me/BotFather).
2. Ketik `/newbot`, beri nama display (contoh: `TataDana Keuangan`) dan username bot (contoh: `TataDanaBot`).
3. Salin token API yang diberikan @BotFather ke variabel `TELEGRAM_BOT_TOKEN`.
4. Untuk memasang webhook publik Telegram secara otomatis, jalankan HTTP request:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://tatadana.id/api/telegram/webhook",
       "secret_token": "<TELEGRAM_BOT_SECRET_TOKEN>",
       "allowed_updates": ["message"]
     }'
   ```
5. Verifikasi status webhook dengan:
   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
   ```

---

## 4. Konfigurasi Midtrans Payment Gateway

1. Buat akun di [Midtrans Portal](https://dashboard.midtrans.com).
2. Di menu **Settings -> Access Keys**, salin Server Key dan Client Key.
3. Di menu **Settings -> Configuration**:
   - Masukkan **Payment Notification URL**: `https://tatadana.id/api/payments/midtrans-webhook`
   - Masukkan **Finish Redirect URL**: `https://tatadana.id/dashboard/settings?tab=subscription&payment=finish`
   - Masukkan **Unfinish Redirect URL**: `https://tatadana.id/dashboard/settings?tab=subscription&payment=unfinish`
   - Masukkan **Error Redirect URL**: `https://tatadana.id/dashboard/settings?tab=subscription&payment=error`

---

## 5. Konfigurasi Cron Job / Scheduler Pengingat Harian

Endpoint pengingat: `GET /api/cron/reminders`

Untuk memicu pengingat harian secara otomatis di Vercel, tambahkan `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "0 13 * * *"
    }
  ]
}
```
*(Catatan: Jam 01:00 UTC setara dengan 08:00 WIB, dan 13:00 UTC setara dengan 20:00 WIB).*

Atau gunakan cron eksternal (seperti GitHub Actions atau EasyCron):
```bash
curl -X GET "https://tatadana.id/api/cron/reminders" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

## 6. Verifikasi URL dan Rute Publik

Setelah deployment berhasil di Vercel, pastikan seluruh rute berikut dapat diakses:
- **Landing Page**: `https://tatadana.id/`
- **Dashboard Pengguna**: `https://tatadana.id/dashboard`
- **Pencatatan Transaksi**: `https://tatadana.id/dashboard/transaksi`
- **Laporan & Ekspor**: `https://tatadana.id/dashboard/laporan`
- **Budget**: `https://tatadana.id/dashboard/budget`
- **Multi-Wallet**: `https://tatadana.id/dashboard/wallet`
- **Pengaturan & Telegram**: `https://tatadana.id/dashboard/settings`
- **Admin Console**: `https://tatadana.id/admin`
- **Halaman Masuk**: `https://tatadana.id/login`
- **Halaman Daftar**: `https://tatadana.id/register`
- **Webhook Endpoint**: `https://tatadana.id/api/telegram/webhook`
