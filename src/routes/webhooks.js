/**
 * Route webhook payment gateway.
 * Endpoint diimplementasikan per gateway pada FASE 2 masing-masing tasklist:
 * - POST /webhook/pakasir  → TASKLIST-PAKASIR.md §2.3
 * - POST /webhook/ipaymu   → TASKLIST-IPAYMU.md §2.2
 * - POST /webhook/doku     → TASKLIST-DOKU.md §2.2
 *
 * Prinsip umum (PRD F-18, F-19):
 * - Balas cepat HTTP 200.
 * - Validasi order_id & amount, konfirmasi ulang via API status gateway.
 * - Idempoten: webhook duplikat tidak mengubah status lebih dari sekali.
 */
const express = require('express');
const { getOrderById, updateOrderStatus } = require('../services/order');
const pakasir = require('../gateways/pakasir');

const router = express.Router();

// POST /webhook/pakasir — notifikasi pembayaran dari Pakasir
router.post('/pakasir', (req, res) => {
  const payload = req.body || {};

  // Balas cepat — pemrosesan (termasuk konfirmasi API) berjalan setelah respons.
  res.status(200).json({ received: true });

  processPakasirWebhook(payload).catch((err) => {
    console.error('Webhook Pakasir gagal diproses:', err.message);
  });
});

async function processPakasirWebhook(payload) {
  if (!pakasir.verifyWebhook(payload)) {
    console.warn('Webhook Pakasir: payload tidak valid, diabaikan.');
    return;
  }

  const order = getOrderById(payload.order_id);
  if (!order) {
    console.warn(`Webhook Pakasir: order ${payload.order_id} tidak ditemukan.`);
    return;
  }

  if (Number(payload.amount) !== Number(order.amount)) {
    console.warn(
      `Webhook Pakasir: nominal tidak cocok order=${order.amount} webhook=${payload.amount}, diabaikan.`
    );
    return;
  }

  if (order.status === 'PAID') {
    console.log(`Webhook Pakasir: order ${order.order_id} sudah PAID, diabaikan (idempoten).`);
    return;
  }

  // Konfirmasi ulang ke API Pakasir — jangan percaya isi webhook mentah.
  const result = await pakasir.checkStatus(order);
  if (pakasir.mapStatus(result.status) !== 'PAID') {
    console.log(
      `Webhook Pakasir: status gateway "${result.status}" bukan completed, order tetap ${order.status}.`
    );
    return;
  }

  updateOrderStatus(order.order_id, 'PAID', normalizeDate(payload.completed_at));
  console.log(`Webhook Pakasir: order ${order.order_id} berubah menjadi PAID.`);
}

/** Normalisasi timestamp gateway → 'YYYY-MM-DD HH:MM:SS' (UTC), null bila tidak valid */
function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = router;
