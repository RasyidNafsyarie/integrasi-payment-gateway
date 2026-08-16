/**
 * Route POST checkout: pembuatan order + pemanggilan gateway.
 * Logika gateway diaktifkan pada FASE 2 masing-masing tasklist.
 */
const express = require('express');
const db = require('../../db/connection');
const { renderWithLayout } = require('../utils/render');
const { createOrder, savePaymentDetail } = require('../services/order');
const pakasir = require('../gateways/pakasir');

const router = express.Router();

router.post('/checkout', async (req, res) => {
  const productId = Number(req.body.product_id);
  const qty = Math.min(10, Math.max(1, Number(req.body.qty) || 1));
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.redirect('/');

  const gateway = req.body.gateway || 'pakasir';
  const paymentMethod = req.body.payment_method || 'qris';

  // iPaymu & DOKU belum diimplementasikan — tolak dan kembalikan ke dashboard.
  if (gateway !== 'pakasir') {
    return renderWithLayout(res, 'result', {
      title: 'Gateway Belum Aktif',
      status: 'FAILED',
      message: `Gateway ${gateway} belum diintegrasikan. Gunakan Pakasir.`,
      order: null,
    });
  }

  try {
    const order = createOrder({
      productId,
      qty,
      amount: product.price * qty,
      buyer: {
        name: req.body.buyer_name || '',
        email: req.body.buyer_email || '',
        phone: req.body.buyer_phone || '',
      },
      gateway,
      paymentMethod,
    });

    // 1. Buat transaksi di Pakasir (QRIS/VA)
    const payment = await pakasir.createPayment(order, paymentMethod);

    // 2. Simpan detail: payment_number (QR/VA), total (amount + fee), expired_at asli
    savePaymentDetail(order.order_id, {
      paymentNumber: payment.paymentNumber,
      totalPayment: payment.totalPayment,
      expiredAt: payment.expiredAt,
      paymentMethod: payment.paymentMethod,
    });

    // 3. Arahkan user ke halaman menunggu pembayaran
    res.redirect(`/pay/${order.order_id}`);
  } catch (err) {
    console.error('Gagal membuat pembayaran Pakasir:', err.message);
    renderWithLayout(res, 'result', {
      title: 'Pembayaran Gagal Dibuat',
      status: 'FAILED',
      message: `Gagal menghubungi gateway Pakasir: ${err.message}`,
      order: null,
    });
  }
});

module.exports = router;
