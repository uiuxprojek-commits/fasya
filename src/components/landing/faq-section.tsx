'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: 'Bagaimana cara kerja TataDana?',
      a: 'TataDana menghubungkan akun keuangan Anda dengan bot Telegram resmi kami. Anda cukup mengirim pesan teks seperti "beli bakso 15rb", voice note, atau foto struk belanja. Kecerdasan buatan (AI) kami akan mengekstrak nominal, kategori, dan dompet, lalu langsung menyimpannya ke database dan memperbarui dashboard Anda secara real-time.',
    },
    {
      q: 'Apakah saya wajib memiliki akun Telegram?',
      a: 'Ya, Telegram adalah antarmuka utama untuk mencatat transaksi harian dengan cepat tanpa perlu membuka aplikasi web yang berat. Namun, seluruh laporan, grafik analisis, dan pengaturan budget dapat diakses melalui browser web.',
    },
    {
      q: 'Apakah paket Starter mendukung foto struk?',
      a: 'Paket Starter difokuskan untuk pencatatan berbasis teks dan pesan singkat. Fitur pemindaian foto struk otomatis berbasis AI Vision OCR tersedia secara eksklusif pada paket Pro.',
    },
    {
      q: 'Bagaimana keamanan data transaksi saya?',
      a: 'Data keuangan Anda dilindungi dengan enkripsi database Supabase PostgreSQL dan kebijakan ketat Row Level Security (RLS). Pengguna lain tidak memiliki akses ke catatan dompet atau transaksi Anda. Kami tidak pernah meminta kredensial perbankan atau PIN rahasia Anda.',
    },
    {
      q: 'Apakah bisa menggunakan beberapa dompet sekaligus?',
      a: 'Tentu! Paket Starter mendukung hingga 3 dompet (misal: Rekening Bank, Dompet Tunai, dan GoPay). Paket Pro mendukung jumlah dompet tanpa batas beserta fitur transfer saldo antar-dompet secara atomik.',
    },
    {
      q: 'Bagaimana cara menghubungkan bot Telegram?',
      a: 'Setelah mendaftar, buka menu Pengaturan -> Telegram Bot di dashboard Anda. Klik "Generate Kode Tautan", lalu kirim kode tersebut ke bot @TataDanaBot di Telegram. Akun Anda akan terhubung seketika.',
    },
    {
      q: 'Bagaimana cara upgrade ke paket Pro?',
      a: 'Anda dapat melakukan upgrade langsung dari dashboard melalui payment gateway Midtrans (mendukung QRIS, Virtual Account BCA/Mandiri/BRI, Kartu Kredit) atau transfer bank manual dengan mengunggah bukti bayar.',
    },
    {
      q: 'Bagaimana kebijakan pembatalan atau refund?',
      a: 'Paket Pro adalah model sekali bayar seumur hidup (lifetime). Kami memberikan jaminan kepuasan selama 7 hari pertama setelah aktivasi jika sistem mengalami kendala teknis yang tidak dapat diselesaikan oleh tim dukungan kami.',
    },
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            Pertanyaan Umum
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Kerap Ditanyakan Seputar TataDana
          </h2>
          <p className="text-sm text-slate-600">
            Semua hal yang perlu kamu ketahui tentang integrasi bot Telegram, paket Pro, dan privasi data.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/40 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-orange-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-orange-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
