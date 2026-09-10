'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ServiceList } from '@/components/services/service-list';
import { ServiceDialog } from '@/components/services/service-dialog';
import { ServiceDocument } from '@/types/appwrite';
import {
  fetchServicesAction,
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from '@/app/actions/services';

export default function ServicesPage() {
  const [services, setServices] = useState<Partial<ServiceDocument>[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceDocument> | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchServicesAction();
      setServices(data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleNewService = () => {
    setEditingService(null);
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: Partial<ServiceDocument>) => {
    setEditingService(service);
    setServiceDialogOpen(true);
  };

  const handleSaveService = async (saved: Partial<ServiceDocument>) => {
    try {
      if (editingService?.$id || (saved.$id && !saved.$id.startsWith('srv_temp'))) {
        const idToUpdate = editingService?.$id || saved.$id!;
        const res = await updateServiceAction(idToUpdate, {
          name: saved.name || '',
          price: saved.price || 0,
          durationMinutes: saved.durationMinutes || 30,
          unit: saved.unit || 'un',
          category: saved.category || 'Geral',
          description: saved.description || '',
          active: saved.active !== undefined ? saved.active : true,
        });

        if (res.success) {
          await loadServices();
        } else {
          alert(`Erro ao atualizar serviço: ${res.error}`);
        }
      } else {
        const res = await createServiceAction({
          name: saved.name || '',
          price: saved.price || 0,
          durationMinutes: saved.durationMinutes || 30,
          unit: saved.unit || 'un',
          category: saved.category || 'Geral',
          description: saved.description,
          active: saved.active !== undefined ? saved.active : true,
        });

        if (res.success) {
          await loadServices();
        } else {
          alert(`Erro ao criar serviço: ${res.error}`);
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar serviço:', err);
      alert('Ocorreu um erro ao salvar o serviço.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const res = await deleteServiceAction(serviceId);
      if (res.success) {
        await loadServices();
      } else {
        alert(`Erro ao excluir serviço: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao excluir serviço:', err);
      alert('Ocorreu um erro ao excluir o serviço.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Catálogo de Serviços
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Cadastre, edite e gerencie seus procedimentos e serviços com valores padrão e duração para agendamentos e cobranças rápidas.
        </p>
      </div>

      {/* Service List Component */}
      <ServiceList
        services={services}
        onEditService={handleEditService}
        onDeleteService={handleDeleteService}
        onNewService={handleNewService}
      />

      {/* Modal Dialog */}
      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        serviceToEdit={editingService}
        onSave={handleSaveService}
      />
    </div>
  );
}
