import { createClient } from '@/lib/supabase/server';
import { UserRoleType } from '@/types';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getUserRole(userId: string): Promise<UserRoleType> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'user';
  return data.role as UserRoleType;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const role = await getUserRole(user.id);

  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/dashboard?error=unauthorized_admin');
  }

  return { user, role };
}
