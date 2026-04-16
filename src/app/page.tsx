import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import BookingDashboard from '@/components/BookingDashboard';

export default async function Page() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'admin') {
    redirect('/admin');
  }
  
  if (user.role === 'gate') {
    redirect('/admin/gate');
  }

  return <BookingDashboard user={user} />;
}
