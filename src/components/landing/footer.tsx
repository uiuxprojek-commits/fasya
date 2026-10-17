import * as React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-850">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1: Brand & Tagline */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg">
              T
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white block">
              Tata<span className="text-orange-500">Dana</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Catat keuangan semudah chat — langsung dari Telegram kamu. Solusi pencatatan arus kas pribadi tercepat dan terintegrasi AI di Indonesia.
          </p>
          <p className="text-[11px] text-slate-500">
            Zona Waktu Bisnis: Asia/Jakarta (WIB)
          </p>
        </div>

        {/* Col 2: Produk */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Produk</h4>
          <ul className="space-y-2">
            <li>
              <a href="#fitur" className="hover:text-white transition-colors">
                Fitur Unggulan
              </a>
            </li>
            <li>
              <a href="#simulator" className="hover:text-white transition-colors">
                Simulasi Bot Telegram
              </a>
            </li>
            <li>
              <a href="#harga" className="hover:text-white transition-colors">
                Paket Starter & Pro
              </a>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard Web
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Perusahaan */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Perusahaan</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Hubungi Kami
              </Link>
            </li>
            <li>
              <span className="text-slate-500">PT TataDana Finansial Teknologi</span>
            </li>
            <li>
              <span className="text-slate-500">Jakarta Selatan, DKI Jakarta</span>
            </li>
            <li>
              <a href="mailto:support@tatadana.id" className="hover:text-orange-400 transition-colors">
                support@tatadana.id
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Legal & Kepatuhan */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Legal & Kebijakan</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Kebijakan Privasi (Privacy Policy)
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Syarat & Ketentuan (Terms of Service)
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-white transition-colors">
                Kebijakan Pembayaran & Refund
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <p>© 2026 TataDana. Hak Cipta Dilindungi Undang-Undang Republik Indonesia.</p>
        <p>100% Produk FinTech Buatan Anak Bangsa 🇮🇩</p>
      </div>
    </footer>
  );
}
