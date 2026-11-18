// Mercado Pago - Checkout Transparente / Orders API (Pix)
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/pix
export const nome = 'mercadopago';

const API = 'https://api.mercadopago.com/v1/orders';

const STATUS = {
  processed: 'aprovado',
  failed: 'recusado',
  expired: 'expirado',
  canceled: 'cancelado',
};

const falha = (status, message) => Object.assign(new Error(message), { status });

async function chamar(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000), // timeout de 10s
    });
  } catch {
    throw falha(502, 'Provedor de pagamento indisponível');
  }
  if (res.status === 429) throw falha(503, 'Muitas requisições, tente novamente');

  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    console.error('Mercado Pago respondeu', res.status, body?.errors || body?.message);
    throw falha(502, 'Falha ao comunicar com o provedor de pagamento');
  }
  return body;
}

export async function criarPix(pedido) {
  const valor = (pedido.total_centavos / 100).toFixed(2);
  const order = await chamar(API, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': pedido.id }, // mesma chave = mesma cobrança
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'automatic',
      external_reference: pedido.id,
      total_amount: valor,
      payer: { email: pedido.email },
      transactions: { payments: [{ amount: valor, payment_method: { id: 'pix', type: 'bank_transfer' } }] },
    }),
  });

  const pm = order.transactions?.payments?.[0]?.payment_method || {};
  return {
    idExterno: order.id,
    status: STATUS[order.status] || 'pendente',
    qrCode: pm.qr_code,
    qrCodeBase64: pm.qr_code_base64,
    checkoutUrl: pm.ticket_url,
  };
}

export async function consultar(idExterno) {
  const order = await chamar(`${API}/${encodeURIComponent(idExterno)}`);
  return STATUS[order.status] || 'pendente';
}
