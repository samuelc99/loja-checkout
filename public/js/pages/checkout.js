import { api } from '../api.js';
import { itensCarrinho } from '../carrinho.js';
import ResumoPedido from '../components/resumoPedido.js';

export default function Checkout(app) {
  const itens = itensCarrinho();
  if (!itens.length) return (location.hash = '#/');

  app.innerHTML = `
    <form class="card" id="form">
      <h2>Dados do comprador</h2>
      <label>Nome completo *</label>
      <input name="nome" required>
      <label>E-mail *</label>
      <input name="email" type="email" required>
      <p class="erro" id="erro"></p>
      <button>🔒 Pagar com Pix</button>
    </form>
    <aside>${ResumoPedido(itens)}</aside>`;

  const form = app.querySelector('#form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    form.querySelector('button').disabled = true;
    try {
      // Envia só IDs e quantidades; o backend calcula o total
      const pedido = await api.criarPedido({
        nome: form.nome.value,
        email: form.email.value,
        itens: itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      });
      await api.iniciarCheckout(pedido.id);
      location.hash = `#/pedido/${pedido.id}`;
    } catch (err) {
      app.querySelector('#erro').textContent = err.message;
      form.querySelector('button').disabled = false;
    }
  };
}
