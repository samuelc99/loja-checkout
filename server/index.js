import express from 'express';
import produtosRoutes from './routes/produtos.js';
import pedidosRoutes from './routes/pedidos.js';
import provider from './providers/index.js';
import { iniciarNgrok } from './ngrok.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/api/config', (req, res) => {
  res.json({ provedor: provider.nome, mpPublicKey: provider.nome === 'mercadopago' ? process.env.MP_PUBLIC_KEY : null });
});

app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message);
  res.status(err.status || 500).json({ erro: err.status ? err.message : 'Erro interno' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Loja rodando em http://localhost:${port}`);
  if (process.env.NGROK === 'true') iniciarNgrok(port);
});
