/**
 * Smoke test ringan modul src/gateways/pakasir.js (FASE 2.1).
 * Tanpa kredensial asli — request API di-mock agar tidak menyentuh server Pakasir.
 * Jalankan: node scripts/smoke-test-pakasir.js
 */
process.env.PAKASIR_SLUG = 'tokosaya';
process.env.PAKASIR_API_KEY = 'test-key';

const assert = require('assert');
const axios = require('axios');
const pakasir = require('../src/gateways/pakasir');

const order = { order_id: 'INV20260816-ABC123', amount: 25000 };

function mockPost(url, payload) {
  const m = url.match(/transactioncreate\/(\w+)$/);
  const method = m ? m[1] : 'cancel';
  return Promise.resolve({
    data: {
      payment: {
        order_id: payload.order_id,
        payment_number: '0002010102112662...',
        total_payment: 25750,
        fee: 750,
        payment_method: method === 'qris' ? 'qris' : 'bni_va',
        expired_at: '2026-08-16 15:00:00',
      },
    },
  });
}

// Mock axios untuk POST create/cancel & GET detail
const realPost = axios.post;
const realGet = axios.get;
axios.post = async (url, payload) => {
  if (url.includes('/api/transactioncancel')) {
    return Promise.resolve({ data: { success: true } });
  }
  return mockPost(url, payload);
};
axios.get = async () =>
  Promise.resolve({ data: { transaction: { status: 'completed' } } });

(async () => {
  try {
    // 1. createPayment QRIS
    const created = await pakasir.createPayment(order, 'qris');
    assert.strictEqual(created.paymentNumber, '0002010102112662...');
    assert.strictEqual(created.totalPayment, 25750);
    assert.strictEqual(created.fee, 750);
    assert.strictEqual(created.paymentMethod, 'qris');
    console.log('✅ createPayment(qris) OK:', JSON.stringify(created));

    // 2. buildPaymentUrl
    const url = pakasir.buildPaymentUrl(order, { redirect: 'http://localhost:3000/result/x', qrisOnly: true });
    assert.ok(url.includes(`/pay/tokosaya/25000?order_id=${order.order_id}`));
    assert.ok(url.includes('&redirect='));
    assert.ok(url.includes('&qris_only=1'));
    console.log('✅ buildPaymentUrl OK:', url);

    // 3. checkStatus
    const st = await pakasir.checkStatus(order);
    assert.strictEqual(st.status, 'completed');
    console.log('✅ checkStatus OK:', st.status);

    // 4. cancelPayment
    const cancelled = await pakasir.cancelPayment(order);
    assert.ok(cancelled.raw.success);
    console.log('✅ cancelPayment OK');

    // 5. verifyWebhook & mapStatus
    assert.ok(pakasir.verifyWebhook({ order_id: 'X', amount: '25000' }));
    assert.ok(!pakasir.verifyWebhook({ amount: 25000 }));
    assert.strictEqual(pakasir.mapStatus('completed'), 'PAID');
    assert.strictEqual(pakasir.mapStatus('EXPIRED'), 'EXPIRED');
    assert.strictEqual(pakasir.mapStatus('gibberish'), 'PENDING');
    console.log('✅ verifyWebhook & mapStatus OK');

    console.log('\n🎉 Semua tes FASE 2.1 lulus.');
  } catch (err) {
    console.error('❌ Tes gagal:', err.message);
    process.exitCode = 1;
  } finally {
    axios.post = realPost;
    axios.get = realGet;
  }
})();
