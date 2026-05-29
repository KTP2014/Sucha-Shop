import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StaffDashboard from './StaffDashboard';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const userName = cookieStore.get('userName')?.value;
  const role = cookieStore.get('userRole')?.value;

  // Server-side Route Protection check
  if (!role || role !== 'STAFF') {
    redirect('/');
  }

  return (
    <StaffDashboard 
      userId={userId || ''} 
      userName={userName || ''} 
    />
  );
}
