import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StaffCrud from './StaffCrud';

export const dynamic = 'force-dynamic';

export default async function OwnerStaffPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('userRole')?.value;

  // Protect route - server-side redirect if not OWNER
  if (role !== 'OWNER') {
    redirect('/');
  }

  return <StaffCrud />;
}
