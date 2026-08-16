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

/**
 * Simpan order baru dengan status PENDING.
 * Masa berlaku default 24 jam (untuk Pakasir, expired_at asli dari gateway
 * akan menimpa nilai ini di langkah setelah createPayment).
 */
function createOrder({ productId, qty, amount, buyer, gateway, paymentMethod }) {
  const orderId = generateOrderId();
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  db.prepare(
    `INSERT INTO orders
      (order_id, product_id, qty, amount, total_payment, buyer_name, buyer_email, buyer_phone,
       gateway, payment_method, status, expired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
  ).run(
    orderId,
    productId,
    qty,
    amount,
    amount,
    buyer.name,
    buyer.email,
    buyer.phone,
    gateway,
    paymentMethod,
    expiredAt
  );

  return getOrderById(orderId);
}

/** Simpan detail pembayaran dari gateway (nomor VA / QR / URL + expired_at asli) */
function savePaymentDetail(orderId, { paymentNumber, totalPayment, expiredAt, paymentMethod }) {
  db.prepare(
    `UPDATE orders
     SET payment_number = ?, total_payment = ?, expired_at = ?, payment_method = ?
     WHERE order_id = ?`
  ).run(
    paymentNumber || '',
    totalPayment || 0,
    expiredAt || null,
    paymentMethod || '',
    orderId
  );
  return getOrderById(orderId);
}

/** Ubah status order (dipakai webhook & tombol Cek Status). Idempoten: PAID tidak ditimpa. */
function updateOrderStatus(orderId, status, paidAt) {
  const current = getOrderById(orderId);
  if (!current) return null;
  if (current.status === 'PAID') return current; // jangan timpa order yang sudah lunas

  if (status === 'PAID') {
    db.prepare(
      `UPDATE orders SET status = 'PAID', paid_at = COALESCE(?, paid_at, datetime('now')) WHERE order_id = ?`
    ).run(paidAt || null, orderId);
  } else {
    db.prepare(`UPDATE orders SET status = ? WHERE order_id = ?`).run(status, orderId);
  }
  return getOrderById(orderId);
}

module.exports = { generateOrderId, getOrderById, createOrder, savePaymentDetail, updateOrderStatus };
