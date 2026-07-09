import { adicionarMeses } from './formatarData';

export interface ParcelaComJuros {
  numero: number;
  valorPrincipal: number;
  valorJuros: number;
  valorTotal: number;
  vencimento: string;
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Acréscimo percentual sobre o valor total, dividido igualmente entre as parcelas. */
export function gerarParcelasComJuros(
  valorFinanciado: number,
  numParcelas: number,
  dataInicio: Date,
  taxaJurosMes: number
): ParcelaComJuros[] {
  if (numParcelas < 1 || valorFinanciado <= 0) return [];

  const totalJuros = arredondar(valorFinanciado * (taxaJurosMes / 100));
  const valorComJuros = arredondar(valorFinanciado + totalJuros);

  const valorParcelaBase = arredondar(valorComJuros / numParcelas);
  const principalBase = arredondar(valorFinanciado / numParcelas);
  const jurosBase = arredondar(totalJuros / numParcelas);

  let somaTotal = 0;
  let somaPrincipal = 0;
  let somaJuros = 0;
  const parcelas: ParcelaComJuros[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const isUltima = i === numParcelas;
    const valorTotal = isUltima ? arredondar(valorComJuros - somaTotal) : valorParcelaBase;
    const valorPrincipal = isUltima ? arredondar(valorFinanciado - somaPrincipal) : principalBase;
    const valorJurosParcela = isUltima ? arredondar(totalJuros - somaJuros) : jurosBase;

    somaTotal = arredondar(somaTotal + valorTotal);
    somaPrincipal = arredondar(somaPrincipal + valorPrincipal);
    somaJuros = arredondar(somaJuros + valorJurosParcela);

    parcelas.push({
      numero: i,
      valorPrincipal,
      valorJuros: valorJurosParcela,
      valorTotal,
      vencimento: adicionarMeses(dataInicio, i - 1).toISOString().split('T')[0],
    });
  }

  return parcelas;
}
