import { test, expect } from '@playwright/test';

test.describe('Fluxo de Recuperação e Redefinição de Senha E2E', () => {
  test('deve carregar a página de solicitação de recuperação de senha com elementos visíveis', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: /Recuperar Senha/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar Instruções/i })).toBeVisible();
  });

  test('deve exibir mensagem de erro ao submeter senha curta ou divergente na redefinição', async ({ page }) => {
    await page.goto('/reset-password?userId=test-user&secret=test-secret');

    await expect(page.getByRole('heading', { name: /Redefinir Senha/i })).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();

    // Digita senha curta (< 6 caracteres)
    await page.locator('#password').fill('123');
    await page.locator('#confirmPassword').fill('123');
    await page.getByRole('button', { name: /Salvar Nova Senha/i }).click();

    await expect(page.locator('text=A senha deve possuir pelo menos 6 caracteres.')).toBeVisible();

    // Digita senhas divergentes
    await page.locator('#password').fill('senhaValida123');
    await page.locator('#confirmPassword').fill('senhaDiferente123');
    await page.getByRole('button', { name: /Salvar Nova Senha/i }).click();

    await expect(page.locator('text=As senhas digitadas não coincidem.')).toBeVisible();
  });
});
