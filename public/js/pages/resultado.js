import { api } from '../api.js';
import { formatarPreco, esc } from '../utils.js';
import StatusBadge from '../components/statusBadge.js';

let timer;

export default async function Resultado(app, pedidoId) {
  async function render() {
    let pedido;
    try {
      pedido = await api.consultarPedido(pedidoId);
    } catch (err) {
      app.innerHTML = `<section class="card"><p class="erro">${esc(err.message)}</p></section>`;
      return;
    }
    const pag = pedido.pagamento || {};
    const pendente = pedido.status === 'pendente';

    app.innerHTML = `
      <section class="card">
        <h2>Pedido ${esc(pedido.id.slice(0, 8))}</h2>
        <div class="linha"><span>Comprador</span><span>${esc(pedido.comprador)}</span></div>
        <div class="linha"><span>Valor</span><strong>${formatarPreco(pedido.total_centavos)}</strong></div>
        <div class="linha"><span>Status</span>${StatusBadge(pedido.status)}</div>

        ${pendente && pag.qr_code_base64 ? `<img class="qr" src="data:image/png;base64,${esc(pag.qr_code_base64)}" alt="QR Code Pix">` : ''}
        ${pendente && pag.qr_code ? `<label>Pix copia e cola</label><textarea readonly>${esc(pag.qr_code)}</textarea>` : ''}
        ${pendente && pag.checkout_url ? `<a class="botao" href="${esc(pag.checkout_url)}" target="_blank">Abrir página do Pix</a>` : ''}
        ${pendente ? '<button id="atualizar">Verificar pagamento</button>' : '<a class="botao" href="#/">Voltar para a loja</a>'}
      </section>
      <aside class="card">
        <h2>Histórico de status</h2>
        ${(pedido.historico || []).map((h) => `
          <div class="linha">${StatusBadge(h.status)}<small>${new Date(h.criado_em).toLocaleString('pt-BR')}</small></div>`).join('')}
        <p><small>O status é consultado no provedor pelo nosso servidor — não confiamos apenas nesta tela.</small></p>
      </aside>`;

    app.querySelector('#atualizar')?.addEventListener('click', render);

    // Enquanto pendente e nesta tela, consulta de novo a cada 5 segundos
    clearTimeout(timer);
    if (pendente) timer = setTimeout(() => location.hash === `#/pedido/${pedidoId}` && render(), 5000);
  }

  await render();
}
