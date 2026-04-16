import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import GateDashboard from '@/components/GateDashboard';   

export default async function GatePage() {
  const user = await getSession();

  if (!user || user.role === 'user') {
    redirect('/');
  }

  return <GateDashboard adminUser={user} />;
}
