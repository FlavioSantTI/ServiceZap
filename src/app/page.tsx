import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';

export default async function Home() {
  const user = await getCurrentUserAction();
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
