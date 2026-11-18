import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import provider from '../providers/index.js';

const erro = (status, message) => Object.assign(new Error(message), { status });

// Valida os dois dígitos verificadores do CPF
function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += cpf[i] * (n + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[n])) return false;
  }
  return true;
}

export async function criarPedido({ nome, email, cpf, itens } = {}) {
  cpf = String(cpf || '').replace(/\D/g, '');
  if (!nome?.trim()) throw erro(400, 'Nome é obrigatório');
  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw erro(400, 'E-mail inválido');
  if (!cpfValido(cpf)) throw erro(400, 'CPF inválido');
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
  await db.query(
    'INSERT INTO pedidos (id, comprador, email, cpf, total_centavos) VALUES (?, ?, ?, ?, ?)',
    [id, nome.trim(), email, cpf, total]
  );
  await db.query(
    'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario_centavos) VALUES ?',
    [linhas.map((l) => [id, ...l])]
  );
  await registrarHistorico(id, 'pendente');

  return { id, total_centavos: total, status: 'pendente' };
}

// metodo: 'pix' ou 'cartao'. Para cartão, recebe só o token gerado pelo Mercado Pago (nunca o número do cartão).
export async function iniciarCheckout(pedidoId, { metodo, cartao } = {}) {
  if (!['pix', 'cartao'].includes(metodo)) throw erro(400, 'Método de pagamento inválido');
  const pedido = await buscarPedido(pedidoId);

  // Idempotência: se já existe pagamento para o pedido, devolve o mesmo (RF07)
  if (pedido.pagamento) return pedido;

  // CPF não é devolvido pela API (dado pessoal); só é usado aqui para enviar ao provedor
  const [[{ cpf }]] = await db.query('SELECT cpf FROM pedidos WHERE id = ?', [pedidoId]);
  const dados = { ...pedido, cpf };
  const pag = metodo === 'cartao' ? await provider.criarCartao(dados, cartao) : await provider.criarPix(dados);

  await db.query(
    'INSERT INTO pagamentos (pedido_id, provedor, id_externo, metodo, status, qr_code, qr_code_base64, checkout_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [pedidoId, provider.nome, pag.idExterno, metodo, pag.status, pag.qrCode, pag.qrCodeBase64, pag.checkoutUrl]
  );
  // Cartão costuma ser aprovado/recusado na hora
  if (pag.status !== 'pendente') await atualizarStatus(pedidoId, pag.status);
  return buscarPedido(pedidoId);
}

export async function consultarPedido(pedidoId) {
  const pedido = await buscarPedido(pedidoId);

  // O status vem do provedor, nunca da tela de retorno
  if (pedido.pagamento && pedido.status === 'pendente') {
    const status = await provider.consultar(pedido.pagamento.id_externo);
    if (status !== pedido.status) {
      await atualizarStatus(pedidoId, status);
      return buscarPedido(pedidoId);
    }
  }
  return pedido;
}

async function atualizarStatus(pedidoId, status) {
  await db.query('UPDATE pagamentos SET status = ? WHERE pedido_id = ?', [status, pedidoId]);
  await db.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, pedidoId]);
  await registrarHistorico(pedidoId, status);
}

async function buscarPedido(id) {
  const [[pedido]] = await db.query('SELECT id, comprador, email, total_centavos, status FROM pedidos WHERE id = ?', [id]);
  if (!pedido) throw erro(404, 'Pedido não encontrado');
  const [[pagamento]] = await db.query(
    'SELECT provedor, id_externo, metodo, status, qr_code, qr_code_base64, checkout_url FROM pagamentos WHERE pedido_id = ?',
    [id]
  );
  const [historico] = await db.query(
    'SELECT status, criado_em FROM historico_status WHERE pedido_id = ? ORDER BY id',
    [id]
  );
  return { ...pedido, pagamento: pagamento || null, historico };
}

function registrarHistorico(pedidoId, status) {
  return db.query('INSERT INTO historico_status (pedido_id, status) VALUES (?, ?)', [pedidoId, status]);
}
