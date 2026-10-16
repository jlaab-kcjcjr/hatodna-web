import jsQR from 'jsqr';

// Reads a QR code from a photo or screenshot and returns its text, or null if none was found.
// Tries a few sizes because big phone photos and tiny screenshots both trip up QR readers.
export async function readQrFromImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not open that image. Try another screenshot.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    for (const maxSide of [1000, 1600, 700, 2200]) {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      if (code?.data) return code.data.trim();
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// QR Ph (EMVCo) text is a chain of: 2-digit tag, 2-digit length, value.
function parseTlv(text) {
  const fields = {};
  let i = 0;
  while (i < text.length) {
    if (i + 4 > text.length) return null;
    const tag = text.slice(i, i + 2);
    const len = Number(text.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(text.slice(i + 2, i + 4))) return null;
    const value = text.slice(i + 4, i + 4 + len);
    if (value.length !== len) return null;
    fields[tag] = value;
    i += 4 + len;
  }
  return fields;
}

// CRC-16/CCITT-FALSE: the checksum at the end of every QR Ph code.
function crc16(text) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i += 1) {
    crc ^= text.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Checks that the text is a real QR Ph code and pulls out what we show the merchant.
// Returns { ok: true, name, provider } or { ok: false, reason }.
export function parseQrPh(text) {
  if (!text || !text.startsWith('000201')) {
    return { ok: false, reason: "That QR isn't a GCash or Maya payment QR. Use the QR from your app's Receive or QR page." };
  }
  if (text.length > 512) return { ok: false, reason: 'That QR is too long to be a payment QR.' };
  const fields = parseTlv(text);
  if (!fields || !fields['63']) return { ok: false, reason: "We couldn't read that QR completely. Try a clearer screenshot." };
  if (crc16(text.slice(0, -4)) !== fields['63'].toUpperCase()) {
    return { ok: false, reason: 'That QR looks damaged. Take a new screenshot from your app and try again.' };
  }
  if (fields['58'] && fields['58'] !== 'PH') {
    return { ok: false, reason: 'That QR is not a Philippine payment QR.' };
  }
  const upper = text.toUpperCase();
  const provider = upper.includes('GXCH') ? 'gcash' : upper.includes('PAPH') ? 'maya' : null;
  return { ok: true, name: (fields['59'] || '').trim(), provider };
}