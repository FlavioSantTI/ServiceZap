'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { resetPasswordWithTokenAction } from '@/app/actions/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || undefined;
  const email = searchParams.get('email') || undefined;
  const secret = searchParams.get('secret') || 'default_secret';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordWithTokenAction({
        userId,
        email,
        secret,
        password,
      });

      if (!res.success) {
        throw new Error(res.error || 'Falha ao redefinir senha.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar a redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardContent className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Redefinir Senha</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Cadastre uma nova senha segura para sua conta</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-semibold">
          <ShieldCheck className="h-3 w-3" />
          Protegido
        </Badge>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <span>Senha Atualizada com Sucesso!</span>
          </div>
          <p>Sua senha foi redefinida com sucesso. Redirecionando para a tela de login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
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

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-[#E8622C]"
              />
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
                <span>Atualizando Senha...</span>
              </>
            ) : (
              <>
                <span>Salvar Nova Senha</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </CardContent>
  );
}

export default function ResetPasswordPage() {
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
            Nova Senha de Acesso
          </p>
        </div>

        {/* Card Principal */}
        <Card className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#201F1E]/95 shadow-xl backdrop-blur-sm overflow-hidden">
          <Suspense fallback={
            <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-[#E8622C]" />
              <span>Carregando formulário de redefinição...</span>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </Card>

        {/* Rodapé de Informação */}
        <div className="text-center space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © 2026 ServiceZap • Gestão de Serviços & Multi-Tenant
          </p>
        </div>
      </div>
    </div>
  );
}
