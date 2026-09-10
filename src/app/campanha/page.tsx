import { getCurrentUserAction } from '@/app/actions/auth';
import { LandingPageView } from '@/components/landing/landing-page-view';

export const metadata = {
  title: 'Programa Piloto Beta - 3 Meses Grátis | ServiceZap',
  description: 'Pare de perder orçamentos no WhatsApp enquanto atende clientes. Garanta 3 meses de acesso 100% gratuito ao ServiceZap no Programa Piloto.',
};

export default async function CampanhaPage() {
  const user = await getCurrentUserAction();
  return <LandingPageView isLoggedIn={Boolean(user)} />;
}
