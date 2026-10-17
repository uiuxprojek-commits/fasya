import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { midtransService } from '@/lib/payments/midtrans';

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
    const { planCode = 'pro', paymentType = 'midtrans' } = body;

    // Get Subscription Plan
    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('code', planCode)
      .eq('is_active', true)
      .single();

    if (planErr || !plan) {
      return NextResponse.json({ error: 'Paket langganan tidak ditemukan' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone_number')
      .eq('id', user.id)
      .single();

    const orderId = `TATADANA-${planCode.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Record initial payment record in DB
    const { error: paymentInsertErr } = await supabase.from('payments').insert({
      user_id: user.id,
      plan_id: plan.id,
      order_id: orderId,
      amount: plan.price,
      payment_type: paymentType,
      status: paymentType === 'manual_transfer' ? 'manual_verification' : 'pending',
    });

    if (paymentInsertErr) {
      return NextResponse.json({ error: 'Gagal membuat catatan pembayaran' }, { status: 500 });
    }

    if (paymentType === 'manual_transfer') {
      return NextResponse.json({
        success: true,
        orderId,
        paymentType: 'manual_transfer',
        amount: plan.price,
        instructions: {
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830-192-888',
          accountHolder: 'PT TATADANA FINANSIAL TEKNOLOGI',
          nominal: plan.price,
        },
      });
    }

    // Call Midtrans Snap
    const snapResult = await midtransService.createTransaction({
      orderId,
      grossAmount: Number(plan.price),
      customerDetails: {
        firstName: profile?.full_name || 'Pengguna',
        email: profile?.email || user.email || 'user@tatadana.id',
        phone: profile?.phone_number || undefined,
      },
      itemDetails: [
        {
          id: plan.id,
          price: Number(plan.price),
          quantity: 1,
          name: `TataDana ${plan.name}`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      orderId,
      token: snapResult.token,
      redirectUrl: snapResult.redirect_url,
      isConfigured: midtransService.isConfigured(),
    });
  } catch (error) {
    console.error('[Payment API] Error creating transaction:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan pembayaran' }, { status: 500 });
  }
}
