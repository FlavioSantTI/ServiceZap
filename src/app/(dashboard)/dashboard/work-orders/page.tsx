'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ClipboardList, FileText, Clock, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { WorkOrdersTable } from '@/components/work-orders/work-orders-table';
import { CreateWorkOrderDialog } from '@/components/work-orders/create-work-order-dialog';
import { WorkOrderDetailsModal } from '@/components/work-orders/work-order-details-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WorkOrderDocument, ClientDocument, ServiceDocument } from '@/types/appwrite';
import { fetchWorkOrdersAction } from '@/app/actions/work-orders';
import { fetchClientsAction } from '@/app/actions/clients';
import { fetchServicesAction } from '@/app/actions/services';
import { mockWorkOrders, mockClients, mockServices } from '@/lib/mock-data';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<Partial<WorkOrderDocument>[]>(mockWorkOrders);
  const [clients, setClients] = useState<Partial<ClientDocument>[]>(mockClients);
  const [services, setServices] = useState<Partial<ServiceDocument>[]>(mockServices);

  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<Partial<WorkOrderDocument> | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<Partial<WorkOrderDocument> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [woData, cliData, srvData] = await Promise.all([
        fetchWorkOrdersAction(),
        fetchClientsAction(),
        fetchServicesAction(),
      ]);

      if (woData && woData.length > 0) setWorkOrders(woData);
      if (cliData && cliData.length > 0) setClients(cliData);
      if (srvData && srvData.length > 0) setServices(srvData);
    } catch (err) {
      console.error('Erro ao carregar dados de O.S.:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingWorkOrder(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (wo: Partial<WorkOrderDocument>) => {
    setEditingWorkOrder(wo);
    setIsCreateOpen(true);
  };

  // Métricas Financeiras / Quantidades
  const totalQuotesValue = workOrders
    .filter((wo) => wo.type === 'quote' && wo.status !== 'rejected')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const activeOSCount = workOrders.filter(
    (wo) => wo.type === 'work_order' && (wo.status === 'approved' || wo.status === 'in_execution')
  ).length;

  const readyToBillCount = workOrders.filter(
    (wo) => wo.type === 'work_order' && wo.status === 'completed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Title Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Ordens de Serviço & Orçamentos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerencie propostas comerciais, acompanhe a execução dos serviços e fature direto via PIX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-xl"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 gap-2 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-xl shadow-warm-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Orçamento / O.S.</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Orçamentos em Aberto
              </p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                R$ {totalQuotesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                O.S. em Execução
              </p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {activeOSCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#E8622C]">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#E8622C] uppercase tracking-wider">
                Prontas p/ Cobrança PIX
              </p>
              <p className="text-xl font-extrabold text-[#E8622C] mt-1">
                {readyToBillCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#E8622C]">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Component */}
      <WorkOrdersTable
        workOrders={workOrders}
        onSelectWorkOrder={(wo) => setSelectedWorkOrder(wo)}
        onEditWorkOrder={handleOpenEdit}
        onRefresh={loadData}
      />

      {/* Modais */}
      <CreateWorkOrderDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingWorkOrder(null);
        }}
        clients={clients}
        services={services}
        workOrderToEdit={editingWorkOrder}
        onWorkOrderCreated={loadData}
      />

      <WorkOrderDetailsModal
        open={!!selectedWorkOrder}
        onOpenChange={(open) => !open && setSelectedWorkOrder(null)}
        workOrder={selectedWorkOrder}
        onEditWorkOrder={handleOpenEdit}
        onUpdated={() => {
          loadData();
          setSelectedWorkOrder(null);
        }}
      />
    </div>
  );
}

