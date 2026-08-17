/**
 * Tes alur FASE 2.2 end-to-end dengan axios di-mock (tanpa kredensial asli).
 * Jalankan: node scripts/smoke-test-flow.js
 */
require('dotenv').config();
process.env.PAKASIR_SLUG = 'tokosaya';
process.env.PAKASIR_API_KEY = 'test-key';

const axios = require('axios');
const qrcode = require('qrcode');

// --- Mock axios sebelum modul gateway & routes dimuat ---
axios.post = async (url, payload) => {
  if (url.includes('/api/transactioncancel')) return { data: { success: true } };
  const method = url.match(/transactioncreate\/(\w+)$/)[1];
  return {
    data: {
      payment: {
        order_id: payload.order_id,
        payment_number: '0002010102112662' + 'TESTQR' + method,
        total_payment: payload.amount + 750,
        fee: 750,
        payment_method: method,
        expired_at: '2026-08-16 15:00:00',
      },
    },
  };
};
axios.get = async () => ({ data: { transaction: { status: 'completed' } } });

// --- Muat app setelah mock ---
const express = require('express');
const { renderWithLayout } = require('../src/utils/render');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', require('../src/routes/pages'));
app.use('/', require('../src/routes/checkout'));
app.use('/webhook', require('../src/routes/webhooks'));

const db = require('../db/connection');

(async () => {
  try {
    // 1. POST /checkout → harus redirect 302 ke /pay/:orderId
    const form = new URLSearchParams({
      product_id: '1', qty: '2', buyer_name: 'Test', buyer_email: 't@t.com',
      buyer_phone: '0812', gateway: 'pakasir', payment_method: 'qris',
    }).toString();
    const server = app.listen(0, async () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      const r = await fetch(base + '/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
        redirect: 'manual',
      });
      const loc = r.headers.get('location') || '';
      const orderId = loc.split('/').pop();
      if (r.status !== 302 || !loc.startsWith('/pay/')) throw new Error('Redirect tidak sesuai: ' + r.status + ' ' + loc);
      console.log('✅ POST /checkout →', loc, r.status);

      // 2. GET /pay/:orderId → halaman waiting dengan QR
      const pay = await fetch(base + loc);
      const html = await pay.text();
      if (!html.includes('Menunggu Pembayaran') || !html.includes('/qr/')) throw new Error('Halaman waiting kurang lengkap');
      console.log('✅ GET /pay/:orderId → waiting page OK');

      // 3. GET /qr/:orderId → PNG
      const qr = await fetch(base + `/qr/${orderId}`);
      const buf = Buffer.from(await qr.arrayBuffer());
      if (qr.headers.get('content-type') !== 'image/png' || buf.length < 100) throw new Error('QR PNG tidak valid');
      console.log('✅ GET /qr/:orderId → PNG OK (' + buf.length + ' bytes)');

      // 4. GET /pay/:orderId?action=refresh → status jadi PAID (mock completed)
      const ref = await fetch(base + `/pay/${orderId}?action=refresh`);
      const refHtml = await ref.text();
      if (!refHtml.includes('PAID')) throw new Error('Status tidak berubah jadi PAID');
      console.log('✅ action=refresh → order PAID OK');

      // 5. Order di DB benar-benar PAID
      const row = db.prepare('SELECT status, paid_at FROM orders WHERE order_id = ?').get(orderId);
      if (row.status !== 'PAID' || !row.paid_at) throw new Error('DB status tidak PAID');
      console.log('✅ DB tersimpan PAID + paid_at OK');

      console.log('\n🎉 Tes alur FASE 2.2 lulus.');
      server.close();
    });
  } catch (err) {
    console.error('❌ Tes gagal:', err.message);
    process.exitCode = 1;
  }
})();
