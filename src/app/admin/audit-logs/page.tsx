'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateWIB } from '@/lib/utils';
import { ScrollText, ShieldAlert } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const auditLogs = [
    {
      id: 'aud-1',
      actorEmail: 'admin@tatadana.id',
      action: 'PAYMENT_APPROVED_MANUAL',
      target: 'usr-1 (Ahmad Fasya)',
      details: 'Mutasi BCA Rp 99.000 terverifikasi valid',
      ip: '180.252.12.98',
      createdAt: '2026-10-17T07:15:00Z',
    },
    {
      id: 'aud-2',
      actorEmail: 'admin@tatadana.id',
      action: 'SUPPORT_IMPERSONATION_STARTED',
      target: 'usr-2 (Budi Santoso)',
      details: 'Troubleshoot format struk gagal terbaca via Telegram OCR',
      ip: '180.252.12.98',
      createdAt: '2026-10-16T15:30:00Z',
    },
    {
      id: 'aud-3',
      actorEmail: 'system',
      action: 'SUBSCRIPTION_ACTIVATED_MIDTRANS',
      target: 'usr-3 (Citra Kirana)',
      details: 'Order ID: TATADANA-PRO-1729142000 Settlement via QRIS',
      ip: '103.12.44.1',
      createdAt: '2026-10-16T14:10:00Z',
    },
  ];

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-amber-400" />
          Audit Logs Sistem (Immutable)
        </h1>
        <p className="text-xs text-slate-400">
          Seluruh aktivitas administratif dan perubahan status finansial dicatat secara permanen dan tidak dapat diubah.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Aktor / Admin</th>
                <th className="py-3 px-4">Aktivitas</th>
                <th className="py-3 px-4">Target Pengguna</th>
                <th className="py-3 px-4">Keterangan / Alasan</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDateWIB(log.createdAt, 'full')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                    {log.actorEmail}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant="secondary" className="font-mono text-[10px] bg-slate-800 text-amber-400 border-amber-500/20">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-200">
                    {log.target}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-sm">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
