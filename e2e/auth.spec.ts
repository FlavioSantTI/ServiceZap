import { test, expect } from '@playwright/test';

test.describe('Autenticação & Login E2E', () => {
  test('deve carregar a página de login com elementos principais', async ({ page }) => {
    await page.goto('/login');
    
    // Verifica título da marca e formulário
    await expect(page.getByRole('heading', { name: /Service/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Acesse sua Conta/i })).toBeVisible();
    
    // Campo de e-mail e senha
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Botão de login
    await expect(page.getByRole('button', { name: /Entrar na Plataforma/i })).toBeVisible();
  });

  test('deve exibir mensagem de erro ao tentar login sem e-mail', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Entrar na Plataforma/i }).click();

    // Deve exibir alerta de erro indicando e-mail necessário
    await expect(page.locator('text=Informe seu e-mail de acesso')).toBeVisible();
  });

  test('deve navegar para a página de recuperação de senha ao clicar no link', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Esqueceu a senha?');

    await expect(page).toHaveURL('/forgot-password');
  });
});
