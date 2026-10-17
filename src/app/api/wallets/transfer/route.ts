import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { fromWalletId, toWalletId, amount, notes, date = new Date().toISOString() } = body;

    if (!fromWalletId || !toWalletId) {
      return NextResponse.json({ error: 'Dompet sumber dan tujuan wajib dipilih' }, { status: 400 });
    }

    if (fromWalletId === toWalletId) {
      return NextResponse.json(
        { error: 'Dompet sumber dan tujuan tidak boleh sama' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Nominal transfer harus lebih dari 0' }, { status: 400 });
    }

    // Call atomic stored procedure
    const { data, error } = await supabase.rpc('transfer_wallet_balance', {
      p_user_id: user.id,
      p_from_wallet_id: fromWalletId,
      p_to_wallet_id: toWalletId,
      p_amount: numAmount,
      p_notes: notes || null,
      p_date: date,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Wallets Transfer API] Error:', err);
    return NextResponse.json({ error: 'Gagal memproses transfer dompet' }, { status: 500 });
  }
}
