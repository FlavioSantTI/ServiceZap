'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { CreateInvoiceDialog } from '@/components/invoices/create-invoice-dialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FAF6F2] dark:bg-[#1C1B1A] font-sans antialiased text-[#2B2B2B] dark:text-[#FAF6F2]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onNewInvoiceClick={() => setCreateInvoiceOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 space-y-6 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modal Global de Nova Cobrança */}
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
      />
    </div>
  );
}
