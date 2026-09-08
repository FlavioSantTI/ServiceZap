/**
 * Serviço de Integração com a API ViaCEP
 * https://viacep.com.br/
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

/**
 * Formata string para máscara de CEP: 00000-000
 */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Consulta o endereço correspondente ao CEP fornecido
 */
export async function fetchAddressByCep(rawCep: string): Promise<ViaCepResponse | null> {
  const digits = rawCep.replace(/\D/g, '');
  if (digits.length !== 8) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos de timeout

    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn('[ViaCEP] Falha na consulta do CEP:', error);
    return null;
  }
}
