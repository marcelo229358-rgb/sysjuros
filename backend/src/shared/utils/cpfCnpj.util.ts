export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

function calcularDigitoCpf(digits: number[], pesoInicial: number): number {
  const soma = digits.reduce((acc, digit, index) => acc + digit * (pesoInicial - index), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(cpf: string): boolean {
  const digits = apenasDigitos(cpf).split('').map(Number);

  if (digits.length !== 11 || digits.some(Number.isNaN)) {
    return false;
  }

  if (new Set(digits).size === 1) {
    return false;
  }

  const digito1 = calcularDigitoCpf(digits.slice(0, 9), 10);
  const digito2 = calcularDigitoCpf(digits.slice(0, 10), 11);

  return digits[9] === digito1 && digits[10] === digito2;
}

function calcularDigitoCnpj(digits: number[], pesos: number[]): number {
  const soma = digits.reduce((acc, digit, index) => acc + digit * pesos[index], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCnpj(cnpj: string): boolean {
  const digits = apenasDigitos(cnpj).split('').map(Number);

  if (digits.length !== 14 || digits.some(Number.isNaN)) {
    return false;
  }

  if (new Set(digits).size === 1) {
    return false;
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigitoCnpj(digits.slice(0, 12), pesos1);
  const digito2 = calcularDigitoCnpj(digits.slice(0, 13), pesos2);

  return digits[12] === digito1 && digits[13] === digito2;
}

export function validarCpfCnpj(valor: string): boolean {
  const normalizado = apenasDigitos(valor);

  if (normalizado.length === 11) {
    return validarCpf(normalizado);
  }

  if (normalizado.length === 14) {
    return validarCnpj(normalizado);
  }

  return false;
}

export function normalizarCpfCnpj(valor: string): string {
  return apenasDigitos(valor);
}
