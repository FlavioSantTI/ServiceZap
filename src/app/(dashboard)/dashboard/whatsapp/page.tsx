import { Suspense } from 'react';
import { Metadata } from 'next';
import { getWhatsAppInstanceAction } from '@/app/actions/whatsapp';
import { fetchClientsAction } from '@/app/actions/clients';
import { WhatsAppChatInterface } from '@/components/whatsapp/whatsapp-chat-interface';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'WhatsApp & Mensagens | ServiceZap',
  description: 'Central de sincronização híbrida WhatsApp e Appwrite Realtime',
};

export const dynamic = 'force-dynamic';

export default async function WhatsAppDashboardPage() {
  const [instance, clients] = await Promise.all([
    getWhatsAppInstanceAction(),
    fetchClientsAction(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          WhatsApp & Mensageria Híbrida
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gerencie a conexão da sua conta via Pairing Code e converse com seus clientes em tempo real.
        </p>
      </div>

      <Suspense fallback={
        <div className="h-[600px] flex items-center justify-center border border-slate-800 rounded-2xl bg-slate-900/50">
          <Loader2 className="w-8 h-8 text-[#E8622C] animate-spin" />
        </div>
      }>
        <WhatsAppChatInterface
          initialInstance={instance}
          clients={clients}
        />
      </Suspense>
    </div>
  );
}
