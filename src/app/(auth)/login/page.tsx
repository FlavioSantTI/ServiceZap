'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

      // Redireciona conforme o perfil do usuário (Super Admin -> /super-admin, Outros -> /dashboard)
      if (res.user?.role === 'super_admin') {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Cabeçalho da Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-warm-sm mb-1">
            <Zap className="h-7 w-7 fill-current text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Service<span className="text-primary">Zap</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Plataforma Multi-Tenant de Gestão &amp; WhatsApp Integrado
          </p>
        </div>

        {/* Card Principal de Login */}
        <Card className="rounded-3xl border border-border bg-card shadow-warm-md overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Acesse sua Conta</h2>
                <p className="text-xs text-muted-foreground">Entre com suas credenciais ou selecione uma empresa</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-border bg-muted/60 text-foreground gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3 text-primary" />
                Seguro
              </Badge>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Senha
                  </Label>
                  <Link href="/forgot-password" className="text-[11px] text-primary hover:underline cursor-pointer">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gap-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm-xs transition-all"
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
          </CardContent>
        </Card>

        {/* Rodapé de Informação */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-wide">
              v1.1 beta
            </span>
          </p>
          <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '16px', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>
            Desenvolvido por: <strong style={{ color: 'var(--foreground)' }}>Flavio Santiago Consultoria IA</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
