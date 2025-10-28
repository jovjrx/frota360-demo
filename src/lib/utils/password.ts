const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%^&*';

const DEFAULT_LENGTH = 12;

/**
 * Generate a secure temporary password mixing upper/lower case, numbers and special chars.
 */
export function generateTemporaryPassword(length: number = DEFAULT_LENGTH): string {
  const allChars = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SPECIAL}`;
  if (length < 8) {
    throw new Error('Temporary password length must be at least 8 characters.');
  }

  let password = '';
  password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
  password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
  password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  password += SPECIAL[Math.floor(Math.random() * SPECIAL.length)];

  for (let i = password.length; i < length; i += 1) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

