/**
 * @fileoverview Utility for generating unique reference numbers.
 */
const crypto = require('crypto');

/**
 * Generates a highly unique order reference number to prevent collisions.
 * The format is LNB + base36 timestamp + 8 random hex characters.
 * This provides a high degree of randomness and is tied to the creation time.
 * Example: LNB-LKO4B2E-A1B2C3D4
 * @returns {string} A unique reference number.
 */
const generateReferenceNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `LNB-${timestamp}-${random}`;
};

module.exports = { generateReferenceNumber };
