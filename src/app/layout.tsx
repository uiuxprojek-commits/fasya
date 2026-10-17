import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | TataDana — Fintech SaaS Indonesia",
    default: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram",
  },
  description:
    "TataDana adalah platform pengelolaan keuangan pribadi modern. Catat pengeluaran dan pemasukan langsung dari chat Telegram, voice note, atau foto struk secara real-time.",
  keywords: [
    "aplikasi keuangan",
    "catat pengeluaran telegram",
    "bot telegram keuangan",
    "manajemen budget rupiah",
    "fintech indonesia",
    "tatadana",
  ],
  authors: [{ name: "TataDana Team" }],
  creator: "TataDana",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://tatadana.id",
    title: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram",
    description:
      "Catat setiap rupiah langsung dari chat Telegram atau foto struk dengan AI — pantau saldo dan budget secara real-time.",
    siteName: "TataDana",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FBFBFD] text-slate-900 selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
