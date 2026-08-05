/**
 * Manajemen order & status.
 * Logika lengkap (pembuatan order + pembaruan status dari webhook)
 * dilengkapi pada FASE 2 masing-masing tasklist gateway.
 */
const db = require('../../db/connection');

/** Buat order_id unik, contoh: INV20260806-A7F3K2 */
function generateOrderId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV${stamp}-${rand}`;
}

function getOrderById(orderId) {
  return db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
}

module.exports = { generateOrderId, getOrderById };
