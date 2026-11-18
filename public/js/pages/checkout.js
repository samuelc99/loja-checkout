import { api } from '../api.js';
import { itensCarrinho } from '../carrinho.js';
import ResumoPedido from '../components/resumoPedido.js';
import CartaoMercadoPago from '../components/cartaoMercadoPago.js';

export default async function Checkout(app) {
  const itens = itensCarrinho();
  if (!itens.length) return (location.hash = '#/');

  const config = await api.config();
  const totalPrevia = itens.reduce((s, i) => s + i.produto.preco_centavos * i.quantidade, 0) / 100;
  let metodo = 'pix';
  let cartaoCriado = false;

  app.innerHTML = `
    <section class="card">
      <form id="form">
        <h2>Dados do comprador</h2>
        <label>Nome completo *</label>
        <input name="nome" required>
        <label>E-mail *</label>
        <input name="email" type="email" required>
        <label>CPF *</label>
        <input name="cpf" required inputmode="numeric" maxlength="14" placeholder="000.000.000-00">

        <h2 class="espaco">Forma de pagamento</h2>
        <div class="metodos">
          <button type="button" data-metodo="pix" class="ativo">Pix</button>
          <button type="button" data-metodo="cartao">Cartão</button>
        </div>
      </form>
      <div id="cartao" hidden></div>
      <p class="erro" id="erro"></p>
      <button id="pagar" form="form">🔒 Pagar com Pix</button>
    </section>
    <aside>${ResumoPedido(itens)}</aside>`;

  const form = app.querySelector('#form');
  const botao = app.querySelector('#pagar');
  const erroEl = app.querySelector('#erro');

  async function pagar(cartao) {
    erroEl.textContent = '';
    try {
      if (!form.reportValidity()) throw new Error('Preencha os dados do comprador');
      // Envia só IDs e quantidades; o backend calcula o total
      const pedido = await api.criarPedido({
        nome: form.nome.value,
        email: form.email.value,
        cpf: form.cpf.value,
        itens: itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      });
      await api.iniciarCheckout(pedido.id, { metodo, cartao });
      location.hash = `#/pedido/${pedido.id}`;
    } catch (err) {
      erroEl.textContent = err.message;
      throw err;
    }
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    botao.disabled = true;
    pagar().catch(() => (botao.disabled = false));
  };

  // Troca entre Pix e cartão
  app.querySelectorAll('[data-metodo]').forEach((b) => {
    b.onclick = () => {
      metodo = b.dataset.metodo;
      erroEl.textContent = '';
      app.querySelectorAll('[data-metodo]').forEach((x) => x.classList.toggle('ativo', x === b));

      // Com Mercado Pago, o cartão usa o formulário seguro dele (que tem o próprio botão de pagar)
      const usaFormMP = metodo === 'cartao' && config.mpPublicKey;
      app.querySelector('#cartao').hidden = !usaFormMP;
      botao.hidden = usaFormMP;
      botao.textContent = metodo === 'pix' ? '🔒 Pagar com Pix' : '🔒 Pagar com cartão (simulado)';

      if (usaFormMP && !cartaoCriado) {
        cartaoCriado = true;
        CartaoMercadoPago('cartao', config.mpPublicKey, totalPrevia, pagar, () => {
          app.querySelector('#cartao').hidden = true;
          erroEl.textContent = 'Não foi possível usar cartão neste pedido (o valor pode estar abaixo do mínimo aceito). Tente pagar com Pix.';
        });
      }
    };
  });
}
