import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { dashboardApi } from '../api/dashboard.api';
import { ProximoVencimento } from '../api/types';
import { ParcelaCalendario } from '../components/parcela/ParcelaCalendario';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Parcela } from '../api/types';

export function Agenda() {
  const [dias, setDias] = useState(30);
  const [vencimentos, setVencimentos] = useState<ProximoVencimento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    dashboardApi
      .buscarProximosVencimentos(dias)
      .then(setVencimentos)
      .finally(() => setCarregando(false));
  }, [dias]);

  const parcelas: Parcela[] = vencimentos.map((v) => ({
    id: v.parcelaId,
    numero: v.numero,
    valorOriginal: v.valorOriginal,
    valorMulta: 0,
    valorJuros: 0,
    valorAtualizado: v.valorOriginal,
    dataVencimento: v.dataVencimento,
    status: 'PENDENTE',
    contrato: {
      id: '',
      numero: v.contratoNumero,
      cliente: { id: '', nome: v.clienteNome, cpfCnpj: '' },
    },
  }));

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Form.Label className="mb-0">Próximos</Form.Label>
        <Form.Select style={{ width: 120 }} value={dias} onChange={(e) => setDias(Number(e.target.value))}>
          <option value={7}>7 dias</option>
          <option value={15}>15 dias</option>
          <option value={30}>30 dias</option>
        </Form.Select>
      </div>

      {carregando ? <LoadingSpinner /> : <ParcelaCalendario parcelas={parcelas} />}
    </>
  );
}
