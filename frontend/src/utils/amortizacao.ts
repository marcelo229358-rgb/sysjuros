export type ModoAmortizacao = 'TOTAL' | 'PARCELA_ESPECIFICA';

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

interface ParcelaSaldo {
  id: string;
  numero: number;
  valorOriginal: number;
}

export interface ParcelaAmortizada {
  id: string;
  valorOriginal: number;
  valorAtualizado: number;
}

export function redistribuirSaldoPendentes(
  pendentes: ParcelaSaldo[],
  novoTotal: number
): ParcelaAmortizada[] {
  if (pendentes.length === 0) return [];

  const total = Math.max(0, arredondar(novoTotal));
  const valorParcela = arredondar(total / pendentes.length);
  let soma = 0;
  const resultado: ParcelaAmortizada[] = [];

  for (let i = 0; i < pendentes.length; i++) {
    const isUltima = i === pendentes.length - 1;
    const valor = isUltima ? arredondar(total - soma) : valorParcela;
    soma += valor;
    resultado.push({
      id: pendentes[i].id,
      valorOriginal: valor,
      valorAtualizado: valor,
    });
  }

  return resultado;
}

export function calcularAmortizacao(
  pendentes: ParcelaSaldo[],
  valor: number,
  modo: ModoAmortizacao,
  parcelaNumero?: number
): ParcelaAmortizada[] {
  const valorAmortizar = arredondar(valor);
  if (valorAmortizar <= 0 || pendentes.length === 0) return [];

  const ordenadas = [...pendentes].sort((a, b) => a.numero - b.numero);

  if (modo === 'PARCELA_ESPECIFICA') {
    const alvo = ordenadas.find((p) => p.numero === parcelaNumero) ?? ordenadas[0];
    const novoValor = Math.max(0, arredondar(alvo.valorOriginal - valorAmortizar));
    return [{ id: alvo.id, valorOriginal: novoValor, valorAtualizado: novoValor }];
  }

  const totalAtual = ordenadas.reduce((s, p) => s + p.valorOriginal, 0);
  const novoTotal = Math.max(0, arredondar(totalAtual - valorAmortizar));
  return redistribuirSaldoPendentes(ordenadas, novoTotal);
}
