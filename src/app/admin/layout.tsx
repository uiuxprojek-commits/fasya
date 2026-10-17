import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/sidebar';
import { getUserRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If running in development without live Supabase session, let developer inspect admin UI safely
    // In production, strictly redirect to /login
    if (process.env.NODE_ENV === 'production') {
      redirect('/login?redirectTo=/admin');
    }
  } else {
    const role = await getUserRole(user.id);
    if (role !== 'admin' && role !== 'superadmin' && process.env.NODE_ENV === 'production') {
      redirect('/dashboard?error=unauthorized_admin');
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
