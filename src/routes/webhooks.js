/**
 * Route webhook payment gateway.
 * Endpoint diimplementasikan per gateway pada FASE 2 masing-masing tasklist:
 * - POST /webhook/pakasir  → TASKLIST-PAKASIR.md §2.3
 * - POST /webhook/ipaymu   → TASKLIST-IPAYMU.md §2.2
 * - POST /webhook/doku     → TASKLIST-DOKU.md §2.2
 *
 * Prinsip umum (PRD F-18, F-19):
 * - Balas cepat HTTP 200.
 * - Validasi order_id & amount, konfirmasi ulang via API status gateway.
 * - Idempoten: webhook duplikat tidak mengubah status lebih dari sekali.
 */
const express = require('express');

const router = express.Router();

module.exports = router;
