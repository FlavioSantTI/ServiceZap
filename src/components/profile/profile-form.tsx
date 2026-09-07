'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, FileText, Save, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { mockTenant } from '@/lib/mock-data';
import { fetchTenantProfileAction, updateTenantProfileAction } from '@/app/actions/tenant';

export function ProfileForm() {
  const [name, setName] = useState(mockTenant.name || '');
  const [companyName, setCompanyName] = useState(mockTenant.companyName || '');
  const [document, setDocument] = useState(mockTenant.document || '');
  const [email, setEmail] = useState(mockTenant.email || '');
  const [phone, setPhone] = useState(mockTenant.phone || '');
  const [pixKey, setPixKey] = useState(mockTenant.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState(mockTenant.pixKeyType || 'cnpj');
  const [taxRegime, setTaxRegime] = useState(mockTenant.taxRegime || 'simples_nacional');
  const [municipalRegistration, setMunicipalRegistration] = useState(mockTenant.municipalRegistration || '');
  const [issRate, setIssRate] = useState(mockTenant.issRate ? mockTenant.issRate.toString() : '2.0');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantData() {
      try {
        const tenant = await fetchTenantProfileAction();
        if (tenant) {
          if (tenant.name) setName(tenant.name);
          if (tenant.companyName) setCompanyName(tenant.companyName);
          if (tenant.document) setDocument(tenant.document);
          if (tenant.email) setEmail(tenant.email);
          if (tenant.phone) setPhone(tenant.phone);
          if (tenant.pixKey) setPixKey(tenant.pixKey);
          if (tenant.pixKeyType) setPixKeyType(tenant.pixKeyType as any);
          if (tenant.taxRegime) setTaxRegime(tenant.taxRegime as any);
          if (tenant.municipalRegistration) setMunicipalRegistration(tenant.municipalRegistration);
          if (tenant.issRate !== undefined) setIssRate(tenant.issRate.toString());
        }
      } catch (err) {
        console.error('Erro ao carregar dados do tenant:', err);
      }
    }
    loadTenantData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const res = await updateTenantProfileAction({
        name,
        companyName,
        document,
        email,
        phone,
        pixKey,
        pixKeyType: pixKeyType as any,
        taxRegime: taxRegime as any,
        municipalRegistration,
        issRate: parseFloat(issRate) || 0,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMsg(res.error || 'Erro ao salvar alterações no Appwrite.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="general" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-xs">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <span>Dados Gerais</span>
          </TabsTrigger>
          <TabsTrigger value="pix" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-xs">
            <CreditCard className="h-4 w-4 text-blue-500" />
            <span>Chave PIX & Asaas</span>
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-xs">
            <FileText className="h-4 w-4 text-purple-500" />
            <span>Nota Fiscal (Focus NFe)</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dados Gerais */}
        <TabsContent value="general" className="mt-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold">Perfil da Empresa / Tenant</CardTitle>
              <CardDescription className="text-xs">
                Informações cadastrais exibidas aos seus clientes e utilizadas nas cobranças.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nome Fantasia / Exibição</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Razão Social</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">CPF / CNPJ</Label>
                  <Input
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">E-mail Comercial</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Telefone / WhatsApp</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Chave PIX & Asaas */}
        <TabsContent value="pix" className="mt-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold">Configuração da Chave PIX</CardTitle>
              <CardDescription className="text-xs">
                Chave PIX padrão utilizada para o recebimento instantâneo das cobranças dos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tipo da Chave PIX</Label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="cnpj">CNPJ</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chave PIX Padrão</Label>
                  <Input
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Cole sua chave PIX aqui"
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span>Conta Asaas conectada e ativa. As cobranças gerarão QR Code com conciliação automática.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Nota Fiscal Focus NFe */}
        <TabsContent value="fiscal" className="mt-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold">Emissão de Nota Fiscal de Serviço (NFS-e)</CardTitle>
              <CardDescription className="text-xs">
                Dados fiscais para integração automática com a API Focus NFe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Regime Tributário</Label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="simples_nacional">Simples Nacional</option>
                    <option value="mei">Microempreendedor Individual (MEI)</option>
                    <option value="lucro_presumido">Lucro Presumido</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Inscrição Municipal</Label>
                  <Input
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    placeholder="00000000"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Alíquota ISS (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={issRate}
                    onChange={(e) => setIssRate(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Perfil atualizado com sucesso no Appwrite!</span>
          </div>
        ) : errorMsg ? (
          <div className="text-xs text-red-500 font-bold">
            ⚠️ {errorMsg}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Alterações salvas diretamente no Appwrite.</span>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
        </Button>
      </div>
    </form>
  );
}
