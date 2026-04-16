export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: 'superuser' | 'admin' | 'operador';
  ativo: boolean;
  criado_em: string;
}

export interface Transacao {
  id: string;
  data: string;
  descricao: string | null;
  valor: string;
  tipo_de_movimento: string | null;
  envolvido: string;
  data_processamento: string | null;
  descricao_extra: string | null;
  chave_matching: string | null;
  status_pagamento?: StatusPagamento;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  observacao?: string | null;
  id_cliente?: string | null;
  nome_cliente?: string | null;
}

export type StatusPagamento = 'em_aberto' | 'aprovacao_automatica' | 'aprovado_usuario';

export interface TransacaoStatus {
  id: string;
  status_pagamento: StatusPagamento;
  aprovado_por: string | null;
  aprovado_em: string | null;
  observacao: string | null;
  updated_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  perfil: string;
  nome: string;
}
