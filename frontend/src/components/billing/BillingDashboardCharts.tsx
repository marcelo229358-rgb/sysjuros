import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1'];

interface ChartPoint {
  date?: string;
  month?: string;
  value?: number;
  subscribers?: number;
  name?: string;
}

interface Props {
  revenueChart: ChartPoint[];
  growthChart: ChartPoint[];
  plansChart: ChartPoint[];
}

export function BillingDashboardCharts({ revenueChart, growthChart, plansChart }: Props) {
  return (
    <div className="row g-3 mt-1">
      <div className="col-lg-8">
        <div className="billing-chart-card">
          <h6 className="billing-chart-title">Receita por período (mês atual)</h6>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `R$ ${Number(v ?? 0).toFixed(2)}`} />
              <Area type="monotone" dataKey="value" stroke="#0d6efd" fill="#0d6efd33" name="Receita" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="billing-chart-card">
          <h6 className="billing-chart-title">Distribuição de planos</h6>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={plansChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {plansChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="col-12">
        <div className="billing-chart-card">
          <h6 className="billing-chart-title">Crescimento de assinantes</h6>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={growthChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="subscribers" fill="#198754" name="Assinantes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
