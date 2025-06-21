/**
 * Formats a phone number to the Safaricom-required format (254XXXXXXXXX).
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string|null} - The formatted phone number or null if invalid.
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // Case 1: Starts with '254' and has 12 digits (e.g., 254712345678)
  if (digitsOnly.startsWith('254') && digitsOnly.length === 12) {
    return digitsOnly;
  }

  // Case 2: Starts with '07' or '01' and has 10 digits (e.g., 0712345678)
  if ((digitsOnly.startsWith('07') || digitsOnly.startsWith('01')) && digitsOnly.length === 10) {
    return `254${digitsOnly.substring(1)}`;
  }

  // Case 3: Starts with '7' or '1' and has 9 digits (e.g., 712345678)
  if ((digitsOnly.startsWith('7') || digitsOnly.startsWith('1')) && digitsOnly.length === 9) {
    return `254${digitsOnly}`;
  }

  // Return null if the format is not recognized
  return null;
};

module.exports = { formatPhoneNumber };
