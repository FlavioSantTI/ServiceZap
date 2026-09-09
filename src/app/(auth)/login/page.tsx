'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, demoTenantId?: 'tenant_01' | 'tenant_02' | 'tenant_master') => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const targetEmail = demoTenantId
        ? demoTenantId === 'tenant_01'
          ? 'alpha@servicezap.com'
          : demoTenantId === 'tenant_02'
          ? 'beta@servicezap.com'
          : 'master@servicezap.com'
        : email;

      if (!targetEmail) {
        throw new Error('Informe seu e-mail de acesso.');
      }

      const res = await loginAction({
        email: targetEmail,
        password,
        demoTenantId,
      });

      if (!res.success) {
        throw new Error(res.error || 'Falha ao realizar login.');
      }

      // Redireciona para a central de WhatsApp ou Dashboard
      router.push('/dashboard/whatsapp');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF6F2] dark:bg-[#151413] p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Cabeçalho da Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E8622C] to-[#F0806B] text-white shadow-lg shadow-orange-500/25 mb-1">
            <Zap className="h-7 w-7 fill-white text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2B2B2B] dark:text-[#FAF6F2]">
            Service<span className="text-[#E8622C]">Zap</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Plataforma Multi-Tenant de Gestão & WhatsApp Integrado
          </p>
        </div>

        {/* Card Principal de Login */}
        <Card className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#201F1E]/95 shadow-xl backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Acesse sua Conta</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Entre com suas credenciais ou selecione uma empresa</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3" />
                Seguro
              </Badge>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-[#E8622C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Senha
                  </Label>
                  <span className="text-[11px] text-[#E8622C] hover:underline cursor-pointer">
                    Esqueceu a senha?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-[#E8622C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gap-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white shadow-md shadow-orange-500/20 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar na Plataforma</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                <span className="bg-white dark:bg-[#201F1E] px-2 text-zinc-400">
                  Ou Teste o Isolamento Multi-Tenant
                </span>
              </div>
            </div>

            {/* Botões de Acesso Rápido para Teste de Multi-Tenancy */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'tenant_01')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5 hover:bg-orange-100/70 dark:hover:bg-orange-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-[#E8622C] font-bold text-xs shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#E8622C] flex items-center gap-2">
                      <span>Empresa Alpha</span>
                      <Badge className="text-[9px] px-1.5 py-0 bg-orange-500/20 text-[#E8622C] border-none">
                        tenant_01
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      WhatsApp 1 isolado (Flavio Dias)
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-[#E8622C] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, 'tenant_02')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-100/70 dark:hover:bg-indigo-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-2">
                      <span>Empresa Beta</span>
                      <Badge className="text-[9px] px-1.5 py-0 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-none">
                        tenant_02
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      WhatsApp 2 isolado (Carlos Mendes)
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, 'tenant_master')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5 hover:bg-purple-100/70 dark:hover:bg-purple-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-2">
                      <span>Super Admin Master</span>
                      <Badge className="text-[9px] px-1.5 py-0 bg-purple-500/20 text-purple-600 dark:text-purple-400 border-none">
                        super_admin
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Gestão global de todas as empresas e planos
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé de Informação */}
        <div className="text-center space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © 2026 ServiceZap • Sistema Multi-Tenant com Isolamento de WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
