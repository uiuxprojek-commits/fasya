'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import { Search, Eye, ShieldAlert, CheckCircle, Clock, Send } from 'lucide-react';

interface MockUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  plan: 'starter' | 'pro';
  telegramUsername?: string;
  totalBalance: number;
  transactionCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState('');
  const [impersonatingUser, setImpersonatingUser] = React.useState<MockUser | null>(null);
  const [impersonateReason, setImpersonateReason] = React.useState('');
  const [isAuditing, setIsAuditing] = React.useState(false);

  const mockUsers: MockUser[] = [
    {
      id: 'usr-1',
      fullName: 'Ahmad Fasya',
      email: 'fasya@tatadana.id',
      phone: '+6281234567890',
      plan: 'pro',
      telegramUsername: 'fasya_dev',
      totalBalance: 4800000,
      transactionCount: 142,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr-2',
      fullName: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      phone: '+6281987654321',
      plan: 'starter',
      telegramUsername: 'budis_id',
      totalBalance: 1250000,
      transactionCount: 38,
      createdAt: '2026-10-02T10:30:00Z',
    },
    {
      id: 'usr-3',
      fullName: 'Citra Kirana',
      email: 'citra.kirana@yahoo.com',
      phone: '+6285211223344',
      plan: 'pro',
      telegramUsername: undefined,
      totalBalance: 7900000,
      transactionCount: 210,
      createdAt: '2026-08-15T14:20:00Z',
    },
  ];

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.telegramUsername && u.telegramUsername.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impersonatingUser || !impersonateReason) return;

    setIsAuditing(true);
    // In real environment: posts to /api/admin/impersonate which records in audit_logs
    await new Promise((r) => setTimeout(r, 600));
    setIsAuditing(false);
    alert(
      `Mode Dukungan Aktif untuk ${impersonatingUser.fullName}. Tindakan ini telah dicatat dalam Audit Log dengan alasan: "${impersonateReason}".`
    );
    setImpersonatingUser(null);
    setImpersonateReason('');
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-black text-white">Manajemen Pengguna</h1>
        <p className="text-xs text-slate-400">
          Cari dan audit data profil, paket berlangganan, serta status integrasi Telegram pengguna.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-4">
        <Input
          placeholder="Cari berdasarkan nama, email, atau username Telegram..."
          leftIcon={<Search className="w-4 h-4 text-slate-500" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
        />
      </Card>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Paket</th>
                <th className="py-3 px-4">Telegram Bot</th>
                <th className="py-3 px-4 text-right">Saldo Terkelola</th>
                <th className="py-3 px-4 text-right">Jml Transaksi</th>
                <th className="py-3 px-4 text-center">Aksi Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{u.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{u.id}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p>{u.email}</p>
                    <p className="text-[11px] text-slate-400">{u.phone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.plan === 'pro' ? 'pro' : 'secondary'}>
                      {u.plan.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.telegramUsername ? (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-semibold">
                        <Send className="w-3 h-3" /> @{u.telegramUsername}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Belum terhubung</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-white">
                    {formatRupiah(u.totalBalance)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                    {u.transactionCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs py-1 px-2.5"
                      onClick={() => setImpersonatingUser(u)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      Mode Support
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Support Impersonation Modal */}
      {impersonatingUser && (
        <Modal
          isOpen={true}
          onClose={() => setImpersonatingUser(null)}
          title={`Mode Dukungan: ${impersonatingUser.fullName}`}
          description="Akses troubleshoot akun pengguna untuk membantu keluhan finansial. Tindakan ini tunduk pada audit wajib."
        >
          <form onSubmit={handleStartImpersonation} className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> PERHATIAN KEAMANAN & PRIVASI
              </p>
              <p className="text-amber-200/80">
                Mode support tidak mengizinkan melihat password pengguna atau kunci API privat. Seluruh data transaksi yang dilihat akan dicatat permanen dalam Audit Log.
              </p>
            </div>

            <div>
              <Input
                label="Alasan Kebutuhan Akses (Wajib)"
                placeholder="Contoh: Tiket #TD-4091 komplain struk tidak sinkron"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setImpersonatingUser(null)}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={isAuditing}>
                Mulai Mode Dukungan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
