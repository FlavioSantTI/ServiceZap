'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClientList } from '@/components/clients/client-list';
import { ClientDialog } from '@/components/clients/client-dialog';
import { ClientDetailsModal } from '@/components/clients/client-details-modal';
import { CreateInvoiceDialog } from '@/components/invoices/create-invoice-dialog';
import { ClientDocument } from '@/types/appwrite';
import { fetchClientsAction, createClientAction, updateClientAction, deleteClientAction } from '@/app/actions/clients';

export default function ClientsPage() {
  const [clients, setClients] = useState<Partial<ClientDocument>[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<ClientDocument> | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Partial<ClientDocument> | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [quickChargeOpen, setQuickChargeOpen] = useState(false);
  const [quickChargeClient, setQuickChargeClient] = useState<Partial<ClientDocument> | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClientsAction();
      setClients(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleNewClient = () => {
    setEditingClient(null);
    setClientDialogOpen(true);
  };

  const handleEditClient = (client: Partial<ClientDocument>) => {
    setEditingClient(client);
    setClientDialogOpen(true);
  };

  const handleViewClientDetails = (client: Partial<ClientDocument>) => {
    setSelectedClientDetails(client);
    setDetailsModalOpen(true);
  };

  const handleQuickCharge = (client: Partial<ClientDocument>) => {
    setQuickChargeClient(client);
    setQuickChargeOpen(true);
  };

  const handleSaveClient = async (saved: Partial<ClientDocument>) => {
    try {
      if (editingClient?.$id) {
        // Atualizar cliente existente (inclusive Inativar / Alterar Status)
        const res = await updateClientAction(editingClient.$id, {
          name: saved.name,
          document: saved.document,
          email: saved.email,
          phone: saved.phone,
          status: (saved.status as any) || 'active',
          address: saved.address,
          addressNumber: saved.addressNumber,
          neighborhood: saved.neighborhood,
          city: saved.city,
          state: saved.state,
          zipCode: saved.zipCode,
          notes: saved.notes,
        });

        if (res.success) {
          await loadClients();
        } else {
          alert(`Erro ao atualizar cliente: ${res.error}`);
        }
      } else {
        // Criar novo cliente
        const res = await createClientAction({
          name: saved.name || '',
          document: saved.document || '',
          email: saved.email || '',
          phone: saved.phone || '',
          status: (saved.status as any) || 'active',
          address: saved.address,
          addressNumber: saved.addressNumber,
          neighborhood: saved.neighborhood,
          city: saved.city,
          state: saved.state,
          zipCode: saved.zipCode,
          notes: saved.notes,
        });

        if (res.success) {
          await loadClients();
        } else {
          alert(`Erro ao salvar cliente no Appwrite: ${res.error}`);
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      alert('Ocorreu um erro ao salvar o cliente no Appwrite.');
    }
  };

  const handleDeleteClient = async (client: Partial<ClientDocument>) => {
    if (!client.$id) return;
    const confirmed = window.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`);
    if (!confirmed) return;

    try {
      const res = await deleteClientAction(client.$id);
      if (res.success) {
        await loadClients();
      } else {
        alert(`Erro ao excluir cliente: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      alert('Ocorreu um erro ao excluir o cliente no Appwrite.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Gestão de Clientes &amp; CRM
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhe seus clientes, controle o faturamento acumulado (LTV) e emita cobranças diretas.
        </p>
      </div>

      {/* Main Client List Component */}
      <ClientList
        clients={clients}
        onEditClient={handleEditClient}
        onViewClientDetails={handleViewClientDetails}
        onNewClient={handleNewClient}
        onQuickCharge={handleQuickCharge}
        onDeleteClient={handleDeleteClient}
      />

      {/* Modal Cadastro/Edição */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        clientToEdit={editingClient}
        onSave={handleSaveClient}
      />

      {/* Modal Visão 360° CRM */}
      <ClientDetailsModal
        client={selectedClientDetails}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onNewChargeForClient={handleQuickCharge}
      />

      {/* Modal Emissão de Cobrança Direta */}
      <CreateInvoiceDialog
        open={quickChargeOpen}
        onOpenChange={setQuickChargeOpen}
      />
    </div>
  );
}
