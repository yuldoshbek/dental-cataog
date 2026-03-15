/**
 * routes/products.js - каталог, публичные share-карточки и заявки.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { getCatalogRepository } from '../catalog/index.js';

// Лимит для публичных форм: 10 заявок в минуту на IP
const inquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Слишком много заявок. Подождите минуту.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
const catalog = getCatalogRepository();

function sendError(res, error) {
  const status = error.status ?? 500;
  const message = error.message ?? 'Внутренняя ошибка сервера.';
  return res.status(status).json({ error: message });
}

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendError(res, error);
    }
  };
}

router.get('/categories', asyncRoute(async (_req, res) => {
  res.json(await catalog.listCategories());
}));

router.get('/categories/:id/summary', asyncRoute(async (req, res) => {
  res.json(await catalog.getCategorySummary(req.params.id));
}));

router.get('/products', asyncRoute(async (req, res) => {
  res.json(await catalog.listProducts(req.query));
}));

router.get('/products/:id', asyncRoute(async (req, res) => {
  res.json(await catalog.getProduct(req.params.id));
}));

router.get('/share/:slug', asyncRoute(async (req, res) => {
  res.json(await catalog.getSharedProduct(req.params.slug));
}));

router.post('/products', requireAuth, asyncRoute(async (req, res) => {
  const product = await catalog.createProduct(req.body);
  res.status(201).json(product);
}));

router.put('/products/:id', requireAuth, asyncRoute(async (req, res) => {
  res.json(await catalog.updateProduct(req.params.id, req.body));
}));

router.delete('/products/:id', requireAuth, asyncRoute(async (req, res) => {
  res.json(await catalog.deleteProduct(req.params.id));
}));

router.post('/inquiries', inquiryLimiter, asyncRoute(async (req, res) => {
  const result = await catalog.submitInquiry(req.body, { ipAddress: req.ip });
  res.status(201).json(result);
}));

router.get('/inquiries', requireAuth, asyncRoute(async (_req, res) => {
  res.json(await catalog.listInquiries());
}));

export default router;
