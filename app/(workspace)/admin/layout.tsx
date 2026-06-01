import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/db/profiles';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/feed');

  return children;
}
