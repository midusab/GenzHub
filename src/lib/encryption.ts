import CryptoJS from 'crypto-js';

// In a real production app, this secret would be dynamically generated 
// or derived from a secure key exchange (Diffie-Hellman).
// For the GenZHub platform, we use a site-wide encryption salt.
const PLATFORM_SECRET = 'genzhub_secure_salt_2026';

/**
 * Encrypts a plain text message using AES-256.
 * @param text The plain text message to encrypt.
 * @param roomId Optional room ID to make the encryption unique to a specific chat.
 */
export const encryptMessage = (text: string, roomId: string = 'global'): string => {
  try {
    const key = PLATFORM_SECRET + roomId;
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback to plain text if encryption fails
  }
};

/**
 * Decrypts a cipher text message using AES-256.
 * @param cipherText The encrypted message to decrypt.
 * @param roomId Optional room ID to make the decryption unique to a specific chat.
 */
export const decryptMessage = (cipherText: string, roomId: string = 'global'): string => {
  try {
    const key = PLATFORM_SECRET + roomId;
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption results in empty string, it might not have been encrypted
    return decryptedText || cipherText;
  } catch (error) {
    // If it's not a valid cipher text, return the original text
    return cipherText;
  }
};
