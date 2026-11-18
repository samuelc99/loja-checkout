// Estado do carrinho em memória: { [produtoId]: { produto, quantidade } }
export const carrinho = {};

export function definirQuantidade(produto, quantidade) {
  if (quantidade > 0) carrinho[produto.id] = { produto, quantidade };
  else delete carrinho[produto.id];
}

export const itensCarrinho = () => Object.values(carrinho);
