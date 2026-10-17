import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const walletId = searchParams.get('walletId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*), wallet:wallets(*), items:transaction_items(*)', {
        count: 'exact',
      })
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (walletId) query = query.eq('wallet_id', walletId);
    if (startDate) query = query.gte('date', `${startDate}T00:00:00.000Z`);
    if (endDate) query = query.lte('date', `${endDate}T23:59:59.999Z`);
    if (search) query = query.ilike('notes', `%${search}%`);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [], totalCount: count || 0 });
  } catch (err) {
    console.error('[Transactions API] GET error:', err);
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
    const {
      type,
      amount,
      walletId,
      categoryId,
      notes,
      date = new Date().toISOString(),
      source = 'web',
      receiptImageUrl,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Nominal transaksi harus lebih dari 0' }, { status: 400 });
    }

    if (!walletId) {
      return NextResponse.json({ error: 'Dompet wajib dipilih' }, { status: 400 });
    }

    // Call Atomic RPC
    const { data, error } = await supabase.rpc('record_transaction_atomic', {
      p_user_id: user.id,
      p_wallet_id: walletId,
      p_category_id: categoryId || null,
      p_type: type,
      p_amount: amount,
      p_date: date,
      p_notes: notes || null,
      p_source: source,
      p_receipt_image_url: receiptImageUrl || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Transactions API] POST error:', err);
    return NextResponse.json({ error: 'Gagal mencatat transaksi' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return NextResponse.json({ error: 'ID transaksi wajib disertakan' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('delete_transaction_atomic', {
      p_user_id: user.id,
      p_transaction_id: transactionId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Transactions API] DELETE error:', err);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
