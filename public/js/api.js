async function request(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json();
  if (!res.ok) throw new Error(body.erro || 'Erro inesperado');
  return body;
}

export const api = {
  config: () => request('/api/config'),
  listarProdutos: () => request('/api/produtos'),
  criarPedido: (dados) => request('/api/pedidos', { method: 'POST', body: JSON.stringify(dados) }),
  iniciarCheckout: (id, dados) => request(`/api/pedidos/${id}/checkout`, { method: 'POST', body: JSON.stringify(dados) }),
  consultarPedido: (id) => request(`/api/pedidos/${id}`),
};
