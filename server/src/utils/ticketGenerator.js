import crypto from 'crypto';

/**
 * Generates a unique, human-readable ticket ID like FMC-2026-A8F2
 */
export const generateTicketId = () => {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  const timestampShort = Date.now().toString().slice(-4);
  return `FMC-${year}-${randomHex}${timestampShort}`;
};
