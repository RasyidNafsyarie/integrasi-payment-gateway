/**
 * Route POST checkout: pembuatan order + pemanggilan gateway.
 * Logika gateway diaktifkan pada FASE 2 masing-masing tasklist.
 */
const express = require('express');
const db = require('../../db/connection');
const { renderWithLayout } = require('../utils/render');

const router = express.Router();

router.post('/checkout', (req, res) => {
  const productId = Number(req.body.product_id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.redirect('/');

  // Placeholder FASE 0: gateway belum diintegrasikan.
  // Pada FASE 2 (TASKLIST-PAKASIR) endpoint ini akan:
  // 1. Membuat order (services/order.js) dengan order_id unik.
  // 2. Memanggil src/gateways/{pakasir,ipaymu,doku}.createPayment().
  // 3. Mengarahkan user ke halaman bayar / QRIS / nomor VA.
  renderWithLayout(res, 'result', {
    title: 'Integrasi Gateway Belum Aktif',
    status: 'PENDING',
    message:
      'Form checkout sudah siap, tetapi integrasi payment gateway baru dikerjakan di FASE 2. ' +
      'Lanjutkan ke TASKLIST-PAKASIR.md FASE 1.',
    order: null,
  });
});

module.exports = router;
