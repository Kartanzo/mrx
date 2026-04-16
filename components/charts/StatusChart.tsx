'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  status: string;
  total: number;
}

interface Props {
  data: DataPoint[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  em_aberto: { label: 'Em Aberto', color: '#f59e0b' },
  aprovacao_automatica: { label: 'Aprov. Automática', color: '#3b82f6' },
  aprovado_usuario: { label: 'Aprov. Usuário', color: '#10b981' },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
      <p style={{ color: d.payload.fill }} className="font-semibold">{d.name}</p>
      <p className="text-white/60">{d.value} transações</p>
    </div>
  );
};

export default function StatusChart({ data }: Props) {
  const parsed = data.map(d => ({
    name: STATUS_CONFIG[d.status]?.label ?? d.status,
    value: parseInt(String(d.total)),
    fill: STATUS_CONFIG[d.status]?.color ?? '#6b7280',
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={parsed}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {parsed.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={v => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{v}</span>}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
