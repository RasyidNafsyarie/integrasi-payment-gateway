/**
 * Inisialisasi database: buat tabel + seed barang contoh.
 * Jalankan: npm run db:init  (atau: node db/init.js)
 */
const db = require('./connection');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    price       INTEGER NOT NULL,           -- nominal Rupiah bulat, tanpa desimal
    description TEXT    NOT NULL DEFAULT '',
    image       TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       TEXT    NOT NULL UNIQUE,  -- ID unik dari sistem kita (mis. INV20260806-XXXXXX)
    product_id     INTEGER NOT NULL REFERENCES products(id),
    qty            INTEGER NOT NULL DEFAULT 1,
    amount         INTEGER NOT NULL,         -- total Rupiah yang harus dibayar
    buyer_name     TEXT    NOT NULL DEFAULT '',
    buyer_email    TEXT    NOT NULL DEFAULT '',
    buyer_phone    TEXT    NOT NULL DEFAULT '',
    gateway        TEXT    NOT NULL,         -- pakasir | ipaymu | doku
    payment_method TEXT    NOT NULL DEFAULT '',
    payment_number TEXT    NOT NULL DEFAULT '',-- QR string / nomor VA / payment URL dari gateway
    status         TEXT    NOT NULL DEFAULT 'PENDING', -- PENDING | PAID | FAILED | EXPIRED
    expired_at     TEXT,
    paid_at        TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`);

// Seed barang hanya jika tabel masih kosong
const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)'
  );
  const seeds = [
    ['Kaos Polos Premium', 75000, 'Kaos katun combed 30s, jahitan rapi, berbagai ukuran.', 'https://picsum.photos/seed/kaos/400/300'],
    ['Tumbler Stainless 500ml', 120000, 'Menjaga suhu panas/dingin hingga 6 jam.', 'https://picsum.photos/seed/tumbler/400/300'],
    ['Notebook A5 Dotted', 45000, 'Isi 100 halaman kertas 100gsm, cocok untuk journaling.', 'https://picsum.photos/seed/notebook/400/300'],
    ['Tote Bag Kanvas', 65000, 'Bahan kanvas tebal, sablon premium, muat laptop 14".', 'https://picsum.photos/seed/totebag/400/300'],
    ['Stiker Pack Isi 10', 25000, 'Stiker vinyl waterproof untuk laptop dan botol minum.', 'https://picsum.photos/seed/stiker/400/300'],
  ];
  const seedAll = db.transaction((rows) => {
    for (const [name, price, description, image] of rows) {
      insert.run(name, price, description, image);
    }
  });
  seedAll(seeds);
  console.log(`Seed ${seeds.length} produk berhasil.`);
} else {
  console.log(`Tabel products sudah berisi ${count} produk, seed dilewati.`);
}

console.log('Inisialisasi database selesai.');
