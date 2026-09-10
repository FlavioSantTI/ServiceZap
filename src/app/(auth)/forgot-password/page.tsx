'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { requestPasswordResetAction } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setResetUrl(null);
    setLoading(true);

    try {
      const res = await requestPasswordResetAction(email);
      if (!res.success) {
        throw new Error(res.error || 'Falha ao solicitar recuperação.');
      }
      setSuccessMessage(res.message || 'Instruções enviadas com sucesso!');
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar a solicitação.');
    } finally {
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
            Recuperação de Acesso
          </p>
        </div>

        {/* Card Principal de Recuperação */}
        <Card className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#201F1E]/95 shadow-xl backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Recuperar Senha</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Informe o e-mail da sua conta para receber as instruções</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3" />
                Segurança
              </Badge>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Instruções enviadas!</span>
                  </div>
                  <p>{successMessage}</p>
                </div>

                {resetUrl && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-xs space-y-1">
                    <span className="font-semibold text-[#E8622C]">Link de teste direto:</span>
                    <br />
                    <Link href={resetUrl} className="text-blue-600 dark:text-blue-400 underline break-all">
                      Clique aqui para redefinir sua senha
                    </Link>
                  </div>
                )}

                <Link
                  href="/login"
                  className="w-full h-11 text-xs font-bold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar para o Login</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    E-mail Cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="seu.email@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Instruções</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Voltar para o Login</span>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Rodapé de Informação */}
        <div className="text-center space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © 2026 ServiceZap • Sistema de Gestão & Multi-Tenant
          </p>
        </div>
      </div>
    </div>
  );
}
