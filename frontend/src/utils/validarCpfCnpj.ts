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
  if (digits.length !== 11 || new Set(digits).size === 1) return false;
  const d1 = calcularDigitoCpf(digits.slice(0, 9), 10);
  const d2 = calcularDigitoCpf(digits.slice(0, 10), 11);
  return digits[9] === d1 && digits[10] === d2;
}

function calcularDigitoCnpj(digits: number[], pesos: number[]): number {
  const soma = digits.reduce((acc, digit, index) => acc + digit * pesos[index], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCnpj(cnpj: string): boolean {
  const digits = apenasDigitos(cnpj).split('').map(Number);
  if (digits.length !== 14 || new Set(digits).size === 1) return false;
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return digits[12] === calcularDigitoCnpj(digits.slice(0, 12), p1) &&
    digits[13] === calcularDigitoCnpj(digits.slice(0, 13), p2);
}

export function validarCpfCnpj(valor: string): boolean {
  const n = apenasDigitos(valor);
  if (n.length === 11) return validarCpf(n);
  if (n.length === 14) return validarCnpj(n);
  return false;
}
