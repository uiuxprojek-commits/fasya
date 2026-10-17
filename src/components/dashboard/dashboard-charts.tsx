'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils';

interface CategorySpend {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface MonthlyComparison {
  month: string;
  pemasukan: number;
  pengeluaran: number;
}

interface DailyTrend {
  date: string;
  pengeluaran: number;
}

interface DashboardChartsProps {
  categoryData: CategorySpend[];
  monthlyData: MonthlyComparison[];
  dailyData: DailyTrend[];
}

const DEFAULT_COLORS = ['#F97316', '#3B82F6', '#EF4444', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'];

export function DashboardCharts({
  categoryData = [],
  monthlyData = [],
  dailyData = [],
}: DashboardChartsProps) {
  const hasData = categoryData.length > 0 || monthlyData.length > 0 || dailyData.length > 0;

  if (!hasData) {
    return (
      <Card className="p-8 text-center bg-white border-slate-200">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Grafik & Analisis Arus Kas</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Belum ada transaksi yang cukup untuk divisualisasikan. Catat transaksi pengeluaran dan pemasukan pertama Anda untuk melihat perbandingan tren arus kas secara real-time.
          </p>
        </div>
      </Card>
    );
  }

  const safeCategoryData = categoryData;
  const safeMonthlyData = monthlyData;
  const safeDailyData = dailyData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Bar Chart: Pemasukan vs Pengeluaran 6 Bulan */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Arus Kas 6 Bulan Terakhir</CardTitle>
          <CardDescription>
            Perbandingan total pemasukan dan pengeluaran per bulan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                />
                <RechartsTooltip
                  formatter={(val: number | string | readonly (number | string)[] | undefined) => [
                    formatRupiah(typeof val === 'number' ? val : Number(val)),
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-xs font-semibold capitalize text-slate-700">
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pie Chart: Pengeluaran per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle>Proporsi Kategori Pengeluaran</CardTitle>
          <CardDescription>
            Distribusi alokasi uang belanja bulan ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {safeCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: number | string | readonly (number | string)[] | undefined) => [
                    formatRupiah(typeof val === 'number' ? val : Number(val)),
                    'Nominal',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Line Chart: Tren Pengeluaran Harian */}
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran Harian (7 Hari)</CardTitle>
          <CardDescription>
            Pantau fluktuasi pengeluaran setiap hari dalam sepekan terakhir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeDailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: number | string | readonly (number | string)[] | undefined) => [
                    formatRupiah(typeof val === 'number' ? val : Number(val)),
                    'Pengeluaran',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pengeluaran"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
