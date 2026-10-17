import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('is_default', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ wallets: wallets || [] });
  } catch (err) {
    console.error('[Wallets API] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { name, type = 'cash', initialBalance = 0, isDefault = false, color = '#F97316' } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nama dompet wajib diisi' }, { status: 400 });
    }

    // Check wallet count limit based on plan
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(max_wallets)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const maxWallets = sub?.plan?.max_wallets ?? 3; // Default 3 for Starter
    if (maxWallets > 0) {
      const { count } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if ((count || 0) >= maxWallets) {
        return NextResponse.json(
          {
            error: `Batas jumlah dompet untuk paket Anda (${maxWallets} dompet) telah tercapai. Upgrade ke Pro untuk dompet unlimited.`,
          },
          { status: 403 }
        );
      }
    }

    // If marked default, unset other defaults
    if (isDefault) {
      await supabase.from('wallets').update({ is_default: false }).eq('user_id', user.id);
    }

    const { data: newWallet, error: insertErr } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        name: name.trim(),
        type,
        balance: initialBalance,
        is_default: isDefault,
        color,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, wallet: newWallet });
  } catch (err) {
    console.error('[Wallets API] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
