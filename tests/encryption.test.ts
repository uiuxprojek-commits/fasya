import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret, decryptSecret, maskSecret } from '../src/lib/security/encryption';

// Set temporary encryption key for unit testing
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

test('AES-256-GCM encryption and decryption round-trip succeeds', () => {
  const secretKey = 'sk-proj-super_secret_ai_provider_key_1234567890';
  const encrypted = encryptSecret(secretKey);

  assert.ok(encrypted.ciphertext);
  assert.ok(encrypted.iv);
  assert.ok(encrypted.tag);

  const decrypted = decryptSecret(encrypted);
  assert.equal(decrypted, secretKey);
});

test('AES-256-GCM rejects tampered ciphertext or corrupted auth tag', () => {
  const secretKey = 'sk-proj-test-key';
  const encrypted = encryptSecret(secretKey);

  // Corrupt tag
  const tamperedTag = {
    ...encrypted,
    tag: Buffer.from('corruptedtag1234').toString('base64'),
  };

  assert.throws(() => {
    decryptSecret(tamperedTag);
  });
});

test('maskSecret correctly redacts confidential keys for Admin display', () => {
  assert.equal(maskSecret('AIzaSyABCD1234WXYZ'), 'AIza••••••••WXYZ');
  assert.equal(maskSecret(null), 'Belum dikonfigurasi');
  assert.equal(maskSecret('short'), '••••••••');
});
