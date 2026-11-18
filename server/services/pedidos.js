import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import provider from '../providers/index.js';

const erro = (status, message) => Object.assign(new Error(message), { status });

export async function criarPedido({ nome, email, itens } = {}) {
  if (!nome?.trim()) throw erro(400, 'Nome é obrigatório');
  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw erro(400, 'E-mail inválido');
  if (!Array.isArray(itens) || itens.length === 0) throw erro(400, 'Carrinho vazio');

  // Nunca confiar no preço do navegador: busca os preços no banco
  const ids = itens.map((i) => Number(i.produtoId));
  const [produtos] = await db.query('SELECT id, preco_centavos FROM produtos WHERE ativo = TRUE AND id IN (?)', [ids]);

  let total = 0;
  const linhas = itens.map((item) => {
    const produto = produtos.find((p) => p.id === Number(item.produtoId));
    const qtd = Number(item.quantidade);
    if (!produto) throw erro(400, `Produto ${item.produtoId} inválido`);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 99) throw erro(400, 'Quantidade inválida');
    total += produto.preco_centavos * qtd;
    return [produto.id, qtd, produto.preco_centavos];
  });

  const id = randomUUID();
  await db.query('INSERT INTO pedidos (id, comprador, email, total_centavos) VALUES (?, ?, ?, ?)', [id, nome.trim(), email, total]);
  await db.query(
    'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario_centavos) VALUES ?',
    [linhas.map((l) => [id, ...l])]
  );

  return { id, total_centavos: total, status: 'pendente' };
}

export async function iniciarCheckout(pedidoId) {
  const pedido = await buscarPedido(pedidoId);

  // Idempotência: se já existe pagamento para o pedido, devolve o mesmo (RF07)
  if (pedido.pagamento) return pedido;

  const pag = await provider.criarPix(pedido);
  await db.query(
    'INSERT INTO pagamentos (pedido_id, provedor, id_externo, metodo, status, qr_code, qr_code_base64, checkout_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [pedidoId, provider.nome, pag.idExterno, 'pix', pag.status, pag.qrCode, pag.qrCodeBase64, pag.checkoutUrl]
  );
  return buscarPedido(pedidoId);
}

export async function consultarPedido(pedidoId) {
  const pedido = await buscarPedido(pedidoId);

  // O status vem do provedor, nunca da tela de retorno
  if (pedido.pagamento && pedido.status === 'pendente') {
    const status = await provider.consultar(pedido.pagamento.id_externo);
    if (status !== pedido.status) {
      await db.query('UPDATE pagamentos SET status = ? WHERE pedido_id = ?', [status, pedidoId]);
      await db.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, pedidoId]);
      return buscarPedido(pedidoId);
    }
  }
  return pedido;
}

async function buscarPedido(id) {
  const [[pedido]] = await db.query('SELECT id, comprador, email, total_centavos, status FROM pedidos WHERE id = ?', [id]);
  if (!pedido) throw erro(404, 'Pedido não encontrado');
  const [[pagamento]] = await db.query(
    'SELECT provedor, id_externo, status, qr_code, qr_code_base64, checkout_url FROM pagamentos WHERE pedido_id = ?',
    [id]
  );
  return { ...pedido, pagamento: pagamento || null };
}
