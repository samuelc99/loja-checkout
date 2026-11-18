import catalogo from './pages/catalogo.js';
import checkout from './pages/checkout.js';
import resultado from './pages/resultado.js';

const rotas = [
  [/^#\/checkout$/, checkout],
  [/^#\/pedido\/([\w-]+)$/, resultado],
];

function render() {
  const app = document.getElementById('app');
  for (const [regex, pagina] of rotas) {
    const match = location.hash.match(regex);
    if (match) return pagina(app, ...match.slice(1));
  }
  catalogo(app);
}

window.addEventListener('hashchange', render);
render();
