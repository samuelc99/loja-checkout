import { Router } from 'express';
import * as pedidos from '../services/pedidos.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await pedidos.criarPedido(req.body)); } catch (err) { next(err); }
});

router.post('/:id/checkout', async (req, res, next) => {
  try { res.json(await pedidos.iniciarCheckout(req.params.id, req.body)); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await pedidos.consultarPedido(req.params.id)); } catch (err) { next(err); }
});

export default router;
