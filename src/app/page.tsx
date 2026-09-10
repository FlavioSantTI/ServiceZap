import { getCurrentUserAction } from '@/app/actions/auth';
import { LandingPageView } from '@/components/landing/landing-page-view';

export default async function Home() {
  const user = await getCurrentUserAction();
  return <LandingPageView isLoggedIn={Boolean(user)} />;
}
