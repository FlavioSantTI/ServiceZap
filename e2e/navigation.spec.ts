import { test, expect } from '@playwright/test';

test.describe('Navegação e Middleware E2E', () => {
  test('deve redirecionar usuário não autenticado de /dashboard para /login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // O middleware deve interceptar e redirecionar para a página de login
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve redirecionar usuário não autenticado de /super-admin para /login', async ({ page }) => {
    await page.goto('/super-admin');
    
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve permitir acesso direto a rotas públicas', async ({ page }) => {
    await page.goto('/piloto');
    await expect(page).toHaveURL('/piloto');

    await page.goto('/campanha');
    await expect(page).toHaveURL('/campanha');
  });
});
