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
  const [workOrders, setWorkOrders] = useState<Partial<WorkOrderDocument>[]>([]);
  const [clients, setClients] = useState<Partial<ClientDocument>[]>([]);
  const [services, setServices] = useState<Partial<ServiceDocument>[]>([]);

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

      setWorkOrders(woData || []);
      setClients(cliData || []);
      setServices(srvData || []);
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
  const openQuotes = workOrders.filter(
    (wo) => wo.type === 'quote' && wo.status !== 'rejected' && wo.status !== 'billed'
  );
  const totalQuotesValue = openQuotes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const inProgressOS = workOrders.filter(
    (wo) => wo.type === 'work_order' && (wo.status === 'approved' || wo.status === 'in_execution')
  );
  const activeOSCount = inProgressOS.length;

  const readyOrBilledOS = workOrders.filter(
    (wo) => wo.type === 'work_order' && (wo.status === 'completed' || wo.status === 'billed')
  );
  const readyToBillCount = readyOrBilledOS.length;
  const billedCount = workOrders.filter((wo) => wo.status === 'billed').length;
  const completedCount = workOrders.filter((wo) => wo.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Title Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Ordens de Serviço &amp; Orçamentos
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie propostas comerciais, acompanhe a execução dos serviços e fature direto via PIX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-xl border-border bg-card text-foreground hover:bg-muted"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-warm-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Orçamento / O.S.</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                Orçamentos em Aberto
              </p>
              <p className="text-xl font-extrabold text-foreground mt-1">
                R$ {totalQuotesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {openQuotes.length} {openQuotes.length === 1 ? 'proposta aguardando' : 'propostas aguardando'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                O.S. em Execução
              </p>
              <p className="text-xl font-extrabold text-foreground mt-1">
                {activeOSCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {inProgressOS.filter((o) => o.status === 'in_execution').length} em execução • {inProgressOS.filter((o) => o.status === 'approved').length} aprovadas
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Prontas p/ Cobrança PIX
              </p>
              <p className="text-xl font-extrabold text-primary mt-1">
                {readyToBillCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {completedCount} concluídas • {billedCount} faturadas PIX
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

