import { getCurrentUserAction } from '@/app/actions/auth';
import { LandingPageView } from '@/components/landing/landing-page-view';

export const metadata = {
  title: 'Programa Piloto Beta (5 Vagas) | ServiceZap',
  description: 'Garanta 3 meses gratuitos no Plano Básico para prestadores de serviço.',
};

export default async function PilotoPage() {
  const user = await getCurrentUserAction();
  return <LandingPageView isLoggedIn={Boolean(user)} />;
}
