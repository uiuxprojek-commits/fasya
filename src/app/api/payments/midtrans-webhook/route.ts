import { NextRequest, NextResponse } from 'next/server';
import { midtransService } from '@/lib/payments/midtrans';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
    } = payload;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id wajib disertakan' }, { status: 400 });
    }

    // Verify cryptographic signature if Midtrans is configured
    if (midtransService.isConfigured() && signature_key) {
      const isValid = midtransService.verifySignature(
        order_id,
        status_code,
        gross_amount,
        signature_key
      );
      if (!isValid) {
        console.warn('[Midtrans Webhook] Invalid signature key for order:', order_id);
        return NextResponse.json({ error: 'Invalid signature key' }, { status: 403 });
      }
    }

    const supabase = createAdminClient();

    // Find payment record
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*, plan:subscription_plans(*)')
      .eq('order_id', order_id)
      .single();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 });
    }

    // Determine final status
    let paymentStatus: 'pending' | 'settlement' | 'cancel' | 'expire' | 'failure' = 'pending';
    if (transaction_status === 'capture') {
      paymentStatus = fraud_status === 'accept' ? 'settlement' : 'pending';
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'settlement';
    } else if (['cancel', 'deny'].includes(transaction_status)) {
      paymentStatus = 'cancel';
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expire';
    } else if (transaction_status === 'failure') {
      paymentStatus = 'failure';
    }

    // Update payment record in DB
    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        midtrans_transaction_id: transaction_id,
        midtrans_response: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // If settlement, activate subscription entitlement!
    if (paymentStatus === 'settlement') {
      const isLifetime = payment.plan?.billing_type === 'lifetime';
      const endDate = isLifetime ? null : new Date(Date.now() + 30 * 86400000).toISOString();

      await supabase.from('user_subscriptions').upsert(
        {
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate,
          payment_method: 'midtrans',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      // Audit Log
      await supabase.from('audit_logs').insert({
        actor_id: payment.user_id,
        action: 'SUBSCRIPTION_ACTIVATED',
        resource_type: 'user_subscriptions',
        resource_id: payment.plan_id,
        details: { order_id, amount: payment.amount, provider: 'midtrans' },
      });
    }

    return NextResponse.json({ status: 'success', paymentStatus });
  } catch (error) {
    console.error('[Midtrans Webhook] Internal processing error:', error);
    return NextResponse.json({ error: 'Internal handler error' }, { status: 500 });
  }
}
