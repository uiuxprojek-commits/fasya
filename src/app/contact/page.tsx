import * as React from 'react';
import { LandingNavbar } from '@/components/landing/navbar';
import { LandingFooter } from '@/components/landing/footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, MessageCircle, MapPin, Send } from 'lucide-react';

export const metadata = {
  title: 'Kontak & Dukungan',
  description: 'Hubungi tim dukungan teknis dan layanan pelanggan TataDana.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col pt-24">
      <LandingNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Hubungi Tim TataDana</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Punya pertanyaan seputar integrasi bot Telegram, upgrade paket Pro, atau butuh bantuan teknis? Kami siap membantu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 text-center space-y-2 bg-white">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Email Resmi</h4>
            <p className="text-xs text-slate-500">Respon dalam 1x24 jam</p>
            <a href="mailto:support@tatadana.id" className="text-xs font-bold text-orange-600 block">
              support@tatadana.id
            </a>
          </Card>

          <Card className="p-5 text-center space-y-2 bg-white">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Telegram Support</h4>
            <p className="text-xs text-slate-500">Bantuan langsung di chat</p>
            <a href="https://t.me/TataDanaSupport" className="text-xs font-bold text-sky-600 block">
              @TataDanaSupport
            </a>
          </Card>

          <Card className="p-5 text-center space-y-2 bg-white">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Kantor Operasional</h4>
            <p className="text-xs text-slate-500">Jakarta Selatan, DKI Jakarta</p>
            <span className="text-xs font-semibold text-slate-700 block">Indonesia 🇮🇩</span>
          </Card>
        </div>

        <Card className="p-8 max-w-xl mx-auto bg-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Kirim Pesan Langsung</CardTitle>
            <CardDescription>
              Isi formulir di bawah ini untuk bantuan akun atau kemitraan bisnis.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <Input label="Nama Lengkap" placeholder="Nama Anda" />
            <Input label="Email Anda" type="email" placeholder="nama@email.com" />
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Pesan atau Pertanyaan
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan kendala atau pertanyaan Anda di sini..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <Button variant="primary" className="w-full">
              <Send className="w-4 h-4 mr-1.5" />
              Kirim Pesan
            </Button>
          </CardContent>
        </Card>
      </main>
      <LandingFooter />
    </div>
  );
}
