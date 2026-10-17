import * as React from 'react';
import { LandingNavbar } from '@/components/landing/navbar';
import { LandingFooter } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi perlindungan data pengguna TataDana.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col pt-24">
      <LandingNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Kebijakan Privasi TataDana</h1>
          <p className="text-xs text-slate-500 mt-1">Terakhir diperbarui: Oktober 2026</p>
        </div>

        <Card className="p-8 prose prose-slate text-xs leading-relaxed space-y-4 bg-white">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">1. Pendahuluan</h3>
            <p className="text-slate-600">
              PT TataDana Finansial Teknologi berkomitmen untuk melindungi privasi dan keamanan data finansial pribadi Anda. Kebijakan ini menjelaskan bagaimana data dikumpulkan, diproses, dan disimpan saat Anda menggunakan aplikasi web dan bot Telegram TataDana.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">2. Data yang Kami Kumpulkan</h3>
            <p className="text-slate-600">
              Kami mengumpulkan data yang Anda berikan secara sukarela, meliputi:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>Informasi Akun: Nama lengkap, alamat email, nomor telepon terverifikasi.</li>
              <li>Data Telegram: ID Telegram pengguna dan username untuk keperluan otorisasi linking bot.</li>
              <li>Data Transaksi: Catatan pengeluaran, pemasukan, nominal, kategori, nama dompet, dan foto struk belanja yang diunggah.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">3. Keamanan dan Row Level Security (RLS)</h3>
            <p className="text-slate-600">
              Seluruh catatan transaksi disimpan dalam basis data PostgreSQL dengan kebijakan Row Level Security (RLS) yang ketat. Pengguna hanya dapat membaca dan mengubah data miliknya sendiri. Kunci API eksternal dan kredensial rahasia dienkripsi menggunakan standar AES-256-GCM.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">4. Pembagian Data kepada Pihak Ketiga</h3>
            <p className="text-slate-600">
              Kami tidak pernah menjual data finansial Anda. Data teks transaksi dan gambar struk diproses oleh model kecerdasan buatan (seperti Google Gemini atau OpenAI) semata-mata untuk ekstraksi terstruktur dan tidak digunakan untuk melatih model publik.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">5. Kontak Privasi</h3>
            <p className="text-slate-600">
              Jika Anda memiliki pertanyaan mengenai privasi atau ingin mengajukan penghapusan akun, silakan hubungi tim kami melalui email resmi di: <a href="mailto:privacy@tatadana.id" className="text-orange-600 font-bold">privacy@tatadana.id</a>.
            </p>
          </section>
        </Card>
      </main>
      <LandingFooter />
    </div>
  );
}
