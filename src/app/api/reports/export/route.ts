import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePdfReport, generateXlsxReport } from '@/lib/reports/generator';

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
    const { format = 'pdf', startDate, endDate } = body;

    // Check Subscription Entitlement: Only Pro can export
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Check if user is Pro
    const isPro = sub?.plan?.code === 'pro';
    if (!isPro) {
      return NextResponse.json(
        {
          error:
            'Fitur Export PDF dan XLSX hanya tersedia untuk pengguna paket Pro (Rp99.000 sekali bayar). Silakan lakukan upgrade.',
        },
        { status: 403 }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Query user transactions in the specified date range
    let query = supabase
      .from('transactions')
      .select('*, category:categories(name, icon), wallet:wallets(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte('date', `${endDate}T23:59:59.999Z`);
    }

    const { data: transactions, error: txErr } = await query;

    if (txErr) {
      return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    (transactions || []).forEach((t) => {
      if (t.type === 'income') totalIncome += Number(t.amount);
      if (t.type === 'expense') totalExpense += Number(t.amount);
    });

    const reportData = {
      userName: profile?.full_name || 'Pengguna TataDana',
      userEmail: profile?.email || user.email || '',
      startDate: startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      transactions: transactions || [],
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
    };

    if (format === 'xlsx') {
      const xlsxBuffer = generateXlsxReport(reportData);
      return new NextResponse(new Uint8Array(xlsxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="TataDana-Laporan-${reportData.startDate}-sd-${reportData.endDate}.xlsx"`,
        },
      });
    } else {
      const pdfBuffer = generatePdfReport(reportData);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="TataDana-Laporan-${reportData.startDate}-sd-${reportData.endDate}.pdf"`,
        },
      });
    }
  } catch (error) {
    console.error('[Export API] Error generating report:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat membuat laporan' }, { status: 500 });
  }
}
