/**
 * Edge-compatible password utilities
 * Uses Web Crypto API instead of bcrypt for Edge compatibility
 */

/**
 * Compares a password with a hashed value using PBKDF2
 * This is an Edge-compatible alternative to bcrypt
 */
export async function compare(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Parse the stored hash
    const [salt, key] = hashedPassword.split(":");

    // Convert to proper formats for Web Crypto API
    const saltBuffer = Buffer.from(salt, "hex");
    const storedKey = Buffer.from(key, "hex");

    // Import the password as a CryptoKey
    const importedKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      256
    );

    // Convert to buffer for comparison
    const derivedKey = Buffer.from(derivedBits);

    // Constant-time comparison
    return timingSafeEqual(derivedKey, storedKey);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

/**
 * Performs a constant-time comparison of two buffers
 * to prevent timing attacks
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * Hashes a password using PBKDF2
 * Edge-compatible alternative to bcrypt
 */
export async function hash(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import the password as a CryptoKey
  const importedKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedKey,
    256
  );

  // Convert to hex strings for storage
  const saltHex = Buffer.from(salt).toString("hex");
  const keyHex = Buffer.from(derivedBits).toString("hex");

  // Return combined salt:key
  return `${saltHex}:${keyHex}`;
}
