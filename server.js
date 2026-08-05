/**
 * Entry point server — Payment Gateway Playground.
 * Tech stack sesuai PRD §6.1: Express + EJS + SQLite (better-sqlite3) + dotenv.
 */
require('dotenv').config();

const express = require('express');
const { renderWithLayout } = require('./src/utils/render');

const pagesRouter = require('./src/routes/pages');
const checkoutRouter = require('./src/routes/checkout');
const webhooksRouter = require('./src/routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3000;

// Parsing body (JSON untuk webhook, urlencoded untuk form HTML)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', pagesRouter);
app.use('/', checkoutRouter);
app.use('/webhook', webhooksRouter);

// 404
app.use((req, res) => {
  renderWithLayout(res, 'result', {
    title: 'Halaman Tidak Ditemukan',
    status: 'FAILED',
    message: 'URL yang kamu tuju tidak tersedia.',
    order: null,
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
