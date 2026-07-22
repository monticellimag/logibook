import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import MonitorClient from './MonitorClient';

export default async function MonitorPage({ params }: { params: Promise<{ depositId: string }> }) {
  const user = await getSession();

  // Route protected for admin and gate
  if (!user || (user.role !== 'admin' && user.role !== 'gate')) {
    redirect('/login');
  }

  const { depositId } = await params;

  // Scelta 2: If user is assigned to a specific depot (gate or hub) and tries to access another depot's monitor, redirect to their own deposit monitor.
  if (user.depotId && user.depotId !== depositId) {
    redirect(`/monitor/${user.depotId}`);
  }

  return <MonitorClient depositId={depositId} />;
}
