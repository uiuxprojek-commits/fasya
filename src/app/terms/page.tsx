import * as React from 'react';
import { LandingNavbar } from '@/components/landing/navbar';
import { LandingFooter } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan penggunaan platform TataDana.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col pt-24">
      <LandingNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Syarat & Ketentuan TataDana</h1>
          <p className="text-xs text-slate-500 mt-1">Terakhir diperbarui: Oktober 2026</p>
        </div>

        <Card className="p-8 prose prose-slate text-xs leading-relaxed space-y-4 bg-white">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">1. Penerimaan Ketentuan</h3>
            <p className="text-slate-600">
              Dengan membuat akun, mengakses dashboard web, atau mengirimkan perintah ke bot Telegram TataDana, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">2. Batasan Layanan & Nasihat Finansial</h3>
            <p className="text-slate-600">
              TataDana adalah alat pencatatan dan visualisasi keuangan pribadi. Analisis atau rekomendasi yang diberikan oleh AI Financial Advisor merupakan simulasi matematis berbasis riwayat belanja Anda dan <strong>bukan merupakan nasihat investasi profesional, hukum, atau perpajakan</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">3. Langganan dan Kebijakan Pembayaran</h3>
            <p className="text-slate-600">
              Paket Starter ditagihkan bulanan sebesar Rp 49.000. Paket Pro adalah model sekali bayar sebesar Rp 99.000 dengan akses fitur lanjutan seumur hidup tanpa biaya tersembunyi.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">4. Kewajiban Pengguna</h3>
            <p className="text-slate-600">
              Pengguna bertanggung jawab menjaga kerahasiaan kata sandi dan kode tautan Telegram. Pengguna dilarang menyalahgunakan endpoint webhook, melakukan spamming ke bot, atau mencoba mengeksploitasi sistem keamanan.
            </p>
          </section>
        </Card>
      </main>
      <LandingFooter />
    </div>
  );
}
