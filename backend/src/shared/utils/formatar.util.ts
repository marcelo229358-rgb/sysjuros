export function formatarMoeda(valor: number | string | { toString(): string }): string {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
}

export function formatarData(data: Date | string): string {
  const valor = typeof data === 'string' ? new Date(data) : data;
  return valor.toLocaleDateString('pt-BR');
}
