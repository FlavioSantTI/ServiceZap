/**
 * Utilitário de sanitização para identificadores remotos do WhatsApp (JID)
 * Remove sufixos '@s.whatsapp.net', '@c.us' e dispositivos anexados (ex: :22@s.whatsapp.net).
 * Sempre garante o DDI 55 para números brasileiros de 10 ou 11 dígitos.
 */
export function sanitizeWhatsAppJid(jid: string): string {
  if (!jid) return '';
  let clean = jid
    .replace(/@s\.whatsapp\.net$/i, '')
    .replace(/@c\.us$/i, '')
    .replace(/:.*$/g, '')
    .replace(/\D/g, '');

  // Se for um número brasileiro de 10 ou 11 dígitos sem o DDI 55 (ex: 63984913860 -> 5563984913860)
  if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
    clean = `55${clean}`;
  }

  return clean;
}

/**
 * Compara dois números de telefone sanitizados tratando variações do 9º dígito brasileiro
 */
export function isSamePhone(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const cleanA = sanitizeWhatsAppJid(phoneA);
  const cleanB = sanitizeWhatsAppJid(phoneB);
  if (cleanA === cleanB) return true;

  if (cleanA.length >= 10 && cleanB.length >= 10) {
    const last8A = cleanA.slice(-8);
    const last8B = cleanB.slice(-8);
    const dddA = cleanA.length === 13 ? cleanA.slice(2, 4) : cleanA.slice(-10, -8);
    const dddB = cleanB.length === 13 ? cleanB.slice(2, 4) : cleanB.slice(-10, -8);

    if (last8A === last8B && dddA === dddB) {
      return true;
    }
  }
  return false;
}
