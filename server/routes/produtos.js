import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, nome, descricao, preco_centavos FROM produtos WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
