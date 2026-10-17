'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import { Check, X, CreditCard, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface PaymentRow {
  id: string;
  orderId: string;
  userName: string;
  userEmail: string;
  amount: number;
  planName: string;
  type: 'midtrans' | 'manual_transfer';
  status: 'pending' | 'settlement' | 'manual_verification' | 'rejected';
  proofUrl?: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<PaymentRow[]>([
    {
      id: 'pay-1',
      orderId: 'TATADANA-PRO-1729158000',
      userName: 'Doni Pratama',
      userEmail: 'doni.pratama@gmail.com',
      amount: 99000,
      planName: 'Pro (Sekali Bayar)',
      type: 'manual_transfer',
      status: 'manual_verification',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      createdAt: '2026-10-17T06:30:00Z',
    },
    {
      id: 'pay-2',
      orderId: 'TATADANA-PRO-1729142000',
      userName: 'Ahmad Fasya',
      userEmail: 'fasya@tatadana.id',
      amount: 99000,
      planName: 'Pro (Sekali Bayar)',
      type: 'midtrans',
      status: 'settlement',
      createdAt: '2026-10-16T14:10:00Z',
    },
    {
      id: 'pay-3',
      orderId: 'TATADANA-STARTER-1729130000',
      userName: 'Rini Anggraini',
      userEmail: 'rini.ang@gmail.com',
      amount: 49000,
      planName: 'Starter (Bulanan)',
      type: 'midtrans',
      status: 'settlement',
      createdAt: '2026-10-15T09:20:00Z',
    },
  ]);

  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRow | null>(null);
  const [approvalAction, setApprovalAction] = React.useState<'approve' | 'reject'>('approve');
  const [decisionNotes, setDecisionNotes] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 600));

    setPayments((prev) =>
      prev.map((p) =>
        p.id === selectedPayment.id
          ? {
              ...p,
              status: approvalAction === 'approve' ? 'settlement' : 'rejected',
            }
          : p
      )
    );

    setIsProcessing(false);
    setSelectedPayment(null);
    setDecisionNotes('');
    alert(
      `Pembayaran ${selectedPayment.orderId} berhasil di-${approvalAction === 'approve' ? 'SETUJUI (Pro aktif)' : 'TOLAK'}.`
    );
  };

  return (
    <div className="flex-1 p-3.5 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-black text-white">Verifikasi & Transaksi Pembayaran</h1>
        <p className="text-xs text-slate-400">
          Tinjau pembayaran otomatis Midtrans dan lakukan approval manual transfer bank.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Order ID & Waktu</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Paket & Metode</th>
                <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-white">{p.orderId}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateWIB(p.createdAt, 'short')}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{p.userName}</p>
                    <p className="text-[11px] text-slate-400">{p.userEmail}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-200">{p.planName}</p>
                    <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                      {p.type === 'midtrans' ? 'Midtrans Snap' : 'Transfer Manual'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-white">
                    {formatRupiah(p.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.status === 'settlement' ? (
                      <Badge variant="success" className="bg-emerald-950/80 text-emerald-400 border-emerald-800">
                        BERHASIL
                      </Badge>
                    ) : p.status === 'manual_verification' ? (
                      <Badge variant="warning" className="bg-amber-950/80 text-amber-400 border-amber-800">
                        PERLU VERIFIKASI
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="bg-red-950/80 text-red-400 border-red-800">
                        DITOLAK
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {p.status === 'manual_verification' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs py-1 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                        onClick={() => setSelectedPayment(p)}
                      >
                        Tinjau Bukti
                      </Button>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">Tervalidasi</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Transfer Verification Modal */}
      {selectedPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title={`Verifikasi Pembayaran: ${selectedPayment.orderId}`}
          description="Periksa bukti transfer dan pastikan mutasi telah masuk ke rekening BCA resmi TataDana."
        >
          <form onSubmit={handleDecision} className="space-y-4 mt-2">
            <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-xs text-slate-700">
              <p><strong>Nama:</strong> {selectedPayment.userName} ({selectedPayment.userEmail})</p>
              <p><strong>Nominal:</strong> {formatRupiah(selectedPayment.amount)}</p>
              <p><strong>Paket:</strong> {selectedPayment.planName}</p>
            </div>

            {selectedPayment.proofUrl && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Bukti Pembayaran:</span>
                <div className="w-full h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPayment.proofUrl}
                    alt="Bukti Transfer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Keputusan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalAction('approve')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    approvalAction === 'approve'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Setujui & Aktifkan Pro
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalAction('reject')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    approvalAction === 'reject'
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Tolak Pembayaran
                </button>
              </div>
            </div>

            <div>
              <Input
                label="Catatan Keputusan Admin (Wajib Masuk Audit Log)"
                placeholder="Contoh: Mutasi BCA Rp 99.000 terverifikasi valid"
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedPayment(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={isProcessing}>
                Konfirmasi Keputusan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
