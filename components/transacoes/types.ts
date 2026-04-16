export interface Transacao {
  id: string;
  data: string;
  descricao: string;
  valor: string;
  tipo_de_movimento: string;
  envolvido: string;
  descricao_extra: string | null;
  chave_matching: string | null;
  placa: string | null;
  aprovado: boolean | null;
  aprovado_em: string | null;
  comprovante: string | null;
}

export interface Anexo {
  id_anexo: string;
  id_cliente: string;
  data_hora: string;
  valor: string;
}

export interface GrupoAnual {
  ano: number;
  meses: GrupoMensal[];
  totalReceita: number;
  totalDespesa: number;
}

export interface GrupoMensal {
  mes: number;
  mesLabel: string;
  dias: GrupoDiario[];
  totalReceita: number;
  totalDespesa: number;
}

export interface GrupoDiario {
  dia: string; // YYYY-MM-DD
  diaLabel: string;
  transacoes: Transacao[];
  totalReceita: number;
  totalDespesa: number;
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function agrupar(rows: Transacao[]): GrupoAnual[] {
  const map = new Map<number, Map<number, Map<string, Transacao[]>>>();

  for (const t of rows) {
    const d = new Date(t.data);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const dia = d.toISOString().slice(0, 10);

    if (!map.has(ano)) map.set(ano, new Map());
    const mMap = map.get(ano)!;
    if (!mMap.has(mes)) mMap.set(mes, new Map());
    const dMap = mMap.get(mes)!;
    if (!dMap.has(dia)) dMap.set(dia, []);
    dMap.get(dia)!.push(t);
  }

  const result: GrupoAnual[] = [];
  for (const [ano, mMap] of [...map.entries()].sort((a, b) => b[0] - a[0])) {
    const meses: GrupoMensal[] = [];
    for (const [mes, dMap] of [...mMap.entries()].sort((a, b) => b[0] - a[0])) {
      const dias: GrupoDiario[] = [];
      for (const [dia, ts] of [...dMap.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
        const tRec = ts.filter(t => t.tipo_de_movimento === 'Receita').reduce((s, t) => s + Number(t.valor), 0);
        const tDesp = ts.filter(t => t.tipo_de_movimento === 'Despesa').reduce((s, t) => s + Number(t.valor), 0);
        const [, , d] = dia.split('-');
        dias.push({ dia, diaLabel: `${d}/${mes + 1 < 10 ? '0' : ''}${mes + 1}/${ano}`, transacoes: ts, totalReceita: tRec, totalDespesa: tDesp });
      }
      const tRec = dias.reduce((s, d) => s + d.totalReceita, 0);
      const tDesp = dias.reduce((s, d) => s + d.totalDespesa, 0);
      meses.push({ mes, mesLabel: MESES[mes], dias, totalReceita: tRec, totalDespesa: tDesp });
    }
    result.push({ ano, meses, totalReceita: meses.reduce((s, m) => s + m.totalReceita, 0), totalDespesa: meses.reduce((s, m) => s + m.totalDespesa, 0) });
  }
  return result;
}

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
