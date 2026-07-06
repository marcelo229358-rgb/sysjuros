import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from 'react-bootstrap/Card';
import { RecebimentoMensal } from '../../api/types';
import { formatarMesAno } from '../../utils/formatarData';
import { formatarMoeda } from '../../utils/formatarMoeda';

interface Props {
  dados: RecebimentoMensal[];
}

export function GraficoRecebimentos({ dados }: Props) {
  const chartData = dados.map((item) => ({
    ...item,
    label: formatarMesAno(item.mes),
  }));

  return (
    <Card className="h-100" data-testid="grafico-recebimentos-mensais">
      <Card.Header>Recebimentos mensais</Card.Header>
      <Card.Body style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis tickFormatter={(v) => `R$${v}`} fontSize={12} />
            <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} />
            <Bar dataKey="totalRecebido" fill="#0d6efd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
