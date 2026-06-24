/**
 * Formats a given number into Kwanza (AOA) currency layout.
 */
export function formatKwanza(amount: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a given number into USD currency layout.
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

/**
 * Encodes mock or real Google Meet links dynamic generator.
 */
export function createMeetingUrl(eventId: string): string {
  const hash = eventId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 9);
  const chunk1 = hash.slice(0, 3);
  const chunk2 = hash.slice(3, 6);
  const chunk3 = hash.slice(6, 9) || 'mtp';
  return `https://meet.google.com/${chunk1}-${chunk2}-${chunk3}`;
}

/**
 * Cryptographic or unique signature verifier mockup helper.
 */
export function generateCertificateUuid(): string {
  return 'MTP-CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}
