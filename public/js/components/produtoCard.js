import { formatarPreco, esc } from '../utils.js';

export default function ProdutoCard(produto, quantidade = 0) {
  return `
    <div class="produto">
      <div>
        <strong>${esc(produto.nome)}</strong>
        <small>${esc(produto.descricao)}</small>
        <small>${formatarPreco(produto.preco_centavos)}</small>
      </div>
      <input type="number" min="0" max="99" value="${quantidade}" data-id="${produto.id}">
    </div>`;
}
