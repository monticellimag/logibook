import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ChangePasswordClient from './ChangePasswordClient';

export default async function ChangePasswordPage() {
  // Passiamo bypassRedirect per evitare loop infiniti se l'utente atterra qui
  const session = await getSession({ bypassRedirect: true });

  if (!session) {
    redirect('/login');
  }



  return <ChangePasswordClient role={session.role} mustChange={!!session.must_change_password} />;
}
