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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If profile row doesn't exist yet, return basic fallback from user object
    const finalProfile = profile || {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna TataDana',
      avatar_url: user.user_metadata?.avatar_url || null,
      phone_number: user.user_metadata?.phone_number || null,
      currency: 'IDR',
      monthly_income_estimate: 0,
      financial_goal: null,
      onboarding_completed: false,
    };

    return NextResponse.json({ profile: finalProfile });
  } catch (err) {
    console.error('[Profile API] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { fullName, currency, monthlyIncomeEstimate, financialGoal, phoneNumber } = body;

    // Strict whitelist of permitted columns
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      updatePayload.full_name = fullName.trim();
    }
    if (typeof currency === 'string') {
      updatePayload.currency = currency.trim();
    }
    if (typeof monthlyIncomeEstimate === 'number' && !isNaN(monthlyIncomeEstimate)) {
      updatePayload.monthly_income_estimate = monthlyIncomeEstimate;
    }
    if (financialGoal !== undefined) {
      updatePayload.financial_goal = financialGoal;
    }
    if (phoneNumber !== undefined) {
      updatePayload.phone_number = phoneNumber;
    }

    const { data: updatedProfile, error: updateErr } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        ...updatePayload,
      })
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err) {
    console.error('[Profile API] PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
