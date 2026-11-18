import { Router } from 'express';
import * as pedidos from '../services/pedidos.js';

const router = Router();

// Cria o pedido (total calculado no backend)
router.post('/', async (req, res, next) => {
  try { res.status(201).json(await pedidos.criarPedido(req.body)); } catch (err) { next(err); }
});

// Cria a cobrança Pix no provedor
router.post('/:id/checkout', async (req, res, next) => {
  try { res.json(await pedidos.iniciarCheckout(req.params.id)); } catch (err) { next(err); }
});

// Consulta o pedido e atualiza o status com o provedor
router.get('/:id', async (req, res, next) => {
  try { res.json(await pedidos.consultarPedido(req.params.id)); } catch (err) { next(err); }
});

export default router;
