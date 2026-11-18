// Simulação controlada: o Pix é "pago" 15 segundos depois de gerado; o cartão é aprovado na hora
import QRCode from 'qrcode';

export const nome = 'simulado';

const criadosEm = new Map();

export async function criarPix(pedido) {
  const idExterno = `SIM-${pedido.id}`;
  criadosEm.set(idExterno, Date.now());
  const qrCode = `00020126PIXSIMULADO${pedido.id}`;
  // Gera a imagem do QR Code no mesmo formato do Mercado Pago (PNG em base64)
  const imagem = await QRCode.toDataURL(qrCode);
  return {
    idExterno,
    status: 'pendente',
    qrCode,
    qrCodeBase64: imagem.split(',')[1],
    checkoutUrl: null,
  };
}

// Cartão simulado: nenhum dado de cartão é coletado; aprova na hora
export async function criarCartao(pedido) {
  return { idExterno: `SIM-${pedido.id}`, status: 'aprovado', qrCode: null, qrCodeBase64: null, checkoutUrl: null };
}

export async function consultar(idExterno) {
  const criado = criadosEm.get(idExterno);
  if (!criado) return 'expirado'; // servidor foi reiniciado
  return Date.now() - criado > 15000 ? 'aprovado' : 'pendente';
}
