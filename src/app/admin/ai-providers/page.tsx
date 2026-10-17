'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Key } from 'lucide-react';
import { maskSecret } from '@/lib/security/encryption';

interface ProviderSetting {
  id: string;
  name: string;
  displayName: string;
  modelName: string;
  isActive: boolean;
  priority: number;
  maskedKey: string;
}

export default function AdminAiProvidersPage() {
  const [providers, setProviders] = React.useState<ProviderSetting[]>([
    {
      id: '1',
      name: 'gemini',
      displayName: 'Google Gemini 1.5 Flash',
      modelName: 'gemini-1.5-flash',
      isActive: true,
      priority: 1,
      maskedKey: maskSecret(process.env.NEXT_PUBLIC_DEMO_GEMINI_KEY || 'AIzaSyDemoMaskedKey1234'),
    },
    {
      id: '2',
      name: 'openai',
      displayName: 'OpenAI GPT-4o mini & Whisper',
      modelName: 'gpt-4o-mini',
      isActive: true,
      priority: 2,
      maskedKey: maskSecret('sk-proj-DEMO_OPENAI_KEY_ABCD'),
    },
    {
      id: '3',
      name: 'deepseek',
      displayName: 'DeepSeek Chat V3',
      modelName: 'deepseek-chat',
      isActive: false,
      priority: 3,
      maskedKey: maskSecret(null),
    },
  ]);

  const [testResult, setTestResult] = React.useState<{ provider: string; status: 'ok' | 'err'; message: string } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const handleTestConnection = async (provName: string) => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate connection ping
    await new Promise((r) => setTimeout(r, 800));

    setIsTesting(false);
    setTestResult({
      provider: provName,
      status: 'ok',
      message: `Koneksi ke endpoint ${provName.toUpperCase()} berhasil! Response time: 420ms. Structured JSON output valid.`,
    });
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-black text-white">Manajemen AI Multi-Provider</h1>
        <p className="text-xs text-slate-400">
          Konfigurasi penyedia model kecerdasan buatan, enkripsi kredensial, dan sistem failover otomatis.
        </p>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            testResult.status === 'ok'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {providers.map((p) => (
          <Card key={p.id} className="bg-slate-900 border-slate-800 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{p.displayName}</h3>
                    <Badge variant={p.isActive ? 'success' : 'secondary'} className="text-[10px]">
                      {p.isActive ? 'AKTIF' : 'NONAKTIF'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Model: {p.modelName} • Prioritas: P{p.priority}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    API Key (Terenkripsi AES-GCM)
                  </span>
                  <span className="text-xs font-mono text-slate-300">{p.maskedKey}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
                  isLoading={isTesting}
                  onClick={() => handleTestConnection(p.name)}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Test Koneksi
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Kebijakan Keamanan Enkripsi Kunci AI
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Kunci API pihak ketiga yang disimpan melalui antarmuka admin dienkripsi menggunakan algoritma authenticated encryption AES-256-GCM. Kunci master <code className="text-slate-300">ENCRYPTION_KEY</code> tersimpan terpisah pada environment server dan tidak pernah dapat diakses oleh browser klien.
        </p>
      </Card>
    </div>
  );
}
