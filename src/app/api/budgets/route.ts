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
    const now = new Date();
    const defaultMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthYear = searchParams.get('monthYear') || defaultMonthYear;

    // Fetch user budgets with category join
    const { data: budgets, error: budgetErr } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .order('monthly_amount', { ascending: false });

    if (budgetErr) {
      return NextResponse.json({ error: budgetErr.message }, { status: 500 });
    }

    // Determine start and end of target month
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

    // Fetch expenses in this month to calculate spent amount per category
    const { data: expenses, error: expErr } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lt('date', endDate);

    const spentMap: Record<string, number> = {};
    if (expenses) {
      for (const exp of expenses) {
        if (exp.category_id) {
          spentMap[exp.category_id] = (spentMap[exp.category_id] || 0) + Number(exp.amount);
        }
      }
    }

    const enrichedBudgets = (budgets || []).map((b) => ({
      ...b,
      spent_amount: spentMap[b.category_id] || 0,
    }));

    return NextResponse.json({
      monthYear,
      budgets: enrichedBudgets,
    });
  } catch (err) {
    console.error('[Budgets API] GET error:', err);
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
    const { categoryId, monthlyAmount, monthYear } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'Kategori anggaran wajib dipilih' }, { status: 400 });
    }

    const numAmount = parseFloat(monthlyAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Nominal anggaran harus lebih besar dari 0' }, { status: 400 });
    }

    const now = new Date();
    const targetMonthYear =
      monthYear || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check plan budget limits
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(max_budgets)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const maxBudgets = sub?.plan?.max_budgets ?? 5; // Default 5 for Starter
    if (maxBudgets > 0) {
      const { count } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('month_year', targetMonthYear);

      // If creating a new budget (not updating an existing category for this month)
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('month_year', targetMonthYear)
        .single();

      if (!existing && (count || 0) >= maxBudgets) {
        return NextResponse.json(
          {
            error: `Batas jumlah pos anggaran untuk paket Anda (${maxBudgets} pos anggaran) telah tercapai. Upgrade ke Pro untuk pos anggaran tanpa batas.`,
          },
          { status: 403 }
        );
      }
    }

    // Upsert budget
    const { data: savedBudget, error: upsertErr } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: user.id,
          category_id: categoryId,
          monthly_amount: numAmount,
          month_year: targetMonthYear,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category_id,month_year' }
      )
      .select('*, category:categories(*)')
      .single();

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, budget: savedBudget });
  } catch (err) {
    console.error('[Budgets API] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID anggaran wajib disertakan' }, { status: 400 });
    }

    const { error: delErr } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Budgets API] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
