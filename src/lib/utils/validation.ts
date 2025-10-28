/**
 * Utilitários de validação
 * Funções para validar dados comuns no sistema
 */

/**
 * Valida email
 * @param email - Email a validar
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone português
 * @param phone - Telefone a validar (aceita vários formatos)
 */
export function validatePhone(phone: string): boolean {
  // Remove espaços e caracteres especiais
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Aceita com ou sem +351
  const phoneRegex = /^(\+351)?[29]\d{8}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Valida IBAN português
 * @param iban - IBAN a validar
 */
export function validateIBAN(iban: string): boolean {
  // Remove espaços
  const cleaned = iban.replace(/\s/g, '');
  
  // IBAN português tem 25 caracteres e começa com PT50
  if (!cleaned.startsWith('PT') || cleaned.length !== 25) {
    return false;
  }
  
  // Validação básica de formato
  const ibanRegex = /^PT\d{23}$/;
  return ibanRegex.test(cleaned);
}

/**
 * Valida NIF (Número de Identificação Fiscal) português
 * @param nif - NIF a validar
 */
export function validateNIF(nif: string): boolean {
  // Remove espaços
  const cleaned = nif.replace(/\s/g, '');
  
  // NIF deve ter 9 dígitos
  if (cleaned.length !== 9 || !/^\d+$/.test(cleaned)) {
    return false;
  }
  
  // Validação do dígito de controle
  const digits = cleaned.split('').map(Number);
  const checkDigit = digits[8];
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  
  const remainder = sum % 11;
  const calculatedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return checkDigit === calculatedCheckDigit;
}

/**
 * Valida matrícula portuguesa
 * @param plate - Matrícula a validar
 */
export function validatePlate(plate: string): boolean {
  // Remove espaços e hífens
  const cleaned = plate.replace(/[\s\-]/g, '').toUpperCase();
  
  // Formatos aceitos:
  // - Antigo: XX-XX-XX (2 letras, 2 números, 2 números)
  // - Novo: XX-XX-XX (2 números, 2 letras, 2 números)
  const oldFormat = /^[A-Z]{2}\d{2}\d{2}$/;
  const newFormat = /^\d{2}[A-Z]{2}\d{2}$/;
  
  return oldFormat.test(cleaned) || newFormat.test(cleaned);
}

/**
 * Valida senha forte
 * @param password - Senha a validar
 * @returns Objeto com resultado e mensagem
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  message?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 8 caracteres',
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra maiúscula',
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra minúscula',
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um número',
    };
  }
  
  return { isValid: true };
}

/**
 * Valida valor monetário
 * @param value - Valor a validar
 */
export function validateCurrency(value: string | number): boolean {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numValue) && numValue >= 0;
}

/**
 * Valida percentagem
 * @param value - Valor a validar (0-100)
 */
export function validatePercentage(value: string | number): boolean {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
}

/**
 * Valida data no formato YYYY-MM-DD
 * @param date - Data a validar
 */
export function validateDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    return false;
  }
  
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}


