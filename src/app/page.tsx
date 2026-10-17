import * as React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/navbar';
import { InteractiveDemoSimulator } from '@/components/landing/interactive-demo';
import { PricingSection } from '@/components/landing/pricing-section';
import { FaqSection } from '@/components/landing/faq-section';
import { LandingFooter } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Send,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  PieChart,
  Bot,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col text-slate-900 overflow-x-hidden">
      <LandingNavbar />

      {/* 1. HERO SECTION */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          ✨ Catat keuangan langsung dari Telegram
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
          Gaji habis sebelum akhir bulan? Sudah saatnya kamu tahu{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
            ke mana uangmu pergi.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-orange-500/25">
              Mulai Gratis Sekarang
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#simulator" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-slate-700">
              Lihat Cara Kerjanya
            </Button>
          </a>
        </div>

        {/* Hero Video / UI Preview Mockup */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-2xl shadow-slate-900/10">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-10 text-white relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-slate-400 ml-2">tatadana.id/dashboard</span>
                </div>
                <Badge variant="pro">LIVE DASHBOARD REAL-TIME</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Saldo Terkelola</span>
                  <div className="text-xl font-extrabold text-white mt-1">Rp 12.850.000</div>
                  <span className="text-[11px] text-emerald-400">3 dompet terhubung</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pengeluaran Bulan Ini</span>
                  <div className="text-xl font-extrabold text-red-400 mt-1">Rp 3.420.000</div>
                  <span className="text-[11px] text-slate-400">Sesuai batas budget</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Terakhir dari Bot Telegram</span>
                  <div className="text-xs font-bold text-amber-300 mt-1">&quot;beli bakso 15rb&quot;</div>
                  <span className="text-[10px] text-slate-400">Otomatis tercatat 2 mnt lalu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM AWARENESS */}
      <section className="py-20 bg-slate-100/60 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Apakah Kamu Merasakan Ini?
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Kenapa Mengelola Keuangan Seringkali Gagal?
            </h2>
            <p className="text-sm text-slate-600">
              Kebanyakan orang bukan tidak mau mengatur uang, tapi cara konvensional terlalu merepotkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-slate-200 space-y-3 bg-white">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">
                &quot;Buka aplikasi keuangan? Nanti dulu deh...&quot;
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi keuangan biasa terlalu ribet: harus login, pilih form bertingkat, cari kategori, dan tunggu loading. Ujung-ujungnya kamu malas mencatat.
              </p>
            </Card>

            <Card className="p-6 border-slate-200 space-y-3 bg-white">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">
                &quot;Kok uangnya tiba-tiba habis ya?&quot;
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengeluaran kecil seperti kopi kekinian, parkir, jajan sore, atau langganan digital sering terlupakan, lalu menumpuk hingga jutaan rupiah tanpa jejak.
              </p>
            </Card>

            <Card className="p-6 border-slate-200 space-y-3 bg-white">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">
                &quot;Udah niat bikin budget, tapi seminggu lupa&quot;
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tanpa pengingat proaktif dan evaluasi harian, anggaran bulanan hanya berakhir jadi catatan pasif di spreadsheet yang tidak pernah dibuka lagi.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. SOLUSI & PERKENALAN TATADANA */}
      <section className="py-20 max-w-7xl mx-auto px-6 text-center space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Solusi Revolusioner TataDana
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto">
          Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Tidak perlu install aplikasi tambahan yang memakan memori HP. Buka Telegram yang sudah biasa kamu gunakan setiap hari, ketik nominal belanjaanmu, dan AI TataDana akan mengurus pencatatan rapi ke database.
        </p>
      </section>

      {/* 4. INTERACTIVE DEMO SIMULATOR */}
      <div className="max-w-7xl mx-auto px-6 w-full">
        <InteractiveDemoSimulator />
      </div>

      {/* 5. FITUR UTAMA (3 ALTERNATING SECTIONS) */}
      <section id="fitur" className="py-20 space-y-20 max-w-7xl mx-auto px-6">
        {/* Feature 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <Badge variant="primary">Pencatatan Multi-Modal</Badge>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Catat Lewat Teks, Voice Note, & Foto Struk Belanja
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ketik dengan bahasa Indonesia sehari-hari seperti <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">beli bensin 50k</code>, kirim rekaman suara saat sedang menyetir, atau foto struk belanjaan minimarketmu. AI kami langsung membaca item dan harganya.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mengenali format lokal (rb, jt, k, rupiah)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI OCR struk mengekstrak hingga rincian per-item
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Transkripsi suara bahasa Indonesia akurat
              </li>
            </ul>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-orange-100 to-amber-50 border border-orange-200/60 shadow-lg">
            <div className="p-4 bg-white rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                <Receipt className="w-4 h-4" /> Contoh Pemindaian Struk AI
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Indomaret Point Sudirman</span>
                  <span>Rp 75.000</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  • Kopi Susu Gula Aren (1x) — Rp 22.000<br />
                  • Sandwich Tuna (1x) — Rp 28.000<br />
                  • Air Mineral 600ml (2x) — Rp 25.000
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-sky-100 to-blue-50 border border-sky-200/60 shadow-lg order-last lg:order-first">
            <div className="p-4 bg-white rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-2 text-sky-600">
                  <PieChart className="w-4 h-4" /> Laporan Eksekutif PDF & XLSX
                </span>
                <Badge variant="success">SIAP UNDUH</Badge>
              </div>
              <p className="text-xs text-slate-500">
                File resmi dengan kop surat TataDana, ringkasan net cashflow, dan tabel transaksi rapi.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <Badge variant="secondary">Dashboard Komprehensif</Badge>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Laporan Bersih, Grafik Visual, & Ekspor Resmi
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pantau kesehatan finansialmu lewat visualisasi grafik Recharts: perbandingan 6 bulan, tren harian, dan pie chart kategori. Unduh berkas PDF atau Excel kapan saja untuk kebutuhan arsip dan pajak pribadi.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ekspor berkas PDF resmi berkualitas tinggi
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Berkas spreadsheet Excel (.xlsx) dengan formula
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-wallet: BCA, Mandiri, GoPay, dan Tunai
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <Badge variant="primary">AI Financial Advisor</Badge>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Peringatan Budget 80% & Pengingat Harian
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              TataDana bukan sekadar buku kas pasif. Bot kami akan mengingatkan jika anggaran belanjamu sudah menyentuh 80% atau 100%, serta memberikan evaluasi belanja harian langsung ke chat Telegram Anda.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Peringatan otomatis sebelum overbudget
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dua kali reminder harian (Pagi & Malam WIB)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Motivasi finansial yang cerdas dan suportif
              </li>
            </ul>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-amber-100 to-orange-50 border border-amber-200/60 shadow-lg">
            <div className="p-4 bg-white rounded-2xl shadow-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-700">
                <Zap className="w-4 h-4" /> Peringatan Budget Otomatis
              </div>
              <p className="text-slate-700 leading-relaxed">
                &quot;⚠️ <strong>Budget Makanan kamu sudah mencapai 85%</strong> (sisa Rp 225.000). Pertimbangkan memasak di rumah untuk sisa minggu ini!&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONI (MASONRY PLACEHOLDER) */}
      <section className="py-20 bg-slate-100/50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Umpan Balik Komunitas Beta
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Apa Kata Mereka Tentang TataDana?
            </h2>
            <p className="text-xs text-amber-800 bg-amber-50 py-1 px-3 rounded-full border border-amber-200 inline-block font-semibold">
              *Contoh tampilan testimoni — bukan testimoni pengguna nyata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs">
                  RF
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rizky Febrian</h4>
                  <p className="text-[10px] text-slate-400">Freelancer Software Engineer</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                &quot;Biasanya cuma tahan catat keuangan 3 hari karena malas buka aplikasi. Dengan TataDana, habis bayar kopi tinggal ketik 2 detik di Telegram. Sangat praktis!&quot;
              </p>
            </Card>

            <Card className="p-5 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                  AN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Annisa Nurul</h4>
                  <p className="text-[10px] text-slate-400">Karyawan Swasta di Jakarta</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                &quot;Fitur foto struk di paket Pro benar-benar penyelamat. Struk belanja bulanan di supermarket langsung terbagi ke kategori makanan dan kebutuhan rumah tangga.&quot;
              </p>
            </Card>

            <Card className="p-5 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-xs">
                  DW
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Dimas Wahyu</h4>
                  <p className="text-[10px] text-slate-400">Mahasiswa Tingkat Akhir</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                &quot;Sangat terbantu dengan peringatan 80% budget. Dulu selalu bingung uang kiriman habis ke mana, sekarang pengeluaran harian terpantau rapi.&quot;
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <PricingSection />

      {/* 8. FAQ SECTION */}
      <FaqSection />

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-24 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-white text-center px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge variant="pro" className="py-1 px-3">
            MULAI KENDALIKAN FINANSIALMU
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Mulai Kendalikan Keuanganmu Hari Ini.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan pengguna cerdas di Indonesia yang mencatat keuangan mereka semudah chatting di Telegram.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button size="lg" variant="primary" className="font-extrabold px-9 py-6 text-base shadow-xl shadow-orange-500/20">
                Daftar Akun Gratis Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <LandingFooter />
    </div>
  );
}
