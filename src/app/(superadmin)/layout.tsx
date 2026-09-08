import React from 'react';
import { SuperAdminSidebar } from '@/components/super-admin/super-admin-sidebar';
import { Header } from '@/components/layout/header';

export const metadata = {
  title: 'Super Admin Master | ServiceZap Multi-Tenant',
  description: 'Painel de controle master de empresas, planos e métricas do SaaS ServiceZap.',
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAF6F2]">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
