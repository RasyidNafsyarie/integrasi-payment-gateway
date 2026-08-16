/**
 * Tes webhook Pakasir (FASE 2.3) end-to-end dengan axios di-mock.
 * Jalankan: node scripts/smoke-test-webhook.js
 */
require('dotenv').config();
process.env.PAKASIR_SLUG = 'tokosaya';
process.env.PAKASIR_API_KEY = 'test-key';

const axios = require('axios');
// Mock GET transactiondetail → status "completed"
axios.get = async () => ({ data: { transaction: { status: 'completed' } } });

const express = require('express');
const app = express();
app.use(express.json());
app.use('/webhook', require('../src/routes/webhooks'));

const db = require('../db/connection');
const { createOrder } = require('../src/services/order');

function makeOrder(over = {}) {
  return createOrder({
    productId: 1,
    qty: 1,
    amount: 75000,
    buyer: { name: 'T', email: 't@t.com', phone: '0812' },
    gateway: 'pakasir',
    paymentMethod: 'qris',
    ...over,
  });
}

(async () => {
  try {
    const server = app.listen(0, async () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      const post = (body) =>
        fetch(base + '/webhook/pakasir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

      // 1. Webhook valid → order PAID
      const o1 = makeOrder();
      let r = await post({ order_id: o1.order_id, amount: 75000, status: 'completed', completed_at: '2026-08-16T08:07:02.819+07:00' });
      if (r.status !== 200) throw new Error('Webhook valid tidak dibalas 200');
      await new Promise((res) => setTimeout(res, 300)); // tunggu proses async
      const d1 = db.prepare('SELECT status, paid_at FROM orders WHERE order_id = ?').get(o1.order_id);
      if (d1.status !== 'PAID' || !d1.paid_at) throw new Error('Order tidak jadi PAID setelah webhook valid');
      console.log('✅ Webhook valid → PAID OK', d1);

      // 2. Duplikat → tetap PAID, tidak error (idempoten)
      r = await post({ order_id: o1.order_id, amount: 75000, status: 'completed' });
      await new Promise((res) => setTimeout(res, 300));
      const d2 = db.prepare('SELECT status FROM orders WHERE order_id = ?').get(o1.order_id);
      if (d2.status !== 'PAID') throw new Error('Duplikat webhook mengubah status');
      console.log('✅ Webhook duplikat diabaikan (idempoten) OK');

      // 3. Nominal tidak cocok → order tetap PENDING
      const o3 = makeOrder();
      await post({ order_id: o3.order_id, amount: 999, status: 'completed' });
      await new Promise((res) => setTimeout(res, 300));
      const d3 = db.prepare('SELECT status FROM orders WHERE order_id = ?').get(o3.order_id);
      if (d3.status !== 'PENDING') throw new Error('Webhook nominal salah mengubah status');
      console.log('✅ Webhook nominal salah ditolak OK');

      // 4. Order tidak dikenal → aman diabaikan
      await post({ order_id: 'INV-TIDAK-ADA', amount: 75000, status: 'completed' });
      console.log('✅ Webhook order tidak dikenal diabaikan OK');

      server.close();
      console.log('\n🎉 Tes webhook FASE 2.3 lulus.');
    });
  } catch (err) {
    console.error('❌ Tes gagal:', err.message);
    process.exitCode = 1;
  }
})();
