'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Sparkles, CheckCheck } from 'lucide-react';
import { heuristicFallbackParser } from '@/lib/ai/router';
import { formatExpenseReply, formatIncomeReply } from '@/lib/telegram/formatter';
import { formatRupiah } from '@/lib/utils';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export function InteractiveDemoSimulator() {
  const [inputText, setInputText] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      sender: 'user',
      text: 'beli bakso 15rb',
      time: '12:30 WIB',
    },
    {
      sender: 'bot',
      text: formatExpenseReply({
        date: new Date(),
        amount: 15000,
        categoryName: 'Makanan & Minuman',
        categoryIcon: '🍜',
        walletName: 'BCA Utama',
        notes: 'beli bakso',
        newBalance: 4785000,
        budgetTotal: 1500000,
        budgetSpent: 420000,
      }),
      time: '12:30 WIB',
    },
  ]);

  const [currentBalance, setCurrentBalance] = React.useState(4785000);
  const [isTyping, setIsTyping] = React.useState(false);

  const samplePrompts = [
    'kopi starbucks 65rb',
    'bayar bensin 50k',
    'gajian 7.5jt',
    'beli obat 45.000',
  ];

  const handleSend = (textToSend?: string) => {
    const raw = textToSend || inputText;
    if (!raw.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: raw,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const parsed = heuristicFallbackParser(raw);
      let replyText = '';
      let newBal = currentBalance;

      if (parsed.jenis === 'pemasukan') {
        newBal += parsed.nominal;
        replyText = formatIncomeReply({
          date: new Date(),
          amount: parsed.nominal,
          categoryName: parsed.kategori,
          walletName: 'BCA Utama',
          newBalance: newBal,
        });
      } else {
        newBal -= parsed.nominal;
        replyText = formatExpenseReply({
          date: new Date(),
          amount: parsed.nominal,
          categoryName: parsed.kategori,
          walletName: 'BCA Utama',
          notes: parsed.catatan,
          newBalance: newBal,
          budgetTotal: 1500000,
          budgetSpent: 550000,
        });
      }

      setCurrentBalance(newBal);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        },
      ]);
    }, 600);
  };

  return (
    <div id="simulator" className="py-12">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          🎮 Simulasi Interaktif Bot Telegram
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Coba Ketik Transaksimu Sekarang
        </h3>
        <p className="text-xs text-slate-500">
          *Contoh preview interaktif dengan <strong>data DEMO</strong>. Bukan sistem pencatatan akun nyata.
        </p>
      </div>

      <div className="max-w-md mx-auto rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 overflow-hidden">
        {/* Telegram Header */}
        <div className="p-4 bg-[#2AABEE] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">TataDana Bot (Official)</h4>
              <p className="text-[11px] text-sky-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> bot selalu aktif
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-sky-100">
            <span>Saldo Demo:</span>
            <span className="font-extrabold text-white block">{formatRupiah(currentBalance)}</span>
          </div>
        </div>

        {/* Telegram Chat Area */}
        <div className="p-4 bg-[#F2F4F7] h-96 overflow-y-auto space-y-3 font-sans">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#EEFFDE] text-slate-900 rounded-tr-xs'
                    : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/60'
                }`}
              >
                {m.text}
                <div
                  className={`mt-1 text-[9px] flex items-center gap-1 justify-end ${
                    m.sender === 'user' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span>{m.time}</span>
                  {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-600 inline" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white/80 p-2 rounded-xl w-fit">
              <span className="animate-pulse">TataDana Bot sedang mengetik...</span>
            </div>
          )}
        </div>

        {/* Sample chips */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
            Coba:
          </span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-600 transition-colors shrink-0 shadow-2xs"
            >
              &quot;{prompt}&quot;
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ketik pengeluaranmu (misal: bayar listrik 150rb)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
          />
          <Button
            type="submit"
            size="sm"
            className="bg-[#2AABEE] hover:bg-[#2297D6] text-white px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
