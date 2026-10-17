import * as React from 'react';
import { LandingNavbar } from '@/components/landing/navbar';
import { PricingSection } from '@/components/landing/pricing-section';
import { FaqSection } from '@/components/landing/faq-section';
import { LandingFooter } from '@/components/landing/footer';

export const metadata = {
  title: 'Paket & Harga',
  description: 'Daftar paket harga TataDana Starter bulanan dan Pro sekali bayar lifetime.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col pt-20">
      <LandingNavbar />
      <div className="flex-1">
        <PricingSection />
        <FaqSection />
      </div>
      <LandingFooter />
    </div>
  );
}
