import { supabase } from '../lib/supabase';

// Shrinks a photo before uploading, so it loads fast for customers and uses less storage.
export function compressImage(file, maxSize = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not read that photo.'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that photo. Try another one.'));
    };
    img.src = url;
  });
}

// Uploads into a folder named after the user, which the storage rules require.
export async function uploadImage(bucket, userId, file) {
  const blob = await compressImage(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error('Could not upload the photo. Please try again.');
  return path;
}

export function publicUrl(bucket, path) {
  if (!path) return '';
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024;

// Uploads a permit or document to a private bucket. Photos are shrunk; PDF scans are uploaded as they are.
export async function uploadDocument(bucket, userId, file, prefix = 'doc') {
  const isPdf = file.type === 'application/pdf';
  if (!isPdf && !file.type.startsWith('image/')) throw new Error('Upload a photo or a PDF file.');
  if (isPdf && file.size > MAX_PDF_BYTES) throw new Error('That PDF is too large. Use one under 10 MB.');

  const body = isPdf ? file : await compressImage(file, 1800, 0.85);
  const path = `${userId}/${prefix}-${crypto.randomUUID()}.${isPdf ? 'pdf' : 'jpg'}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType: isPdf ? 'application/pdf' : 'image/jpeg' });
  if (error) throw new Error('Could not upload the file. Check your connection and try again.');
  return path;
}