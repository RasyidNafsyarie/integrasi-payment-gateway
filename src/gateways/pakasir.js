/**
 * Modul integrasi PAKASIR.
 * Diimplementasikan pada TASKLIST-PAKASIR.md FASE 2.1.
 *
 * Kontrak modul gateway (PRD §6.2):
 * - createPayment(order, method) → { paymentNumber, totalPayment, fee, expiredAt, paymentMethod, raw }
 * - checkStatus(order)           → { status, raw }
 * - cancelPayment(order)         → { raw }
 * - verifyWebhook(payload)       → boolean
 * - mapStatus(gatewayStatus)     → PAID | PENDING | FAILED | EXPIRED
 */
const axios = require('axios');

const BASE_URL = process.env.PAKASIR_BASE_URL || 'https://app.pakasir.com';
const project = process.env.PAKASIR_SLUG;
const apiKey = process.env.PAKASIR_API_KEY;

if (!project || !apiKey) {
  console.error(
    '⚠️  PAKASIR_SLUG / PAKASIR_API_KEY belum diisi di .env — modul Pakasir tidak dapat dipakai.'
  );
}

/** Field yang wajib ada di setiap request API Pakasir */
function authBody(extra = {}) {
  return { project, api_key: apiKey, ...extra };
}

/**
 * Buat pembayaran baru di Pakasir.
 * POST /api/transactioncreate/{method}
 * `method`: qris | bni_va | bri_va | cimb_niaga_va | permata_va | ...
 * Response menyimpan payment_number (QR/VA), total_payment (amount + fee), expired_at.
 */
async function createPayment(order, method = 'qris') {
  const { data } = await axios.post(
    `${BASE_URL}/api/transactioncreate/${method}`,
    authBody({ order_id: order.order_id, amount: order.amount })
  );
  const payment = data?.payment;
  if (!payment) {
    throw new Error(`Response Pakasir tidak sesuai: ${JSON.stringify(data)}`);
  }
  return {
    paymentNumber: payment.payment_number || '',
    totalPayment: Number(payment.total_payment),
    fee: Number(payment.fee) || 0,
    expiredAt: payment.expired_at || '',
    paymentMethod: payment.payment_method || method,
    raw: data,
  };
}

/** Fallback: URL bayar hosted Pakasir tanpa panggil API create */
function buildPaymentUrl(order, opts = {}) {
  let url =
    `${BASE_URL}/pay/${project}/${order.amount}` +
    `?order_id=${encodeURIComponent(order.order_id)}`;
  if (opts.redirect) url += `&redirect=${encodeURIComponent(opts.redirect)}`;
  if (opts.qrisOnly) url += '&qris_only=1';
  return url;
}

/** Cek status transaksi via GET /api/transactiondetail */
async function checkStatus(order) {
  const { data } = await axios.get(`${BASE_URL}/api/transactiondetail`, {
    params: authBody({ amount: order.amount, order_id: order.order_id }),
  });
  return { status: data?.transaction?.status || '', raw: data };
}

/** Batalkan transaksi yang masih PENDING */
async function cancelPayment(order) {
  const { data } = await axios.post(
    `${BASE_URL}/api/transactioncancel`,
    authBody({ order_id: order.order_id, amount: order.amount })
  );
  return { raw: data };
}

/**
 * Validasi dasar payload webhook Pakasir.
 * Pakasir tidak mengirim signature — validasi penuh (order ada + nominal cocok +
 * konfirmasi ulang API) dilakukan di handler webhook (FASE 2.3).
 */
function verifyWebhook(payload = {}) {
  return Boolean(
    payload && payload.order_id && Number.isFinite(Number(payload.amount))
  );
}

const STATUS_MAP = {
  completed: 'PAID',
  paid: 'PAID',
  success: 'PAID',
  pending: 'PENDING',
  unpaid: 'PENDING',
  failed: 'FAILED',
  canceled: 'FAILED',
  cancelled: 'FAILED',
  expired: 'EXPIRED',
};

/** Petakan status mentah Pakasir ke status internal (PAID/PENDING/FAILED/EXPIRED) */
function mapStatus(gatewayStatus) {
  return STATUS_MAP[String(gatewayStatus || '').toLowerCase()] || 'PENDING';
}

module.exports = {
  createPayment,
  buildPaymentUrl,
  checkStatus,
  cancelPayment,
  verifyWebhook,
  mapStatus,
};
