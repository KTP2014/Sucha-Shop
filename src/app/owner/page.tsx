import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OwnerDashboard from './OwnerDashboard';

export const dynamic = 'force-dynamic';

export default async function OwnerPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('userRole')?.value;

  // Protect route - server-side redirect if not OWNER
  if (role !== 'OWNER') {
    redirect('/');
  }

  return <OwnerDashboard />;
}
