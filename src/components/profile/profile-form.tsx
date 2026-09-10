'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  CreditCard,
  FileText,
  Save,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { mockTenant } from '@/lib/mock-data';
import { fetchTenantProfileAction, updateTenantProfileAction } from '@/app/actions/tenant';
import { PersonType } from '@/types/appwrite';

export function ProfileForm() {
  const [personType, setPersonType] = useState<PersonType>('pj');
  const [name, setName] = useState(mockTenant.name || '');
  const [companyName, setCompanyName] = useState(mockTenant.companyName || '');
  const [profession, setProfession] = useState(mockTenant.profession || '');
  const [document, setDocument] = useState(mockTenant.document || '');
  const [email, setEmail] = useState(mockTenant.email || '');
  const [phone, setPhone] = useState(mockTenant.phone || '');
  const [pixKey, setPixKey] = useState(mockTenant.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState(mockTenant.pixKeyType || 'cnpj');
  const [taxRegime, setTaxRegime] = useState(mockTenant.taxRegime || 'simples_nacional');
  const [municipalRegistration, setMunicipalRegistration] = useState(
    mockTenant.municipalRegistration || ''
  );
  const [issRate, setIssRate] = useState(
    mockTenant.issRate ? mockTenant.issRate.toString() : '2.0'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Máscaras de formatação
  const formatCpfCnpj = (value: string, type: PersonType) => {
    const numbers = value.replace(/\D/g, '');
    if (type === 'pf') {
      // CPF: 000.000.000-00
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0001-00
      return numbers
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  useEffect(() => {
    async function loadTenantData() {
      try {
        const tenant = await fetchTenantProfileAction();
        if (tenant) {
          if (tenant.personType) {
            setPersonType(tenant.personType);
          } else if (tenant.document && tenant.document.replace(/\D/g, '').length === 11) {
            setPersonType('pf');
          } else {
            setPersonType('pj');
          }

          if (tenant.name) setName(tenant.name);
          if (tenant.companyName) setCompanyName(tenant.companyName);
          if (tenant.profession) setProfession(tenant.profession);
          if (tenant.document) setDocument(tenant.document);
          if (tenant.email) setEmail(tenant.email);
          if (tenant.phone) setPhone(tenant.phone);
          if (tenant.pixKey) setPixKey(tenant.pixKey);
          if (tenant.pixKeyType) setPixKeyType(tenant.pixKeyType as any);
          if (tenant.taxRegime) setTaxRegime(tenant.taxRegime as any);
          if (tenant.municipalRegistration)
            setMunicipalRegistration(tenant.municipalRegistration);
          if (tenant.issRate !== undefined) setIssRate(tenant.issRate.toString());
        }
      } catch (err) {
        console.error('Erro ao carregar dados do tenant:', err);
      }
    }
    loadTenantData();
  }, []);

  const handlePersonTypeChange = (newType: PersonType) => {
    setPersonType(newType);
    if (newType === 'pf') {
      if (pixKeyType === 'cnpj') setPixKeyType('cpf');
      if (taxRegime === 'lucro_presumido') setTaxRegime('autonomo_pf');
    } else {
      if (pixKeyType === 'cpf') setPixKeyType('cnpj');
      if (taxRegime === 'autonomo_pf') setTaxRegime('simples_nacional');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const res = await updateTenantProfileAction({
        personType,
        name,
        companyName: personType === 'pj' ? companyName : undefined,
        profession: personType === 'pf' ? profession : undefined,
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

  const isPF = personType === 'pf';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <TabsTrigger
            value="general"
            className="gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-xs"
          >
            {isPF ? (
              <User className="h-4 w-4 text-[#E8622C]" />
            ) : (
              <Building2 className="h-4 w-4 text-[#E8622C]" />
            )}
            <span>Dados do Prestador</span>
          </TabsTrigger>
          <TabsTrigger
            value="pix"
            className="gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-xs"
          >
            <CreditCard className="h-4 w-4 text-[#E8622C]" />
            <span>Chave PIX & Asaas</span>
          </TabsTrigger>
          <TabsTrigger
            value="fiscal"
            className="gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-xs"
          >
            <FileText className="h-4 w-4 text-[#E8622C]" />
            <span>Regime Fiscal & NF-e</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dados Gerais */}
        <TabsContent value="general" className="mt-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>Perfil Comercial do Prestador</span>
                <span className="text-xs font-normal text-slate-400">
                  (Exibido nos Orçamentos, O.S. e Recibos)
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Defina se você atua como Profissional Autônomo (Pessoa Física) ou Empresa (Pessoa Jurídica / MEI).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Seletor de Tipo de Prestador: PF vs PJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-muted/60 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => handlePersonTypeChange('pf')}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isPF
                      ? 'bg-primary text-primary-foreground shadow-warm-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Pessoa Física (Autônomo / CPF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePersonTypeChange('pj')}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isPF
                      ? 'bg-primary text-primary-foreground shadow-warm-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Pessoa Jurídica (Empresa / MEI / CNPJ)</span>
                </button>
              </div>

              {/* Campos para Pessoa Física (Autônomo) */}
              {isPF ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome Completo do Profissional *</Label>
                      <Input
                        required
                        placeholder="Ex: Flavio Dias Santiago"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Profissão / Ramo de Atuação *</Label>
                      <Input
                        placeholder="Ex: Consultor de TI & Inteligência Artificial, Eletricista..."
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">CPF *</Label>
                      <Input
                        required
                        placeholder="000.000.000-00"
                        value={document}
                        onChange={(e) => setDocument(formatCpfCnpj(e.target.value, 'pf'))}
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">E-mail de Contato *</Label>
                      <Input
                        required
                        type="email"
                        placeholder="seuemail@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Telefone / WhatsApp *</Label>
                      <Input
                        required
                        placeholder="(63) 98491-3860"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Campos para Pessoa Jurídica (Empresa / MEI) */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome Fantasia / Exibição *</Label>
                      <Input
                        required
                        placeholder="Ex: Flavio Dias Santiago Consultoria"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Razão Social</Label>
                      <Input
                        placeholder="Ex: Flavio Dias Santiago Consultoria LTDA"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">CNPJ *</Label>
                      <Input
                        required
                        placeholder="00.000.000/0001-00"
                        value={document}
                        onChange={(e) => setDocument(formatCpfCnpj(e.target.value, 'pj'))}
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">E-mail Comercial *</Label>
                      <Input
                        required
                        type="email"
                        placeholder="contato@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Telefone / WhatsApp *</Label>
                      <Input
                        required
                        placeholder="(63) 98491-3860"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Chave PIX & Asaas */}
        <TabsContent value="pix" className="mt-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold">Configuração da Chave PIX</CardTitle>
              <CardDescription className="text-xs">
                Chave PIX padrão utilizada para o recebimento instantâneo das cobranças dos seus clientes.
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
                    {isPF ? (
                      <>
                        <option value="cpf">CPF</option>
                        <option value="phone">Telefone Celular</option>
                        <option value="email">E-mail</option>
                        <option value="random">Chave Aleatória (EVP)</option>
                      </>
                    ) : (
                      <>
                        <option value="cnpj">CNPJ</option>
                        <option value="cpf">CPF do Titular</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória (EVP)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chave PIX Padrão</Label>
                  <Input
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={
                      pixKeyType === 'cpf'
                        ? '000.000.000-00'
                        : pixKeyType === 'cnpj'
                        ? '00.000.000/0001-00'
                        : pixKeyType === 'phone'
                        ? '(63) 98491-3860'
                        : 'Cole sua chave PIX aqui'
                    }
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-orange-500/10 p-3.5 border border-orange-500/20 flex items-center gap-3 text-xs text-[#E8622C]">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span>
                  Conta Asaas integrada para liquidação e conciliação bancária automática com QR Code PIX dinâmico.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Nota Fiscal / Fiscal */}
        <TabsContent value="fiscal" className="mt-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                {isPF
                  ? 'Regime Fiscal & Tributação de Autônomo'
                  : 'Emissão de Nota Fiscal de Serviço (NFS-e)'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isPF
                  ? 'Configurações para prestação de serviços como Pessoa Física (Carnê-Leão / RPA / Autônomo Municipal).'
                  : 'Dados fiscais para integração automática com a API Focus NFe.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Regime Tributário / Enquadramento</Label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    {isPF ? (
                      <>
                        <option value="autonomo_pf">Autônomo / Carnê-Leão (Pessoa Física)</option>
                        <option value="isento">Isento de Emissão de Nota Fiscal</option>
                        <option value="mei">MEI (Microempreendedor Individual)</option>
                      </>
                    ) : (
                      <>
                        <option value="simples_nacional">Simples Nacional</option>
                        <option value="mei">Microempreendedor Individual (MEI)</option>
                        <option value="lucro_presumido">Lucro Presumido</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {isPF ? 'Registro Municipal / CCM (Opcional)' : 'Inscrição Municipal'}
                  </Label>
                  <Input
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    placeholder="00000000"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Alíquota ISS Estimada (%)</Label>
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
          <div className="flex items-center gap-1.5 text-xs text-[#E8622C] font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Perfil atualizado com sucesso no Appwrite!</span>
          </div>
        ) : errorMsg ? (
          <div className="text-xs text-red-500 font-bold">⚠️ {errorMsg}</div>
        ) : (
          <span className="text-xs text-slate-400">
            Alterações sincronizadas com o banco de dados Appwrite.
          </span>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-9 gap-2 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-xl shadow-warm-xs disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
        </Button>
      </div>
    </form>
  );
}
