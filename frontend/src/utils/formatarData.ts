export function formatarData(data: string | Date): string {
  const valor = typeof data === 'string' ? new Date(data) : data;
  return valor.toLocaleDateString('pt-BR');
}

export function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export function adicionarMeses(data: Date, meses: number): Date {
  const result = new Date(data);
  result.setMonth(result.getMonth() + meses);
  return result;
}
