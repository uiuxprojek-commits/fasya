import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
      return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planCode = 'pro', paymentType = 'midtrans' } = body;

    // 1. Get Subscription Plan (with auto-seeding if table is empty)
    const adminDb = createAdminClient();
    let targetPlan: any = null;

    const { data: plan } = await adminDb
      .from('subscription_plans')
      .select('*')
      .eq('code', planCode)
      .eq('is_active', true)
      .maybeSingle();

    if (plan) {
      targetPlan = plan;
    } else {
      // Auto-seed plans if missing in DB
      console.log('[Payment API] Plan not found in DB, auto-seeding subscription_plans...');
      const defaultPlans = [
        {
          id: 'a0000000-0000-0000-0000-000000000001',
          code: 'starter',
          name: 'Starter',
          price: 49000.0,
          billing_type: 'monthly',
          max_monthly_transactions: 50,
          max_wallets: 3,
          max_budgets: 5,
          has_receipt_ocr: false,
          has_ai_advisor: false,
          has_exports: false,
          is_active: true,
        },
        {
          id: 'a0000000-0000-0000-0000-000000000002',
          code: 'pro',
          name: 'Pro (Sekali Bayar)',
          price: 99000.0,
          billing_type: 'lifetime',
          max_monthly_transactions: -1,
          max_wallets: -1,
          max_budgets: -1,
          has_receipt_ocr: true,
          has_ai_advisor: true,
          has_exports: true,
          is_active: true,
        },
      ];

      await adminDb.from('subscription_plans').upsert(defaultPlans, { onConflict: 'code' });
      targetPlan = defaultPlans.find((p) => p.code === planCode) || defaultPlans[1];
    }

    const { data: profile } = await adminDb
      .from('profiles')
      .select('full_name, email, phone_number')
      .eq('id', user.id)
      .maybeSingle();

    const orderId = `TATADANA-${planCode.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Record initial payment record in DB using admin client (bypasses RLS)
    const { error: paymentInsertErr } = await adminDb.from('payments').insert({
      user_id: user.id,
      plan_id: targetPlan.id,
      order_id: orderId,
      amount: targetPlan.price,
      payment_type: paymentType,
      status: paymentType === 'manual_transfer' ? 'manual_verification' : 'pending',
    });

    if (paymentInsertErr) {
      console.error('[Payment API] Payment insert error:', paymentInsertErr);
      return NextResponse.json(
        { error: `Gagal membuat catatan pembayaran: ${paymentInsertErr.message}` },
        { status: 500 }
      );
    }

    if (paymentType === 'manual_transfer') {
      return NextResponse.json({
        success: true,
        orderId,
        paymentType: 'manual_transfer',
        amount: targetPlan.price,
        instructions: {
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830-192-888',
          accountHolder: 'PT TATADANA FINANSIAL TEKNOLOGI',
          nominal: targetPlan.price,
        },
      });
    }

    // 3. Call Midtrans Snap
    let snapResult;
    try {
      snapResult = await midtransService.createTransaction({
        orderId,
        grossAmount: Number(targetPlan.price),
        customerDetails: {
          firstName: profile?.full_name || 'Pengguna TataDana',
          email: profile?.email || user.email || 'user@tatadana.id',
          phone: profile?.phone_number || undefined,
        },
        itemDetails: [
          {
            id: targetPlan.id,
            price: Number(targetPlan.price),
            quantity: 1,
            name: `TataDana ${targetPlan.name}`,
          },
        ],
      });
    } catch (midtransErr: any) {
      console.error('[Payment API] Midtrans service error:', midtransErr);
      return NextResponse.json(
        {
          error: `Gagal menghubungkan ke Midtrans: ${midtransErr.message || 'Koneksi payment gateway error'}. Pastikan MIDTRANS_SERVER_KEY di Vercel valid.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      token: snapResult.token,
      redirectUrl: snapResult.redirect_url,
      isConfigured: midtransService.isConfigured(),
    });
  } catch (error: any) {
    console.error('[Payment API] Unexpected error creating transaction:', error);
    return NextResponse.json(
      { error: `Terjadi kesalahan internal: ${error.message || 'Gagal memproses tagihan'}` },
      { status: 500 }
    );
  }
}
