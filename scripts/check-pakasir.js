/**
 * Uji ringan kredensial Pakasir (FASE 1.4).
 * Alur: buat transaksi QRIS kecil di mode sandbox → batalkan lagi.
 * Jalankan: node scripts/check-pakasir.js
 */
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.PAKASIR_BASE_URL || 'https://app.pakasir.com';
const project = process.env.PAKASIR_SLUG;
const apiKey = process.env.PAKASIR_API_KEY;

if (!project || !apiKey) {
  console.error('❌ PAKASIR_SLUG atau PAKASIR_API_KEY belum diisi di .env');
  process.exit(1);
}

const orderId = `TEST${Date.now()}`;
const payload = { project, order_id: orderId, amount: 10000, api_key: apiKey };

(async () => {
  try {
    // 1. Buat transaksi uji (sandbox)
    const create = await axios.post(`${BASE_URL}/api/transactioncreate/qris`, payload);
    const payment = create.data?.payment;
    if (!payment) throw new Error(`Response tidak sesuai: ${JSON.stringify(create.data)}`);
    console.log('✅ Kredensial VALID — transaksi uji berhasil dibuat.');
    console.log(`   order_id      : ${payment.order_id}`);
    console.log(`   total_payment : Rp ${Number(payment.total_payment).toLocaleString('id-ID')}`);
    console.log(`   payment_method: ${payment.payment_method}`);
    console.log(`   expired_at    : ${payment.expired_at}`);
    console.log(`   QR string     : ${String(payment.payment_number).slice(0, 40)}...`);

    // 2. Batalkan transaksi uji agar tidak menggantung
    const cancel = await axios.post(`${BASE_URL}/api/transactioncancel`, payload);
    console.log('🧹 Transaksi uji dibatalkan:', JSON.stringify(cancel.data));
    console.log('\n🎉 FASE 1.4 selesai — Pakasir siap untuk FASE 2.');
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('❌ Uji kredensial gagal:', JSON.stringify(detail, null, 2));
    console.error('   Periksa kembali PAKASIR_SLUG, PAKASIR_API_KEY, dan mode proyek.');
    process.exit(1);
  }
})();
