'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CreateInvoiceDialog } from '@/components/invoices/create-invoice-dialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onNewInvoiceClick={() => setCreateInvoiceOpen(true)} />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">{children}</main>
      </div>

      {/* Modal Global de Nova Cobrança */}
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
      />
    </div>
  );
}
