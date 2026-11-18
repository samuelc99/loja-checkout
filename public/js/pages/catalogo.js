import { api } from '../api.js';
import { carrinho, definirQuantidade, itensCarrinho } from '../carrinho.js';
import ProdutoCard from '../components/produtoCard.js';
import ResumoPedido from '../components/resumoPedido.js';

export default async function Catalogo(app) {
  let produtos;
  try {
    produtos = await api.listarProdutos();
  } catch (err) {
    app.innerHTML = `<section class="card"><p class="erro">Não foi possível carregar os produtos: ${err.message}</p></section>`;
    return;
  }

  function render() {
    app.innerHTML = `
      <section class="card">
        <h2>Produtos</h2>
        ${produtos.map((p) => ProdutoCard(p, carrinho[p.id]?.quantidade)).join('')}
      </section>
      <aside>
        ${ResumoPedido(itensCarrinho())}
        <button id="continuar" ${itensCarrinho().length ? '' : 'disabled'}>Ir para o pagamento</button>
      </aside>`;

    app.querySelectorAll('input[data-id]').forEach((input) => {
      input.onchange = () => {
        const produto = produtos.find((p) => p.id === Number(input.dataset.id));
        definirQuantidade(produto, Math.min(99, Math.max(0, parseInt(input.value) || 0)));
        render();
      };
    });
    app.querySelector('#continuar').onclick = () => (location.hash = '#/checkout');
  }

  render();
}
