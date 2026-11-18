import express from 'express';
import produtosRoutes from './routes/produtos.js';
import pedidosRoutes from './routes/pedidos.js';
import provider from './providers/index.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Diz ao frontend qual provedor está ativo. A Public Key é pública (usada no formulário de cartão).
app.get('/api/config', (req, res) => {
  res.json({ provedor: provider.nome, mpPublicKey: provider.nome === 'mercadopago' ? process.env.MP_PUBLIC_KEY : null });
});

app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Erros: mensagem amigável ao cliente, detalhe só no log (sem segredos)
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message);
  res.status(err.status || 500).json({ erro: err.status ? err.message : 'Erro interno' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Loja rodando em http://localhost:${port}`));
