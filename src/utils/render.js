/**
 * Helper render EJS: halaman (body) dirender dulu,
 * lalu disisipkan ke views/layout.ejs melalui variabel `body`.
 */
const path = require('path');
const ejs = require('ejs');

const viewsDir = path.join(__dirname, '..', '..', 'views');

async function renderWithLayout(res, page, data = {}) {
  try {
    const body = await ejs.renderFile(path.join(viewsDir, `${page}.ejs`), data);
    const html = await ejs.renderFile(path.join(viewsDir, 'layout.ejs'), { ...data, body });
    res.type('html').send(html);
  } catch (err) {
    console.error('Gagal render halaman:', err);
    res.status(500).send('Terjadi kesalahan saat merender halaman.');
  }
}

module.exports = { renderWithLayout };
