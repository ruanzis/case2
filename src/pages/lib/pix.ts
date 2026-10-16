import { createHash } from 'crypto';

export async function generatePix(amount: number, description: string, meta: any) {
  const merchantKey = process.env.PIX_MERCHANT_KEY!;
  const now = new Date();
  const payload = {
    amount,
    description,
    meta,
    txid: `${now.getTime()}`,
  };
  const json = JSON.stringify({ ...payload, timestamp: now.toISOString() });

  const res = await fetch(`${process.env.PIX_API_URL}/cob`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PIX_API_TOKEN}`,
    },
    body: json,
  });
  const data = await res.json();
  return { code: data.pixCopiaECola, qr: data.qrCodeImage, id: data.id };
}

export function verifyPixSignature(req: any): boolean {
  const raw = JSON.stringify(req.body);
  const hmac = createHash('sha256');
  const expected = hmac.update(raw + process.env.PIX_WEBHOOK_SECRET).digest('hex');
  return req.headers['x-signature'] === expected;
}
