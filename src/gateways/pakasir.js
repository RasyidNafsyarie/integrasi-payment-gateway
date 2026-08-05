/**
 * Modul integrasi PAKASIR.
 * Diimplementasikan pada TASKLIST-PAKASIR.md FASE 2.1.
 *
 * Kontrak modul gateway (PRD §6.2):
 * - createPayment(order, method) → { paymentUrl | qrCode | vaNumber, expiredAt }
 * - checkStatus(orderId)         → { status, raw }
 * - verifyWebhook(payload, req)  → boolean
 * - mapStatus(gatewayStatus)     → PAID | PENDING | FAILED | EXPIRED
 */
module.exports = {};
