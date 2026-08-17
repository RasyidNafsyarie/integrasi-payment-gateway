/**
 * Menampilkan URL publik ngrok yang sedang aktif beserta Webhook URL
 * siap-copy untuk dashboard gateway.
 * Syarat: ngrok http 3000 sedang berjalan (API lokal di 127.0.0.1:4040).
 * Jalankan: node scripts/tunnel-url.js
 */
const axios = require('axios');

(async () => {
  try {
    const res = await axios.get('http://127.0.0.1:4040/api/tunnels');
    const tunnel = res.data.tunnels.find((t) => t.public_url.startsWith('https'));
    if (!tunnel) throw new Error('Tidak ada tunnel https aktif.');

    const url = tunnel.public_url;
    console.log('✅ Tunnel aktif :', url);
    console.log('   -> diteruskan ke:', tunnel.config?.addr);
    console.log('\nWebhook URL siap-copy untuk dashboard gateway:');
    console.log('  Pakasir :', `${url}/webhook/pakasir`);
    console.log('  iPaymu  :', `${url}/webhook/ipaymu`);
    console.log('  DOKU    :', `${url}/webhook/doku`);
    console.log('\n⚠️  Jika ngrok di-restart, URL berubah — jalankan ulang skrip ini.');
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ ngrok tidak terdeteksi. Jalankan dulu: ngrok http 3000');
    } else {
      console.error('❌ Gagal mengambil info tunnel:', err.message);
    }
    process.exit(1);
  }
})();
