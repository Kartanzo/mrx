'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  mes_label: string;
  receita: number;
  despesa: number;
}

interface Props {
  data: DataPoint[];
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-white/60 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'receita' ? 'Receita' : 'Despesa'}: {formatCurrency(p.value)}
        </p>
      ))}
      <p className="text-white/40 text-xs mt-1 border-t border-white/10 pt-1">
        Saldo: {formatCurrency((payload[0]?.value ?? 0) - (payload[1]?.value ?? 0))}
      </p>
    </div>
  );
};

export default function RevenueChart({ data }: Props) {
  const parsed = data.map(d => ({
    ...d,
    receita: parseFloat(String(d.receita)) || 0,
    despesa: parseFloat(String(d.despesa)) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={parsed} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="mes_label"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          formatter={v => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{v === 'receita' ? 'Receita' : 'Despesa'}</span>}
        />
        <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
