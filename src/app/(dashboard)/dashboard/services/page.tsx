'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ServiceList } from '@/components/services/service-list';
import { ServiceDialog } from '@/components/services/service-dialog';
import { ServiceDocument } from '@/types/appwrite';
import { fetchServicesAction, createServiceAction } from '@/app/actions/services';

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
      const res = await createServiceAction({
        name: saved.name || '',
        price: saved.price || 0,
        durationMinutes: saved.durationMinutes || 30,
        category: saved.category || 'Geral',
        description: saved.description,
      });

      if (res.success) {
        await loadServices();
      } else {
        alert(`Erro ao salvar serviço no Appwrite: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao salvar serviço:', err);
      alert('Ocorreu um erro ao salvar o serviço no Appwrite.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Serviços
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cadastre e gerencie seus procedimentos e serviços com valores padrão para cobranças rápidas.
        </p>
      </div>

      {/* Service List Component */}
      <ServiceList
        services={services}
        onEditService={handleEditService}
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
