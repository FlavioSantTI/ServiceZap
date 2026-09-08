'use client';

import React from 'react';
import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Perfil Empresarial & Configurações
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gerencie os dados cadastrais do prestador (Pessoa Física ou Jurídica), chave PIX padrão e parâmetros fiscais.
        </p>
      </div>

      {/* Profile Form */}
      <ProfileForm />
    </div>
  );
}
