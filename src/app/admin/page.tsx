import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';   

export default async function AdminPage() {
  const user = await getSession();

  if (!user || user.role === 'user') {
    redirect('/');
  }

  if (user.role === 'gate') {
    redirect('/admin/gate');
  }

  return <AdminDashboard adminUser={user} />;
}
