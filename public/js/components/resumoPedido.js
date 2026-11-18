import { formatarPreco, esc } from '../utils.js';

// Mostra os itens do carrinho. O total aqui é só uma prévia: o valor cobrado é calculado no backend.
export default function ResumoPedido(itens) {
  const total = itens.reduce((soma, i) => soma + i.produto.preco_centavos * i.quantidade, 0);
  return `
    <div class="card">
      <h2>Resumo do pedido</h2>
      ${itens.map((i) => `
        <div class="linha">
          <span>${i.quantidade}x ${esc(i.produto.nome)}</span>
          <span>${formatarPreco(i.produto.preco_centavos * i.quantidade)}</span>
        </div>`).join('') || '<p>Carrinho vazio</p>'}
      <div class="linha total"><span>Total</span><span>${formatarPreco(total)}</span></div>
    </div>`;
}
