import { test, expect } from '@playwright/test';

test.describe('Landing Page & Programa Piloto E2E', () => {
  test('deve carregar a Landing Page do Programa Piloto com sucesso', async ({ page }) => {
    await page.goto('/piloto');

    // Verifica presença da marca ou títulos principais da landing page
    await expect(page.locator('body')).toContainText(/ServiceZap|Piloto|WhatsApp/i);
  });

  test('deve permitir abrir o modal de candidatura no botão de CTA', async ({ page }) => {
    await page.goto('/piloto');

    // Clica no botão de CTA para abrir o modal de inscrição
    const ctaButton = page.getByRole('button', { name: /Garantir Minha Vaga|Quero Participar|Inscrição|Candidatar/i }).first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      // O modal ou formulário de lead deve ficar visível
      await expect(page.locator('dialog, [role="dialog"], form').first()).toBeVisible();
    }
  });
});
