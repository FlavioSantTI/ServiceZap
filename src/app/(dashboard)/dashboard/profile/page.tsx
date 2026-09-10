'use client';

import React from 'react';
import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Perfil Empresarial &amp; Configurações
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gerencie os dados cadastrais do prestador (Pessoa Física ou Jurídica), chave PIX padrão e parâmetros fiscais.
        </p>
      </div>

      {/* Profile Form */}
      <ProfileForm />
    </div>
  );
}
