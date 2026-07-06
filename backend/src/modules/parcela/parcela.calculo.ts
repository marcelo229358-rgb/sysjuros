interface ParametrosCalculo {
  valorOriginal: number;
  dataVencimento: Date;
  dataReferencia: Date;
  taxaJurosMes: number;
  taxaMulta: number;
}

export function calcularValorAtualizado(params: ParametrosCalculo) {
  const { valorOriginal, dataVencimento, dataReferencia, taxaJurosMes, taxaMulta } = params;

  const diasAtraso = Math.max(
    0,
    Math.floor((dataReferencia.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (diasAtraso === 0) {
    return { valorMulta: 0, valorJuros: 0, valorAtualizado: valorOriginal, diasAtraso: 0 };
  }

  const valorMulta = valorOriginal * (taxaMulta / 100);
  const taxaDiaria = taxaJurosMes / 100 / 30;
  const valorJuros = valorOriginal * taxaDiaria * diasAtraso;
  const valorAtualizado = valorOriginal + valorMulta + valorJuros;

  return { valorMulta, valorJuros, valorAtualizado, diasAtraso };
}
