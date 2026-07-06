import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from 'react-bootstrap/Card';
import { ContratoPorStatus } from '../../api/types';

const CORES = ['#198754', '#dc3545', '#0d6efd', '#6c757d'];

interface Props {
  dados: ContratoPorStatus[];
}

export function GraficoContratosStatus({ dados }: Props) {
  const chartData = dados.filter((d) => d.quantidade > 0);

  return (
    <Card className="h-100" data-testid="grafico-contratos-status">
      <Card.Header>Contratos por status</Card.Header>
      <Card.Body style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="quantidade"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={90}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={CORES[index % CORES.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
