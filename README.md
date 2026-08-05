# Payment Gateway Playground

Website percobaan (proof of concept) **checkout multi payment gateway Indonesia**:
**Pakasir**, **iPaymu**, dan **DOKU** — dari tahap sandbox hingga **real payment**.
Website menampilkan dashboard barang sederhana, halaman checkout, lalu pembayaran
melalui halaman/QRIS/VA dari gateway yang dipilih.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Runtime | Node.js 20+ |
| Backend | Express.js |
| Template | EJS (server-side rendering) |
| Database | SQLite (`better-sqlite3`) |
| Lainnya | `dotenv`, `axios`, `qrcode`, `nodemon` (dev) |

---

## 📦 Cara Menjalankan (Setelah Clone)

### 1. Prasyarat

- **Node.js 20+** — cek dengan `node -v`
- (Opsional untuk uji webhook) **ngrok** atau **cloudflared**

### 2. Clone & Instal Dependensi

```bash
git clone <url-repo-kamu>
cd payment-gateway
npm install
```

### 3. Konfigurasi Environment

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Buka `.env`, lalu isi kredensial gateway sesuai mode yang dipakai
(lihat tabel [Variabel Environment](#variabel-environment) dan TASKLIST masing-masing gateway).

### 4. Inisialisasi Database

```bash
npm run db:init
```

Perintah ini membuat file `data/app.sqlite` beserta tabel `products` & `orders`
dan mengisi 5 produk contoh.

### 5. Jalankan Server

```bash
# mode development (auto-restart)
npm run dev

# mode production
npm start
```

Buka **http://localhost:3000** → dashboard barang tampil.

---

## 🧪 Uji Coba Webhook (Pengembangan Lokal)

Webhook dari payment gateway membutuhkan URL publik. Saat masih lokal, gunakan tunnel:

```bash
ngrok http 3000
# atau
cloudflared tunnel --url http://localhost:3000
```

Salin URL HTTPS dari tunnel untuk diisi sebagai Webhook/Notify URL di dashboard gateway,
contoh: `https://<subdomain>.ngrok-free.app/webhook/pakasir`.

---

## 🔐 Variabel Environment

| Variabel | Deskripsi |
|----------|-----------|
| `PORT` | Port server (default `3000`) |
| `APP_URL` | URL publik aplikasi (untuk redirect/callback) |
| `PAKASIR_MODE` | `sandbox` \| `production` |
| `PAKASIR_SLUG` | Slug proyek Pakasir |
| `PAKASIR_API_KEY` | API Key proyek Pakasir |
| `PAKASIR_BASE_URL` | `https://app.pakasir.com` |
| `IPAYMU_MODE` | `sandbox` \| `production` |
| `IPAYMU_BASE_URL` | Sandbox `https://sandbox.ipaymu.com` · Live `https://my.ipaymu.com` |
| `IPAYMU_VA` | Nomor VA akun iPaymu |
| `IPAYMU_API_KEY` | API Key akun iPaymu |
| `DOKU_MODE` | `sandbox` \| `production` |
| `DOKU_BASE_URL` | Sandbox `https://api-sandbox.doku.com` · Live `https://api.doku.com` |
| `DOKU_CLIENT_ID` | Client ID akun DOKU |
| `DOKU_SECRET_KEY` | Secret Key akun DOKU |

> ⚠️ **Keamanan:** `.env` sudah di-ignore oleh Git. Jangan pernah meng-commit
> kredensial asli. Simpan rahasia di secret manager bila di-production.

---

## 📁 Struktur Proyek

```
payment-gateway/
├── server.js                 # entry point Express
├── db/
│   ├── connection.js         # koneksi better-sqlite3
│   └── init.js               # buat tabel + seed barang
├── src/
│   ├── routes/
│   │   ├── pages.js          # dashboard, checkout, pay, result
│   │   ├── checkout.js       # POST checkout (pembuatan order)
│   │   └── webhooks.js       # /webhook/pakasir, /webhook/ipaymu, /webhook/doku
│   ├── gateways/
│   │   ├── pakasir.js        # modul integrasi Pakasir (FASE 2)
│   │   ├── ipaymu.js         # modul integrasi iPaymu (belum)
│   │   └── doku.js           # modul integrasi DOKU (belum)
│   ├── services/order.js     # manajemen order & status
│   └── utils/render.js       # helper render EJS + layout
└── views/                    # template EJS
    ├── layout.ejs
    ├── dashboard.ejs
    ├── checkout.ejs
    ├── waiting.ejs           # menunggu pembayaran (QR/VA)
    └── result.ejs            # hasil pembayaran
```

## ⚠️ Catatan Penting

- iPaymu **production** mensyaratkan **IP statis** & **domain tervalidasi**.
- DOKU & iPaymu production memerlukan **verifikasi bisnis (KYC)** yang butuh waktu beberapa hari.
- Selalu konfirmasi ulang status transaksi via API gateway saat menerima webhook —
  jangan percaya isi webhook mentah.
