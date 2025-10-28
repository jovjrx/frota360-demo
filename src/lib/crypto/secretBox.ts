import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production';

export function encrypt(text: string): string {
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  return encrypted;
}

export function decrypt(encryptedText: string): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptObject(obj: any): string {
  return encrypt(JSON.stringify(obj));
}

export function decryptObject<T>(encryptedText: string): T {
  const decrypted = decrypt(encryptedText);
  return JSON.parse(decrypted);
}

export function hash(text: string): string {
  return CryptoJS.SHA256(text).toString();
}

