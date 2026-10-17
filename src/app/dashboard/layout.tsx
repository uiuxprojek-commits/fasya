import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let userRole: 'user' | 'admin' | 'superadmin' = 'user';
  let planCode: 'starter' | 'pro' = 'starter';

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    userRole = await getUserRole(user.id);

    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(code)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subData?.plan?.code === 'pro') {
      planCode = 'pro';
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FBFBFD]">
      <DashboardSidebar
        userRole={userRole}
        planCode={planCode}
        userName={profile?.full_name || user?.email?.split('@')[0] || 'Pengguna TataDana'}
        userEmail={profile?.email || user?.email || 'user@tatadana.id'}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
