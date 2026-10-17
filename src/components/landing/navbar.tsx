'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Send, Menu, X } from 'lucide-react';

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
            T
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
              Tata<span className="text-orange-500">Dana</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider block">
              Fintech Telegram SaaS
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#fitur" className="hover:text-orange-600 transition-colors">
            Fitur Utama
          </a>
          <a href="#simulator" className="hover:text-orange-600 transition-colors">
            Simulasi Bot
          </a>
          <a href="#harga" className="hover:text-orange-600 transition-colors">
            Harga
          </a>
          <a href="#faq" className="hover:text-orange-600 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-slate-700">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="font-bold shadow-sm shadow-orange-500/25">
              Coba Gratis
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 animate-fade-in">
          <a
            href="#fitur"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 py-1.5"
          >
            Fitur Utama
          </a>
          <a
            href="#simulator"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 py-1.5"
          >
            Simulasi Bot
          </a>
          <a
            href="#harga"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 py-1.5"
          >
            Harga
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 py-1.5"
          >
            FAQ
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Masuk
              </Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button variant="primary" size="sm" className="w-full">
                Coba Gratis
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
