import crypto from 'crypto';

export const signature = (rec: { vin?: string | null; title?: string | null; price?: number | null; phone?: string | null }) =>
  crypto.createHash('sha256').update(JSON.stringify({
    vin: rec.vin?.trim() || null,
    t: rec.title?.toLowerCase().replace(/\s+/g, ' ') || null,
    p: rec.price ?? null,
    ph: rec.phone?.replace(/\D/g, '') || null
  })).digest('hex');
