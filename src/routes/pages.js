/**
 * Route halaman: dashboard barang, checkout, hasil pembayaran.
 */
const express = require('express');
const db = require('../../db/connection');
const { renderWithLayout } = require('../utils/render');
const { getOrderById } = require('../services/order');

const router = express.Router();

// Dashboard barang (PRD F-01, F-02)
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  renderWithLayout(res, 'dashboard', { title: 'Dashboard Barang', products });
});

// Halaman checkout (PRD F-04 s/d F-07)
router.get('/checkout', (req, res) => {
  const productId = Number(req.query.product_id);
  const qty = Math.min(10, Math.max(1, Number(req.query.qty) || 1));
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.redirect('/');
  renderWithLayout(res, 'checkout', { title: 'Checkout', product, qty });
});

// Halaman menunggu pembayaran (QR/VA) — isi penuh di FASE 2
router.get('/pay/:orderId', (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) return res.redirect('/');
  renderWithLayout(res, 'waiting', { title: 'Menunggu Pembayaran', order });
});

// Halaman hasil pembayaran
router.get('/result/:orderId', (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) return res.redirect('/');
  const messages = {
    PAID: 'Terima kasih! Pembayaran kamu sudah kami terima.',
    PENDING: 'Pembayaran masih menunggu. Silakan selesaikan pembayaran.',
    FAILED: 'Pembayaran gagal atau dibatalkan. Silakan coba lagi.',
    EXPIRED: 'Masa berlaku pembayaran sudah habis. Silakan buat order baru.',
  };
  renderWithLayout(res, 'result', {
    title: 'Hasil Pembayaran',
    order,
    status: order.status,
    message: messages[order.status] || '',
  });
});

module.exports = router;
